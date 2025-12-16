export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // Manchmal kommt 'row' direkt als Objekt, manchmal in 'data' verpackt
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Platform & Identifiers
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

    // 3. Text & Info
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : (item.body || "");
    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || (item.advertiser && item.advertiser.page_info && item.advertiser.page_info.profile_photo) || null;

    // --- INTELLIGENTE DATEN-EXTRAKTION (HIER WAR DER FEHLER) ---
    let demographics = [];
    let reach = 0;
    let targetLocations = [];
    let targetAges = [];
    let targetGender = 'All';
    let transparencyRegions = [];
    let detailedBreakdown = []; // WICHTIG: Das fehlte!

    // Funktion um Daten aus den verschachtelten Facebook-Strukturen zu holen
    const extractTransparencyData = (infoSource) => {
        if (!infoSource) return;

        // Reichweite
        if (infoSource.eu_total_reach) reach = infoSource.eu_total_reach;
        
        // Demografie (Alter/Geschlecht Breakdown)
        if (infoSource.age_country_gender_reach_breakdown) {
            demographics = infoSource.age_country_gender_reach_breakdown;

            // NEU: Flattening für die Tabelle (Das hat gefehlt!)
            detailedBreakdown = demographics.flatMap(d => {
                return d.age_gender_breakdowns.map(b => ({
                    location: d.country,
                    age_range: b.age_range,
                    gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'),
                    reach: (b.male || 0) + (b.female || 0) + (b.unknown || 0)
                }));
            });
        }

        // Zielorte
        if (infoSource.location_audience && Array.isArray(infoSource.location_audience)) {
            targetLocations = infoSource.location_audience.map(l => l.name);
        }

        // Geschlecht
        if (infoSource.gender_audience) targetGender = infoSource.gender_audience;

        // Alter
        if (infoSource.age_audience) {
             const min = infoSource.age_audience.min || 18;
             const max = infoSource.age_audience.max || 65;
             targetAges = [`${min}-${max}`];
        }
    };

    // Wir schauen ÜBERALL nach Daten
    if (item.aaa_info) {
        extractTransparencyData(item.aaa_info);
    } 
    
    if (item.transparency_by_location && item.transparency_by_location.eu_transparency) {
        // Falls aaa_info leer war oder wir mehr Daten wollen
        if (demographics.length === 0) extractTransparencyData(item.transparency_by_location.eu_transparency);
        
        // Regionen für das Modal vorbereiten
        transparencyRegions.push({
            region: "European Union",
            description: "Targeting data from EU Transparency.",
            breakdown: detailedBreakdown, // WICHTIG: Hier muss der Breakdown rein!
            ...item.transparency_by_location.eu_transparency
        });
    }

    // Fallbacks falls oben nichts gefunden wurde
    if (!reach) reach = item.reach_estimate || item.impressions || 0;
    
    // Targeting Objekt zusammenbauen
    const targeting = {
        ages: targetAges.length > 0 ? targetAges : ['18-65+'],
        genders: [targetGender],
        locations: targetLocations.length > 0 ? targetLocations : ['Global'],
        reach_estimate: Number(reach),
        breakdown: detailedBreakdown // WICHTIG: Das füllt die Tabelle!
    };

    // 4. Metrics Calculation (Viral Score)
    let likes = item.likes || item.page_like_count || 0;
    // Wenn keine Likes im Hauptobjekt, suche im Advertiser/Page Info
    if (!likes && item.advertiser && item.advertiser.ad_library_page_info && item.advertiser.ad_library_page_info.page_info) {
        likes = item.advertiser.ad_library_page_info.page_info.likes || 0;
    }

    let efficiencyScore = item.efficiency_score;
    
    // Score berechnen wenn nicht vorhanden
    if (efficiencyScore === undefined || efficiencyScore === null || efficiencyScore > 100) {
        const safeReach = Number(reach) || 0;
        const safeLikes = Math.max(Number(likes), 1000); // Basisgröße
        
        // Einfache Heuristik: Verhältnis von Reichweite zu Seitengröße
        const ratio = safeReach / safeLikes;
        
        // Logarithmische Skala 0-100
        efficiencyScore = Math.min(Math.round(15 * Math.log2(1 + ratio)), 100);
    }

    // --- OUTPUT ---
    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      isActive: item.is_active !== false,
      publisher_platform: platforms,
      start_date: item.start_date_formatted || item.start_date || new Date().toISOString(),
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      
      // Metriken
      likes: Number(likes),
      reach: Number(reach), 
      impressions: Number(reach),
      efficiency_score: Number(efficiencyScore),
      
      // WICHTIG: Hier werden die extrahierten Daten übergeben
      demographics: demographics, // Das füllt die Diagramme
      targeting: targeting,       // Das füllt die Listen & Tabelle
      transparency_regions: transparencyRegions,

      // Meta Infos
      disclaimer: item.disclaimer_label || null,
      advertiser_info: item.advertiser ? item.advertiser.page : {},
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};