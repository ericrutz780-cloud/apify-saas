/**
 * adAdapter.js
 * Transformiert Rohdaten aus der DB in das Format für die UI.
 * INTEGRIERT: Neue Segment-basierte Viral-Score Logik.
 */

// --- NEU: Konfiguration für Segment-Vergleich ---
const SEGMENT_BASELINES = {
    CTA: {
        'SHOP_NOW': 50,    // Erwartet: 50€ Value/Tag (Schwer conversion-lastig)
        'LEARN_MORE': 100, // Erwartet: 100€ Value/Tag (Leichter klickbar)
        'SIGN_UP': 60,
        'DEFAULT': 80
    }
};

// --- NEU: Fallback Benchmarks & Preis-Finder ---
const FALLBACK_BENCHMARKS = {
    "GLOBAL_All_All": 4.50, 
    "DE_All_All": 6.00,
    "US_All_All": 12.00
};

const getBenchmarkPrice = (country, gender, ageRange, priorityMap) => {
    const attempts = [
        `${country}_${gender}_${ageRange}`, 
        `${country}_${gender}_All`,         
        `${country}_All_All`,               
        `GLOBAL_All_All`                    
    ];

    if (priorityMap) {
        for (const key of attempts) {
            if (priorityMap[key] !== undefined) return priorityMap[key];
        }
    }

    for (const key of attempts) {
        if (FALLBACK_BENCHMARKS[key] !== undefined) return FALLBACK_BENCHMARKS[key];
    }
    return 5.00; 
};

// --- HAUPTFUNKTION (Signatur angepasst für Benchmark-Daten) ---
export const cleanAndTransformData = (dbRows, benchmarkMap = null) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Platform (UNVERÄNDERT)
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());
    
    // 2. Media (UNVERÄNDERT - Dein Code)
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

    // 3. Text (UNVERÄNDERT)
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : (item.body || "");
    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || (item.advertiser && item.advertiser.page_info && item.advertiser.page_info.profile_photo) || null;

    // --- DATUM FIX (UNVERÄNDERT) ---
    let isoDate = new Date().toISOString(); 
    const rawDate = item.start_date || item.startDate || item.creation_time;
    
    if (rawDate) {
        try {
            const dateVal = (typeof rawDate === 'number' && rawDate < 10000000000) ? rawDate * 1000 : rawDate;
            const parsedDate = new Date(dateVal);
            if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1971) {
                isoDate = parsedDate.toISOString();
            }
        } catch (e) {
            console.warn("Date parsing error for ad:", item.id, e);
        }
    }

    // --- DATEN EXTRAKTION (UNVERÄNDERT) ---
    let demographics = item.demographics || []; 
    let reach = item.reach_estimate || item.impressions || 0;
    
    let targetLocations = [];
    let targetAges = [];
    let targetGender = 'All';
    let transparencyRegions = [];
    let detailedBreakdown = []; 

    const infoSource = item.aaa_info || (item.transparency_by_location && item.transparency_by_location.eu_transparency);

    if (infoSource) {
        if (!reach && infoSource.eu_total_reach) reach = infoSource.eu_total_reach;
        
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

    // --- NEU: WERT-BERECHNUNG (Spend Calculation) ---
    // Hier berechnen wir den "echten" Wert basierend auf deinen Benchmarks
    let totalEstimatedSpend = 0;

    if (demographics.length > 0) {
        detailedBreakdown = demographics.flatMap(d => {
            if (d.age_gender_breakdowns) {
                return d.age_gender_breakdowns.map(b => {
                    const segReach = (b.male || 0) + (b.female || 0) + (b.unknown || 0);
                    const genderLabel = b.female ? 'Female' : (b.male ? 'Male' : 'All');
                    
                    // NEU: Preis für dieses Segment holen
                    const segmentCPR = getBenchmarkPrice(d.country, genderLabel, b.age_range, benchmarkMap);
                    
                    // NEU: Wert addieren
                    totalEstimatedSpend += (segReach / 1000) * segmentCPR;

                    return {
                        location: d.country || 'Unknown',
                        age_range: b.age_range,
                        gender: b.unknown ? 'Mixed' : genderLabel,
                        reach: segReach
                    };
                });
            }
            // Fallback für alte Datenstruktur
            return [{
                location: d.country || 'Unknown',
                age_range: 'All',
                gender: 'All',
                reach: d.reach || 0
            }];
        });
    }
    
    // Fallback Spend, wenn keine Demographics da sind
    const safeReach = Number(reach) || 0;
    if (totalEstimatedSpend === 0 && safeReach > 0) {
        let mainCountry = 'GLOBAL';
        if (item.target_locations && item.target_locations.length > 0) mainCountry = item.target_locations[0].name;
        const fallbackCPR = getBenchmarkPrice(mainCountry, 'All', 'All', benchmarkMap);
        totalEstimatedSpend = (safeReach / 1000) * fallbackCPR;
    }

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
        reach_estimate: safeReach,
        breakdown: detailedBreakdown 
    };

    // 4. Metrics (UNVERÄNDERT)
    let likes = item.likes || item.page_like_count || 0;
    if (!likes && item.advertiser && item.advertiser.ad_library_page_info && item.advertiser.ad_library_page_info.page_info) {
        likes = item.advertiser.ad_library_page_info.page_info.likes || 0;
    }

    // --- NEU: SCORE LOGIK (Ersetzt den alten Block) ---
    let viralScore = 0;
    
    // A) Laufzeit berechnen
    let daysActive = 1;
    try {
        const d = new Date(isoDate);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    } catch(e) {}
    daysActive = Math.max(daysActive, 1);

    // B) Daily Value (Druck pro Tag)
    const dailyMediaValue = totalEstimatedSpend / daysActive;

    // C) Segment-Vergleich (CTA)
    const ctaKey = (item.cta_text || snap.cta_text || "DEFAULT").toUpperCase().replace(/\s+/g, '_');
    // Wir schauen, ob es ein bekanntes CTA ist, sonst Default
    const baseExpectation = SEGMENT_BASELINES.CTA[ctaKey] || SEGMENT_BASELINES.CTA.DEFAULT;

    // D) Ratio (Leistung vs. Erwartung)
    const performanceRatio = dailyMediaValue / baseExpectation;

    // E) Score Berechnung (Logarithmisch)
    if (performanceRatio > 0) {
        // 50 ist der Durchschnitt (Ratio 1.0). Verdopplung bringt +20 Punkte.
        viralScore = 50 + (Math.log2(performanceRatio) * 20);
    }
    
    // Begrenzung 0-100
    viralScore = Math.max(0, Math.min(100, Math.round(viralScore)));

    // Falls gar keine Daten da waren, bleibt Score 0 oder Fallback auf alte Logik? 
    // Wir nehmen hier strikt die neue Logik. Wenn Spend 0 -> Score 0.

    // ----------------------------------------------------

    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      isActive: item.is_active !== false,
      publisher_platform: platforms,
      // WICHTIG: Hier nutzen wir das reparierte Datum
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      
      likes: Number(likes),
      reach: Number(reach), 
      impressions: Number(reach),
      
      // HIER: Der neue Score
      efficiency_score: Number(viralScore),
      
      demographics, 
      targeting,
      transparency_regions: transparencyRegions,
      
      aaa_info: item.aaa_info || null, 
      transparency_by_location: item.transparency_by_location || null,

      disclaimer: item.disclaimer_label || null,
      advertiser_info: item.advertiser ? item.advertiser.page : {},
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};