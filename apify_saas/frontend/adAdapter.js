/**
 * adAdapter.js
 * VERSION: FIXED - Reach, Location, Carousel Images & Real IDs
 */

const CPR_CORRECTION_FACTOR = 150.0;
const SEGMENT_BASELINES = { CTA: { 'SHOP_NOW': 15, 'LEARN_MORE': 25, 'SIGN_UP': 20, 'DEFAULT': 20 } };
const FALLBACK_BENCHMARKS = { "GLOBAL_All_All": 4.50, "DE_All_All": 6.00, "US_All_All": 12.00, "CH_All_All": 10.00, "AT_All_All": 5.50, "FR_All_All": 5.00, "GB_All_All": 7.00 };

const getBenchmarkPrice = (country, priorityMap) => {
    const key = `${country}_All_All`;
    const globalKey = `GLOBAL_All_All`;
    if (priorityMap) {
        if (priorityMap[key] !== undefined) return priorityMap[key] * CPR_CORRECTION_FACTOR;
        if (priorityMap[globalKey] !== undefined) return priorityMap[globalKey] * CPR_CORRECTION_FACTOR;
    }
    return FALLBACK_BENCHMARKS[key] || FALLBACK_BENCHMARKS["GLOBAL_All_All"]; 
};

export const cleanAndTransformData = (dbRows, benchmarkMap = null) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // 1. Daten sicher entpacken
    let item = row;
    if (row.data && typeof row.data === 'object') {
        item = { ...row.data, ...row }; 
    }

    if (!item || typeof item !== 'object') return null;

    // Sicherheits-Check: Wenn das Item schon transformiert aussieht, gib es direkt zurück
    if (item.efficiency_score !== undefined && item.transparency_regions) return item;

    const snap = item.snapshot || {};
    
    // 2. ID Handling: Nutze echte ad_archive_id
    const rawId = item.ad_archive_id || item.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const id = String(rawId);
    
    let platforms = item.publisher_platform || [];
    if (!platforms || platforms.length === 0) platforms = ['facebook', 'instagram'];
    platforms = platforms.map(p => p.toLowerCase());

    // 3. Datum
    let isoDate = new Date().toISOString();
    const rawDate = item.start_date || snap.creation_time || item.startDate;
    if (rawDate) {
        try {
            const dateVal = (typeof rawDate === 'number' && rawDate < 10000000000) ? rawDate * 1000 : rawDate;
            const parsedDate = new Date(dateVal);
            if (!isNaN(parsedDate.getTime())) isoDate = parsedDate.toISOString();
        } catch (e) {}
    }

    // 4. Page Name & Content (Priorität auf Root-Level, da oft genauer)
    const pageName = item.page_name || snap.page_name || item.pageName || "Unknown Page";
    const bodyText = (snap.body && snap.body.markup) ? snap.body.markup : (snap.body ? snap.body.text : "") || "";
    const safeBody = bodyText;
    const safeAvatar = item.page_profile_picture_url || snap.page_profile_picture_url || null;
    const ctaText = snap.cta_text || "Learn More";
    const linkUrl = snap.link_url || "#";

    // 5. Media Handling (Carousel Fix - Holt Bilder aus Cards wenn nötig)
    let mediaType = 'image';
    let videos = snap.videos || [];
    let images = snap.images || [];
    const cards = snap.cards || [];

    if (images.length === 0 && videos.length === 0 && cards.length > 0) {
        mediaType = 'carousel';
        // Extract images from cards
        images = cards
            .filter(c => c.resized_image_url || c.original_image_url)
            .map(c => ({
                resized_image_url: c.resized_image_url || c.original_image_url,
                original_image_url: c.original_image_url
            }));
        
        // Versuche Video aus Cards zu holen
        const cardVideos = cards
            .filter(c => c.video_hd_url || c.video_sd_url)
            .map(c => ({
                 video_hd_url: c.video_hd_url || c.video_sd_url,
                 video_preview_image_url: c.video_preview_image_url
            }));
            
        if (cardVideos.length > 0) {
            videos = cardVideos;
            mediaType = 'video';
        }
    } else if (videos.length > 0) {
        mediaType = 'video';
    }

    // 6. Targeting & Reach (WICHTIG: Prüft transparency_by_location zuerst!)
    let demographics = [];
    let reach = 0;
    let targetLocations = ['Global'];
    let targetAges = ['18-65+'];
    let targetGender = 'All';
    let detailedBreakdown = [];

    // FIX: Explizite Suche nach transparency_by_location.eu_transparency
    let transparency = null;
    if (item.transparency_by_location && item.transparency_by_location.eu_transparency) {
        transparency = item.transparency_by_location.eu_transparency;
    } else if (item.eu_transparency) {
        transparency = item.eu_transparency;
    } else if (snap.eu_transparency) {
        transparency = snap.eu_transparency;
    }
    
    if (transparency) {
        reach = transparency.eu_total_reach || 0;
        
        if (transparency.age_audience) {
            const min = transparency.age_audience.min || 18;
            const max = transparency.age_audience.max || 65;
            targetAges = [`${min}-${max}${max >= 65 ? '+' : ''}`];
        }

        if (transparency.gender_audience) targetGender = transparency.gender_audience;

        if (transparency.location_audience && Array.isArray(transparency.location_audience)) {
            targetLocations = transparency.location_audience.map(l => l.name);
        }

        if (transparency.age_country_gender_reach_breakdown) {
            demographics = transparency.age_country_gender_reach_breakdown;
        }
    } else {
        // Fallback wenn keine Transparency Daten da sind
        if (item.reach_estimate) reach = item.reach_estimate;
    }

    // 7. Spend Calculation
    let totalEstimatedSpend = 0;
    if (demographics && demographics.length > 0) {
        detailedBreakdown = demographics.flatMap(d => {
            if (d.age_gender_breakdowns) {
                return d.age_gender_breakdowns.map(b => {
                    const segReach = (b.male || 0) + (b.female || 0) + (b.unknown || 0);
                    // Prevent NaN but keep 0 if valid
                    if (segReach === undefined || segReach === null) return null;
                    
                    const segmentCPR = getBenchmarkPrice(d.country, benchmarkMap);
                    totalEstimatedSpend += (segReach / 1000) * segmentCPR;
                    return { 
                        location: d.country || 'Unknown', 
                        age_range: b.age_range, 
                        gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'), 
                        reach: segReach 
                    };
                }).filter(x => x !== null);
            }
            return [];
        });
    }

    const safeReach = Number(reach) || 0;
    if (totalEstimatedSpend === 0 && safeReach > 0) {
        const fallbackCPR = getBenchmarkPrice("GLOBAL", benchmarkMap); 
        totalEstimatedSpend = (safeReach / 1000) * fallbackCPR;
    }

    // 8. Viral Score
    let viralScore = 0;
    let daysActive = 1;
    try {
        const d = new Date(isoDate);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    } catch(e) {}
    daysActive = Math.max(daysActive, 1);

    const dailyMediaValue = totalEstimatedSpend / daysActive;
    const ctaKey = (ctaText || "DEFAULT").toUpperCase().replace(/\s+/g, '_');
    
    const baseExpectation = SEGMENT_BASELINES.CTA[ctaKey] || SEGMENT_BASELINES.CTA.DEFAULT;
    
    const performanceRatio = dailyMediaValue / baseExpectation;
    if (performanceRatio > 0) {
        if (performanceRatio < 0.2) viralScore = performanceRatio * 100; 
        else viralScore = 50 + (Math.log2(performanceRatio) * 15);
    }
    
    if (mediaType === 'video') viralScore += 5;
    if (safeReach > 10000 && viralScore < 20) viralScore = 20;
    viralScore = Math.max(0, Math.min(100, Math.round(viralScore)));

    return {
      id: id,
      isActive: item.is_active !== false,
      publisher_platform: platforms,
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: snap.page_profile_uri || "#",
      ad_library_url: `https://www.facebook.com/ads/library/?id=${id}`,
      snapshot: { ...snap, body: { text: safeBody }, images, videos, cta_text: ctaText, link_url: linkUrl }, 
      likes: 0,
      reach: safeReach, 
      impressions: safeReach,
      spend: totalEstimatedSpend,
      efficiency_score: Number(viralScore),
      demographics: demographics, 
      targeting: { 
          ages: targetAges, 
          genders: [targetGender], 
          locations: targetLocations, 
          reach_estimate: safeReach, 
          breakdown: detailedBreakdown 
      },
      // WICHTIG: Hier füllen wir die Transparency Regions korrekt auf für das Modal
      transparency_regions: [{ 
          region: "EU", 
          breakdown: detailedBreakdown,
          locations: targetLocations,
          ages: targetAges,
          genders: [targetGender],
          reach_estimate: safeReach,
          description: transparency?.targets_eu ? "Targeting European Union" : ""
      }],
      advertiser_info: { about_text: pageName },
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};