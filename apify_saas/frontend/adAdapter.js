/**
 * adAdapter.js
 * VERSION: Robust & JSON-Compatible
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
    const key = `${country}_All_All`;
    const globalKey = `GLOBAL_All_All`;

    if (priorityMap) {
        if (priorityMap[key] !== undefined) return priorityMap[key] * CPR_CORRECTION_FACTOR;
        if (priorityMap[globalKey] !== undefined) return priorityMap[globalKey] * CPR_CORRECTION_FACTOR;
    }

    if (FALLBACK_BENCHMARKS[key] !== undefined) return FALLBACK_BENCHMARKS[key];
    return FALLBACK_BENCHMARKS["GLOBAL_All_All"]; 
};

export const cleanAndTransformData = (dbRows, benchmarkMap = null) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // 1. Daten entpacken: Manchmal kommen sie direkt, manchmal in 'data' gewrappt
    let item = row;
    if (row.data) {
        item = { ...row.data, ...row }; // Merge, um ID zu behalten
    }

    // Safety Check: Ist das Item überhaupt valide?
    if (!item || typeof item !== 'object') return null;

    // 2. Snapshot extrahieren (Das Herzstück der Daten)
    const snap = item.snapshot || {};
    
    // 3. ID und Plattformen sicherstellen
    // Die JSON zeigt: ad_archive_id ist die ID.
    const id = item.ad_archive_id || item.id || `temp_${Math.random()}`;
    
    // Plattformen sind oft nicht explizit in der JSON. Wir raten basierend auf dem Link oder Default.
    // In deiner JSON gab es kein 'publisher_platform' Feld, daher müssen wir fallbacken.
    let platforms = item.publisher_platform || [];
    if (!platforms || platforms.length === 0) {
        // Fallback: Wenn wir es nicht wissen, nehmen wir an, es läuft auf FB & Insta
        platforms = ['facebook', 'instagram'];
    }
    // Normalisieren
    platforms = platforms.map(p => p.toLowerCase());

    // 4. Datum parsen
    let isoDate = new Date().toISOString();
    // In deiner JSON: "start_date" (Unix Timestamp) oder "creation_time"
    const rawDate = item.start_date || snap.creation_time || item.startDate;
    if (rawDate) {
        try {
            // Unix Timestamp in Sekunden (10-stellig) vs Millisekunden (13-stellig)
            const dateVal = (typeof rawDate === 'number' && rawDate < 10000000000) ? rawDate * 1000 : rawDate;
            const parsedDate = new Date(dateVal);
            if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
                isoDate = parsedDate.toISOString();
            }
        } catch (e) {}
    }

    // 5. Text und Medien
    const bodyText = (snap.body && snap.body.markup) ? snap.body.markup : (snap.body ? snap.body.text : ""); // Deine JSON nutzt 'markup' oder 'text'
    const safeBody = bodyText || "";
    
    const pageName = snap.page_name || item.pageName || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || null;
    const ctaText = snap.cta_text || "Learn More";
    const linkUrl = snap.link_url || "#";

    // Medien-Typ bestimmen
    let mediaType = 'image';
    const videos = snap.videos || [];
    const images = snap.images || [];
    const cards = snap.cards || [];

    if (videos.length > 0) mediaType = 'video';
    else if (cards.length > 0) mediaType = 'carousel';

    // 6. Targeting & Reach (Das ist der knifflige Teil)
    // Deine JSON hat 'eu_transparency'
    let demographics = [];
    let reach = 0;
    let targetLocations = [];
    let targetAges = ['18-65+'];
    let targetGender = 'All';
    let detailedBreakdown = [];

    // Versuche, Daten aus verschiedenen Quellen zu holen
    const transparency = snap.eu_transparency || item.eu_transparency;
    
    if (transparency) {
        reach = transparency.eu_total_reach || 0;
        
        if (transparency.age_audience) {
             const min = transparency.age_audience.min || 18;
             const max = transparency.age_audience.max || 65;
             targetAges = [`${min}-${max}${max === 65 ? '+' : ''}`];
        }
        
        if (transparency.gender_audience) targetGender = transparency.gender_audience;
        
        if (transparency.location_audience && Array.isArray(transparency.location_audience)) {
            targetLocations = transparency.location_audience.map(l => l.name);
        }

        if (transparency.age_country_gender_reach_breakdown) {
            demographics = transparency.age_country_gender_reach_breakdown;
        }
    }

    // Fallback Reach, falls nicht in Transparency
    if (!reach) reach = item.reach_estimate || 0;


    // --- WERT BERECHNUNG ---
    let totalEstimatedSpend = 0;
    
    // Berechne Spend basierend auf Demographics (genau wie vorher)
    if (demographics && demographics.length > 0) {
        detailedBreakdown = demographics.flatMap(d => {
            if (d.age_gender_breakdowns) {
                return d.age_gender_breakdowns.map(b => {
                    const segReach = (b.male || 0) + (b.female || 0) + (b.unknown || 0);
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

    // Fallback Spend Berechnung
    const safeReach = Number(reach) || 0;
    if (totalEstimatedSpend === 0 && safeReach > 0) {
        let mainCountry = 'GLOBAL';
        if (targetLocations.length > 0) mainCountry = targetLocations[0];
        // Versuche Ländercode zu erraten (z.B. "Germany" -> "DE")
        // Einfacher Hack: Erste 2 Buchstaben uppercase, falls wir kein Mapping haben
        // Für echte Prod-App bräuchte man ein Mapping Name -> ISO Code
        const fallbackCPR = getBenchmarkPrice("GLOBAL", benchmarkMap); 
        totalEstimatedSpend = (safeReach / 1000) * fallbackCPR;
    }

    // --- SCORE ---
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
        if (performanceRatio < 0.2) {
            viralScore = performanceRatio * 100; 
        } else {
            viralScore = 50 + (Math.log2(performanceRatio) * 15);
        }
    }
    
    if (mediaType === 'video') viralScore += 5;
    if (safeReach > 10000 && viralScore < 20) viralScore = 20;
    if (safeReach > 100000 && viralScore < 40) viralScore = 40;
    viralScore = Math.max(0, Math.min(100, Math.round(viralScore)));

    // Strukturieren für das Frontend
    return {
      id: id,
      isActive: item.is_active !== false, // Default true
      publisher_platform: platforms,
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: snap.page_profile_uri || "#",
      ad_library_url: `https://www.facebook.com/ads/library/?id=${item.ad_archive_id}`, // Link bauen
      snapshot: { 
          ...snap, 
          body: { text: safeBody },
          images: images,
          videos: videos,
          cta_text: ctaText,
          link_url: linkUrl
      }, 
      likes: 0, // Facebook gibt keine Likes mehr via API raus
      reach: safeReach, 
      impressions: safeReach,
      efficiency_score: Number(viralScore),
      demographics: demographics, 
      targeting: {
        ages: targetAges,
        genders: [targetGender],
        locations: targetLocations.length > 0 ? targetLocations : ['Global'],
        reach_estimate: safeReach,
        breakdown: detailedBreakdown
      },
      transparency_regions: [{ region: "EU", breakdown: detailedBreakdown }],
      advertiser_info: {
          about_text: item.page_name // Fallback
      },
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};