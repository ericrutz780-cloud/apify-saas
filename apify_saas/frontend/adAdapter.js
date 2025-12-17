/**
 * adAdapter.js
 * VERSION: Country-Only Benchmarks (Stabilisiert)
 * Wir ignorieren Alter/Geschlecht und nutzen nur den Länder-Preis.
 */

// Korrektur-Faktor für zu niedrige DB-Werte (Cents zu Euro)
const CPR_CORRECTION_FACTOR = 150.0;

// Baselines für den Score-Vergleich (in Euro Media-Value pro Tag)
const SEGMENT_BASELINES = {
    CTA: {
        'SHOP_NOW': 15,
        'LEARN_MORE': 25,
        'SIGN_UP': 20,
        'DEFAULT': 20
    }
};

// Fallback-Preise (falls DB leer ist) - Realistische CPMs in Euro
const FALLBACK_BENCHMARKS = {
    "GLOBAL_All_All": 4.50, 
    "DE_All_All": 6.00,
    "US_All_All": 12.00,
    "CH_All_All": 10.00,
    "AT_All_All": 5.50,
    "FR_All_All": 5.00,
    "GB_All_All": 7.00
};

const getBenchmarkPrice = (country, priorityMap) => {
    // WICHTIG: Wir suchen NUR noch nach Land + All + All
    // Das vereinfacht alles massiv.
    const key = `${country}_All_All`;
    const globalKey = `GLOBAL_All_All`;

    // 1. Suche in der Datenbank (mit Korrekturfaktor)
    if (priorityMap) {
        if (priorityMap[key] !== undefined) return priorityMap[key] * CPR_CORRECTION_FACTOR;
        if (priorityMap[globalKey] !== undefined) return priorityMap[globalKey] * CPR_CORRECTION_FACTOR;
    }

    // 2. Suche in den Fallbacks (ohne Korrektur, da Werte schon stimmen)
    if (FALLBACK_BENCHMARKS[key] !== undefined) return FALLBACK_BENCHMARKS[key];
    
    // 3. Letzte Rettung
    return FALLBACK_BENCHMARKS["GLOBAL_All_All"]; 
};

export const cleanAndTransformData = (dbRows, benchmarkMap = null) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    const itemRaw = row.data || {};
    const item = { ...itemRaw, ...row };
    
    if (!itemRaw && !row.id) return null;

    const snap = item.snapshot || {};

    // 1. Platform & Media (Unverändert)
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());
    
    let mediaType = 'image';
    const videos = snap.videos || item.videos || [];
    const images = snap.images || item.images || [];
    const cards = snap.cards || item.cards || [];

    if (videos.length > 0) mediaType = 'video';
    else if (cards.length > 0) mediaType = 'carousel';

    let safeBody = (snap.body && snap.body.text) ? snap.body.text : (item.body || "");
    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || (item.advertiser && item.advertiser.page_info && item.advertiser.page_info.profile_photo) || null;

    // --- DATUM ---
    let isoDate = new Date().toISOString(); 
    const rawDate = item.start_date || item.startDate || item.creation_time;
    if (rawDate) {
        try {
            const dateVal = (typeof rawDate === 'number' && rawDate < 10000000000) ? rawDate * 1000 : rawDate;
            const parsedDate = new Date(dateVal);
            if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1971) isoDate = parsedDate.toISOString();
        } catch (e) {}
    }

    // --- DATEN EXTRAKTION ---
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
        if ((!demographics || demographics.length === 0) && infoSource.age_country_gender_reach_breakdown) {
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

    // --- WERT BERECHNUNG (SIMPLIFIZIERT: NUR LAND) ---
    let totalEstimatedSpend = 0;

    if (demographics && demographics.length > 0) {
        detailedBreakdown = demographics.flatMap(d => {
            if (d.age_gender_breakdowns) {
                return d.age_gender_breakdowns.map(b => {
                    // Wir holen uns die echte Reichweite des Segments...
                    const segReach = (b.male || 0) + (b.female || 0) + (b.unknown || 0);
                    
                    // ...aber berechnen den Preis PAUSCHAL für das Land (Gender/Age ignoriert)
                    // Das macht die Berechnung viel stabiler!
                    const segmentCPR = getBenchmarkPrice(d.country, benchmarkMap);
                    
                    totalEstimatedSpend += (segReach / 1000) * segmentCPR;

                    return {
                        location: d.country || 'Unknown',
                        age_range: b.age_range,
                        gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'),
                        reach: segReach
                    };
                });
            }
            return [];
        });
    }
    
    const safeReach = Number(reach) || 0;
    if (totalEstimatedSpend === 0 && safeReach > 0) {
        // Fallback Logic
        let mainCountry = 'GLOBAL';
        if (item.target_locations && item.target_locations.length > 0) mainCountry = item.target_locations[0].name;
        
        const fallbackCPR = getBenchmarkPrice(mainCountry, benchmarkMap);
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

    let likes = item.likes || item.page_like_count || 0;
    if (!likes && item.advertiser?.ad_library_page_info?.page_info) {
        likes = item.advertiser.ad_library_page_info.page_info.likes || 0;
    }

    // --- SCORE LOGIK (Identisch geblieben) ---
    let viralScore = 0;
    
    // Laufzeit berechnen
    let daysActive = 1;
    try {
        const d = new Date(isoDate);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    } catch(e) {}
    daysActive = Math.max(daysActive, 1);

    // Daily Value
    const dailyMediaValue = totalEstimatedSpend / daysActive;
    
    // Baseline holen
    const ctaKey = (item.cta_text || snap.cta_text || "DEFAULT").toUpperCase().replace(/\s+/g, '_');
    const baseExpectation = SEGMENT_BASELINES.CTA[ctaKey] || SEGMENT_BASELINES.CTA.DEFAULT;
    
    // Ratio
    const performanceRatio = dailyMediaValue / baseExpectation;

    if (performanceRatio > 0) {
        if (performanceRatio < 0.2) {
            viralScore = performanceRatio * 100; // Linear für sehr kleine
        } else {
            viralScore = 50 + (Math.log2(performanceRatio) * 15); // Logarithmisch für normale
        }
    }
    
    if (mediaType === 'video') viralScore += 5;
    
    // Sicherheitsnetz
    if (safeReach > 10000 && viralScore < 20) viralScore = 20;
    if (safeReach > 100000 && viralScore < 40) viralScore = 40;

    viralScore = Math.max(0, Math.min(100, Math.round(viralScore)));

    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      isActive: item.is_active !== false,
      publisher_platform: platforms,
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      likes: Number(likes),
      reach: safeReach, 
      impressions: safeReach,
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