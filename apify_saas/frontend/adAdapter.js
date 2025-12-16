export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Platform
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());
    
    // 2. Media Extraction
    let mediaType = 'image';
    let mediaUrl = null;
    let poster = null;

    const videos = snap.videos || item.videos || [];
    const images = snap.images || item.images || [];
    const cards = snap.cards || item.cards || [];

    if (videos.length > 0) {
      mediaType = 'video';
      mediaUrl = videos[0].video_hd_url || videos[0].video_sd_url;
      poster = videos[0].video_preview_image_url;
    } else if (cards.length > 0) {
      mediaType = 'carousel';
      mediaUrl = cards[0].original_image_url || cards[0].resized_image_url;
    } else if (images.length > 0) {
      mediaType = 'image';
      mediaUrl = images[0].original_image_url || images[0].resized_image_url;
    }

    // 3. Text
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : (item.body || "");
    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || (item.advertiser && item.advertiser.page_info && item.advertiser.page_info.profile_photo) || null;

    // --- DATEN EXTRAKTION (FIX: Altes Feld + Neues Feld prüfen) ---
    // 1. Versuche Daten direkt zu laden (wie im alten Frontend)
    let demographics = item.demographics || []; 
    let reach = item.reach_estimate || item.impressions || 0;
    
    let targetLocations = [];
    let targetAges = [];
    let targetGender = 'All';
    let transparencyRegions = [];
    let detailedBreakdown = []; 

    // 2. Wenn keine direkten Demografics da sind, suche in aaa_info (Neu)
    const infoSource = item.aaa_info || (item.transparency_by_location && item.transparency_by_location.eu_transparency);

    if (infoSource) {
        if (!reach && infoSource.eu_total_reach) reach = infoSource.eu_total_reach;
        
        // Wenn wir noch keine Demografie haben, nimm die aus aaa_info
        if (demographics.length === 0 && infoSource.age_country_gender_reach_breakdown) {
            demographics = infoSource.age_country_gender_reach_breakdown;
        }

        if (infoSource.location_audience) targetLocations = infoSource.location_audience.map(l => l.name);
        if (infoSource.gender_audience) targetGender = infoSource.gender_audience;
        if (infoSource.age_audience) {
             const min = infoSource.age_audience.min || 18;
             const max = infoSource.age_audience.max || 65;
             targetAges = [`${min}-${max}`];
        }
    }

    // 3. Breakdown Tabelle erstellen (aus egal welcher Quelle wir demographics haben)
    if (demographics.length > 0) {
        detailedBreakdown = demographics.flatMap(d => {
            // Check ob die Struktur 'age_gender_breakdowns' existiert (Facebook Standard)
            if (d.age_gender_breakdowns) {
                return d.age_gender_breakdowns.map(b => ({
                    location: d.country || 'Unknown',
                    age_range: b.age_range,
                    gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'),
                    reach: (b.male || 0) + (b.female || 0) + (b.unknown || 0)
                }));
            }
            // Fallback für einfache Struktur (falls Backend anders liefert)
            return [{
                location: d.country || 'Unknown',
                age_range: 'All',
                gender: 'All',
                reach: d.reach || 0
            }];
        });
    }
    
    // Regionen für Tabs
    if (detailedBreakdown.length > 0) {
        transparencyRegions.push({
            region: "European Union",
            description: "Data from Transparency records.",
            breakdown: detailedBreakdown
        });
    }

    const targeting = {
        ages: targetAges.length > 0 ? targetAges : ['18-65+'],
        genders: [targetGender],
        locations: targetLocations.length > 0 ? targetLocations : ['Global'],
        reach_estimate: Number(reach),
        breakdown: detailedBreakdown // Das füllt die Tabelle!
    };

    // 4. Metrics
    let likes = item.likes || item.page_like_count || 0;
    if (!likes && item.advertiser && item.advertiser.ad_library_page_info && item.advertiser.ad_library_page_info.page_info) {
        likes = item.advertiser.ad_library_page_info.page_info.likes || 0;
    }

    let efficiencyScore = item.efficiency_score;
    if (efficiencyScore === undefined || efficiencyScore === null || efficiencyScore > 100) {
        const safeReach = Number(reach) || 0;
        const safeLikes = Math.max(Number(likes), 1000);
        const ratio = safeReach / safeLikes;
        efficiencyScore = Math.min(Math.round(15 * Math.log2(1 + ratio)), 100);
    }

    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      isActive: item.is_active !== false,
      publisher_platform: platforms,
      start_date: item.start_date_formatted || item.start_date || new Date().toISOString(),
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      
      likes: Number(likes),
      reach: Number(reach), 
      impressions: Number(reach),
      efficiency_score: Number(efficiencyScore),
      
      demographics, 
      targeting,
      transparency_regions: transparencyRegions,
      
      // WICHTIG: Rohdaten weitergeben für den Notfall
      aaa_info: item.aaa_info || null, 
      transparency_by_location: item.transparency_by_location || null,

      disclaimer: item.disclaimer_label || null,
      advertiser_info: item.advertiser ? item.advertiser.page : {},
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};