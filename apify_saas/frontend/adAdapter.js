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
      mediaUrl = videos[0].video_hd_url || videos[0].video_sd_url || videos[0].videoHdUrl;
      poster = videos[0].video_preview_image_url || videos[0].videoPreviewImageUrl;
    } else if (cards.length > 0) {
      mediaType = 'carousel';
      mediaUrl = cards[0].original_image_url || cards[0].resized_image_url || cards[0].originalImageUrl;
    } else if (images.length > 0) {
      mediaType = 'image';
      mediaUrl = images[0].original_image_url || images[0].resized_image_url || images[0].originalImageUrl;
    }

    // 3. Text
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : (item.body || "");
    if (safeBody) safeBody = safeBody.replace(/\{\{.*?\}\}/g, '').trim();

    const pageName = snap.page_name || item.page_name || item.pageName || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || item.page_profile_picture_url || item.pageProfilePictureUrl || null;

    // 4. Date
    let isoDate = new Date().toISOString();
    const rawDate = item.start_date || item.startDate;
    if (rawDate) {
        try {
            const dateVal = typeof rawDate === 'number' ? rawDate * 1000 : rawDate;
            isoDate = new Date(dateVal).toISOString();
        } catch (e) {}
    }

    // 5. METRIKEN & SCORE
    const reach = item.reach_estimate || item.reachEstimate || item.impressions || 0;
    const likes = item.likes || item.page_like_count || 0;
    
    // NEU: Viralitäts-Daten vom Backend
    const efficiencyScore = item.efficiency_score || 0;
    const pageSize = item.page_size || 0;

    const spend = item.spend || item.spendEstimate || null;
    const locations = item.targeted_or_reached_countries || item.targetedOrReachedCountries || item.countries || [];
    const ages = item.target_ages ? [item.target_ages] : (item.targetAges ? [item.targetAges] : []);
    const genders = item.gender ? [item.gender] : (item.genders || []);
    
    // Fallback für alte Daten
    const breakdown = item.demographic_distribution || item.demographicDistribution || item.eu_audience_data || item.euAudienceData || [];

    const targeting = {
        ages,
        genders,
        locations, 
        reach_estimate: Number(reach),
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
      impressions: Number(reach), 
      reach: Number(reach), 
      spend,
      
      // NEU: Neue Felder durchreichen
      efficiency_score: Number(efficiencyScore),
      page_size: Number(pageSize),
      demographics: item.demographics || [],
      target_locations: item.target_locations || [],

      targeting,
      transparency_regions: item.eu_data || item.euData || item.eu_transparency || [], 
      
      page_categories: snap.page_categories || item.categories || [],
      disclaimer: item.disclaimer_label || item.disclaimerLabel || item.byline || null,
      advertiser_info,
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};