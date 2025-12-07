export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // API liefert Daten manchmal direkt, manchmal in 'data' wrapper
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Plattform Case-Insensitive machen
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());

    // 2. Media Extraction
    let mediaType = 'image';
    let mediaUrl = null;
    let poster = null;

    // Prüfe CamelCase und SnakeCase Pfade
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
    safeBody = safeBody.replace(/\{\{.*?\}\}/g, '').trim();

    const pageName = snap.page_name || item.page_name || item.pageName || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || item.page_profile_picture_url || item.pageProfilePictureUrl || null;

    // 4. Datum
    let isoDate = new Date().toISOString();
    const rawDate = item.start_date || item.startDate;
    if (rawDate) {
        try {
            const dateVal = typeof rawDate === 'number' ? rawDate * 1000 : rawDate;
            isoDate = new Date(dateVal).toISOString();
        } catch (e) {}
    }

    // 5. Metriken & Targeting (Der entscheidende Fix!)
    const likes = item.likes || item.page_like_count || item.pageLikeCount || 0;
    
    // Reichweite: Wir prüfen ALLE möglichen Felder (Doku vs. Realität)
    // HIER IST DEIN PUNKT: reachEstimate aus der Doku wird explizit geprüft!
    let reach = item.reachEstimate || item.reach_estimate || null;
    
    // Falls Reach leer ist, prüfen wir Impressions
    if (!reach && (item.impressions_with_index || item.impressionsWithIndex)) {
        const impObj = item.impressions_with_index || item.impressionsWithIndex;
        const idx = impObj.impressions_index ?? impObj.impressionsIndex ?? -1;
        if (idx > -1) reach = idx;
    }

    const spend = item.spend || null;

    // EU & Targeting Daten sammeln
    const locations = item.targeted_or_reached_countries || item.targetedOrReachedCountries || item.countries || [];
    const ages = item.target_ages ? [item.target_ages] : (item.targetAges ? [item.targetAges] : []);
    const genders = item.gender ? [item.gender] : (item.genders || []);
    
    // Breakdown Daten (Doku sagt oft euAudience, JSON sagt demographic_distribution)
    const breakdown = item.demographic_distribution || item.demographicDistribution || item.eu_audience_data || item.euAudienceData || [];

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
      impressions: reach, 
      spend,

      targeting,
      // Mapping für EU Daten falls vorhanden (manche Scraper nennen es 'eu_data')
      transparency_regions: item.eu_data || item.euData || [], 
      
      page_categories: snap.page_categories || item.categories || [],
      disclaimer: item.disclaimer_label || item.disclaimerLabel || item.byline || null,
      advertiser_info,
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};