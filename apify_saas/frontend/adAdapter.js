export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // --- Media Logic ---
    let mediaType = 'image';
    let mediaUrl = null;
    let poster = null;

    if (snap.videos && snap.videos.length > 0) {
      mediaType = 'video';
      mediaUrl = snap.videos[0].video_hd_url || snap.videos[0].video_sd_url;
      poster = snap.videos[0].video_preview_image_url;
    } else if (snap.cards && snap.cards.length > 0) {
      mediaType = 'carousel';
      mediaUrl = snap.cards[0].original_image_url || snap.cards[0].resized_image_url;
    } else if (snap.images && snap.images.length > 0) {
      mediaType = 'image';
      mediaUrl = snap.images[0].original_image_url || snap.images[0].resized_image_url;
    }

    // --- Text Cleaning (Remove Shopify placeholders) ---
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : "";
    safeBody = safeBody.replace(/\{\{.*?\}\}/g, '').trim();

    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || null;

    // --- Date Logic ---
    let isoDate = new Date().toISOString();
    if (item.start_date) {
        try {
            const dateVal = typeof item.start_date === 'number' ? item.start_date * 1000 : item.start_date;
            isoDate = new Date(dateVal).toISOString();
        } catch (e) {
            // keep default
        }
    }

    // --- Metrics Logic ---
    const likes = (typeof snap.page_like_count === 'number') ? snap.page_like_count : null;
    let impressions = null;
    if (item.impressions_with_index && typeof item.impressions_with_index.impressions_index === 'number') {
        impressions = item.impressions_with_index.impressions_index > -1 ? item.impressions_with_index.impressions_index : null;
    } else if (typeof item.reach_estimate === 'number') {
        impressions = item.reach_estimate;
    }
    const spend = (typeof item.spend === 'number') ? item.spend : null;

    // --- NEW: Construct Targeting Object (from flat fields if available) ---
    // Da deine echten Daten diese Felder oft als null/leer haben, setzen wir Defaults,
    // damit die UI "N/A" oder leere Listen rendert, statt abzustürzen.
    
    const targeting = {
        ages: item.target_ages ? [item.target_ages] : [], // Falls String, pack in Array
        genders: item.gender ? [item.gender] : [],
        locations: item.targeted_or_reached_countries || [],
        reach_estimate: item.reach_estimate || null
    };

    // --- NEW: Construct Advertiser Info ---
    const advertiser_info = {
        category: (snap.page_categories && snap.page_categories.length > 0) ? snap.page_categories[0] : null,
        // Weitere Felder können hier gemappt werden, wenn die API sie liefert
    };

    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      isActive: item.is_active !== false, // Default to true if undefined
      publisher_platform: item.publisher_platform || [],
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, // Use cleaned body
      
      likes: likes || 0,
      impressions: impressions || 0,
      spend: spend || 0,

      // New Structures
      targeting,
      page_categories: snap.page_categories || [],
      disclaimer: item.disclaimer_label || item.byline || null,
      advertiser_info,
      
      // Avatar Helper (wird oft direkt im Component genutzt, aber hier zur Sicherheit)
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};