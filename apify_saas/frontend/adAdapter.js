export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // Daten können direkt im Row-Objekt oder in einem 'data'-Wrapper liegen
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Plattform Normalisierung (Groß-/Kleinschreibung Fix)
    // API liefert oft ["FACEBOOK"], wir brauchen "facebook"
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());

    // 2. Media Extraction (Video > Image)
    let mediaType = 'image';
    let mediaUrl = null;
    let poster = null;

    // Prüfe verschiedene Pfade für Medien
    const videos = snap.videos || item.videos || [];
    const images = snap.images || item.images || [];
    const cards = snap.cards || item.cards || [];

    if (videos.length > 0) {
      mediaType = 'video';
      mediaUrl = videos[0].video_hd_url || videos[0].video_sd_url || videos[0].videoHdUrl;
      poster = videos[0].video_preview_image_url || videos[0].videoPreviewImageUrl;
    } else if (cards.length > 0) {
      mediaType = 'carousel';
      mediaUrl = cards[0].original_image_url || cards[0].resized_image_url || cards[0].originalImageUrl;
    } else if (images.length > 0) {
      mediaType = 'image';
      mediaUrl = images[0].original_image_url || images[0].resized_image_url || images[0].originalImageUrl;
    }

    // 3. Text Cleaning
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : (item.body || "");
    // Entfernt technische Platzhalter
    safeBody = safeBody.replace(/\{\{.*?\}\}/g, '').trim();

    const pageName = snap.page_name || item.page_name || item.pageName || "Unknown Page";
    // Avatar Suche an mehreren Orten
    const safeAvatar = snap.page_profile_picture_url || item.page_profile_picture_url || item.pageProfilePictureUrl || null;

    // 4. Datum Normalisierung
    let isoDate = new Date().toISOString();
    const rawDate = item.start_date || item.startDate;
    if (rawDate) {
        try {
            // Wenn Zahl: Unix Timestamp in Sekunden -> Millisekunden
            // Wenn String: Direkt parsen
            const dateVal = typeof rawDate === 'number' ? rawDate * 1000 : rawDate;
            isoDate = new Date(dateVal).toISOString();
        } catch (e) {
            // Fallback auf heute bei Fehler
        }
    }

    // 5. Metriken (Der "N/A" Fix)
    // Wir prüfen CamelCase UND SnakeCase
    const likes = item.likes || snap.page_like_count || item.page_like_count || 0;
    
    let impressions = null;
    if (item.impressions_with_index || item.impressionsWithIndex) {
        const impObj = item.impressions_with_index || item.impressionsWithIndex;
        // Meta gibt -1 zurück, wenn keine Daten da sind
        const idx = impObj.impressions_index ?? impObj.impressionsIndex ?? -1;
        impressions = idx > -1 ? idx : null;
    }
    
    // Reichweite kann an vielen Orten stehen
    const reach = item.reach_estimate ?? item.reachEstimate ?? impressions ?? null;
    const spend = item.spend ?? null;

    // 6. Targeting & EU Daten (Der "Missing Data" Fix)
    // Wir sammeln alles ein, was wir finden können
    const locations = item.targeted_or_reached_countries || item.targetedOrReachedCountries || item.countries || [];
    const ages = item.target_ages ? [item.target_ages] : (item.targetAges ? [item.targetAges] : []);
    const genders = item.gender ? [item.gender] : (item.genders || []);
    
    // Versuche Breakdown Daten zu finden (EU Transparenz)
    const breakdown = item.demographic_distribution || item.demographicDistribution || item.eu_data || [];

    const targeting = {
        ages,
        genders,
        locations, 
        reach_estimate: reach,
        breakdown
    };

    const advertiser_info = {
        category: (snap.page_categories && snap.page_categories.length > 0) ? snap.page_categories[0] : null,
    };

    // Finales Objekt für die UI
    return {
      id: item.ad_archive_id || item.adArchiveID || item.id || Math.random().toString(),
      isActive: item.is_active !== false && item.isActive !== false,
      publisher_platform: platforms,
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || item.pageProfileUri || "#",
      ad_library_url: item.ad_library_url || item.adLibraryUrl || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      
      likes,
      impressions: reach, // Wir nutzen Reach oft als Proxy für Impressions
      spend,

      targeting,
      page_categories: snap.page_categories || item.categories || [],
      disclaimer: item.disclaimer_label || item.byline || null,
      advertiser_info,
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};