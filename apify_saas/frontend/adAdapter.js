// frontend_blue/adAdapter.js

export const cleanAndTransformData = (dbRows) => {
  // Security check: Is data available?
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // The backend stores the JSON in the "data" column, or API returns it directly
    const item = row.data || row; 
    
    // Even if the item is empty or has no snapshot -> return minimal object
    if (!item) return null;

    const snap = item.snapshot || {};

    // --- Media Logic ---
    let mediaType = 'image';
    let mediaUrl = null;
    let poster = null;

    // 1. Check for Video
    if (snap.videos && snap.videos.length > 0) {
      mediaType = 'video';
      mediaUrl = snap.videos[0].video_hd_url || snap.videos[0].video_sd_url;
      poster = snap.videos[0].video_preview_image_url;
    } 
    // 2. Check for Carousel (Cards)
    else if (snap.cards && snap.cards.length > 0) {
      mediaType = 'carousel';
      mediaUrl = snap.cards[0].original_image_url || snap.cards[0].resized_image_url;
    } 
    // 3. Check for Standard Image
    else if (snap.images && snap.images.length > 0) {
      mediaType = 'image';
      mediaUrl = snap.images[0].original_image_url || snap.images[0].resized_image_url;
    }

    // --- Text Logic ---
    const safeBody = (snap.body && snap.body.text) ? snap.body.text : null;
    const safeTitle = snap.title || snap.caption || "Ad";
    
    // Page Name Logic: Check snapshot first, then root item (FIX for "Unknown Page")
    const pageName = snap.page_name || item.page_name || "Unknown Page";

    // Profile Picture Fallback
    const safeAvatar = (snap.page_profile_picture_url) 
      ? snap.page_profile_picture_url 
      : null; 

    // Date Formatting (English)
    let displayDate = "Date unknown";
    if (item.start_date) {
        try {
            // Check if it's a timestamp (number) or ISO string
            const dateVal = typeof item.start_date === 'number' ? item.start_date * 1000 : item.start_date;
            displayDate = new Date(dateVal).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            displayDate = "Date unknown";
        }
    }

    // The clean object
    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      // Platform string for filtering
      platform: (item.publisher_platform || []).join(", ").toLowerCase(), 
      status: item.is_active ? "Active" : "Inactive", // ENGLISCH
      pageName: pageName,
      avatar: safeAvatar,
      date: displayDate,
      // Keep original start date for sorting
      start_date: item.start_date ? new Date(typeof item.start_date === 'number' ? item.start_date * 1000 : item.start_date).toISOString() : new Date().toISOString(),
      title: safeTitle,
      body: safeBody,
      media: { type: mediaType, url: mediaUrl, poster: poster },
      ctaText: snap.cta_text || "Learn More", // ENGLISCH
      linkUrl: snap.link_url || "#",
      // Metrics for sorting
      likes: snap.page_like_count || 0,
      impressions: item.impressions_with_index?.impressions_index || 0, 
      spend: item.spend || 0,
      // Pass snapshot through for the modal
      snapshot: snap 
    };
  });

  return processedAds.filter(ad => ad !== null);
};