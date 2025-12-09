export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // Supabase Wrapper Handling
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Platform
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());

    // 2. Media Extraction (Original Logic)
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

    // 5. METRIKEN & REACH (HIER KOMMT DEIN BACKEND-WERT REIN)
    // Da das Backend jetzt "reach_estimate" garantiert liefert, nehmen wir es direkt.
    const reach = item.reach_estimate || item.reachEstimate || item.impressions || 0;
    const likes = item.likes || item.page_like_count || 0;

    return {
      id: item.ad_archive_id || item.adArchiveID || item.id || Math.random().toString(),
      isActive: item.is_active !== false && item.isActive !== false,
      publisher_platform: platforms,
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      
      // Metriken für UI
      likes,
      reach: Number(reach), 
      impressions: Number(reach),
      spend: item.spend,

      // Rich Data vom Backend durchreichen
      demographics: item.demographics || [],
      target_locations: item.target_locations || [],
      
      page_categories: snap.page_categories || item.categories || [],
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};