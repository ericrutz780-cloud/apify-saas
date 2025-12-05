export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // Backend liefert JSON in 'data' Spalte, API direkt
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

    // --- Text Logic ---
    const safeBody = (snap.body && snap.body.text) ? snap.body.text : null;
    const safeTitle = snap.title || snap.caption || "Ad Creative";
    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || null;

    // --- Date Logic ---
    let displayDate = "N/A";
    let isoDate = new Date().toISOString();
    
    if (item.start_date) {
        try {
            const dateVal = typeof item.start_date === 'number' ? item.start_date * 1000 : item.start_date;
            const d = new Date(dateVal);
            displayDate = d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
            isoDate = d.toISOString();
        } catch (e) {
            displayDate = "N/A";
        }
    }

    // --- Metrics Logic (Safety Checks) ---
    // Dein JSON zeigt: reach_estimate und spend sind oft null.
    // Wir setzen explizit null, damit die UI "N/A" anzeigen kann.
    
    const likes = (typeof snap.page_like_count === 'number') ? snap.page_like_count : null;
    
    // Impressions kommen oft als Objekt {impressions_index: -1}
    let impressions = null;
    if (item.impressions_with_index && typeof item.impressions_with_index.impressions_index === 'number') {
        // -1 bedeutet "keine Daten verfügbar" bei Meta
        impressions = item.impressions_with_index.impressions_index > -1 ? item.impressions_with_index.impressions_index : null;
    } else if (typeof item.reach_estimate === 'number') {
        impressions = item.reach_estimate;
    }

    const spend = (typeof item.spend === 'number') ? item.spend : null;

    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      platform: (item.publisher_platform || []).join(", ").toLowerCase(),
      status: item.is_active ? "Active" : "Inactive",
      pageName,
      avatar: safeAvatar,
      date: displayDate,
      start_date: isoDate,
      title: safeTitle,
      body: safeBody,
      media: { type: mediaType, url: mediaUrl, poster },
      ctaText: snap.cta_text || "Learn More",
      linkUrl: snap.link_url || "#",
      // Metrics
      likes,
      impressions,
      spend,
      snapshot: snap
    };
  });

  return processedAds.filter(ad => ad !== null);
};