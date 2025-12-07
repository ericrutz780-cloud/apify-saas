export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    // API liefert Daten manchmal direkt, manchmal in 'data' wrapper
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // --- FIX: Platform Case Sensitivity ---
    // API liefert ["FACEBOOK"], App erwartet ["facebook"]. Wir normalisieren hier.
    const rawPlatforms = item.publisher_platform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());

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

    // --- Text Cleaning ---
    let safeBody = (snap.body && snap.body.text) ? snap.body.text : "";
    // Entfernt Shopify-Platzhalter
    safeBody = safeBody.replace(/\{\{.*?\}\}/g, '').trim();

    const pageName = snap.page_name || item.page_name || "Unknown Page";
    const safeAvatar = snap.page_profile_picture_url || item.page_profile_picture_url || null;

    // --- Date Logic ---
    let isoDate = new Date().toISOString();
    if (item.start_date) {
        try {
            // JSON hat Unix Timestamp (Sekunden) -> in MS umwandeln
            const dateVal = typeof item.start_date === 'number' ? item.start_date * 1000 : item.start_date;
            isoDate = new Date(dateVal).toISOString();
        } catch (e) {
            console.warn("Date parsing error", e);
        }
    }

    // --- Metrics Logic ---
    const likes = (typeof snap.page_like_count === 'number') ? snap.page_like_count : 0;
    
    let impressions = null;
    if (item.impressions_with_index && typeof item.impressions_with_index.impressions_index === 'number') {
        impressions = item.impressions_with_index.impressions_index > -1 ? item.impressions_with_index.impressions_index : null;
    } else if (typeof item.reach_estimate === 'number') {
        impressions = item.reach_estimate;
    }
    
    const spend = (typeof item.spend === 'number') ? item.spend : 0;

    // --- Targeting Object Builder ---
    // Baut die Struktur für die Detailansicht
    const targeting = {
        ages: item.target_ages ? [item.target_ages] : [], 
        genders: item.gender ? [item.gender] : [],
        locations: item.targeted_or_reached_countries || [], 
        reach_estimate: item.reach_estimate || null
    };

    // --- Advertiser Info Builder ---
    const advertiser_info = {
        category: (snap.page_categories && snap.page_categories.length > 0) ? snap.page_categories[0] : null,
    };

    // Rückgabe-Objekt
    return {
      id: item.ad_archive_id || item.id || Math.random().toString(),
      isActive: item.is_active !== false,
      publisher_platform: platforms, // Jetzt in lowercase!
      start_date: isoDate,
      page_name: pageName,
      page_profile_uri: item.page_profile_uri || "#",
      ad_library_url: item.ad_library_url || "#",
      snapshot: { ...snap, body: { text: safeBody } }, 
      
      likes,
      impressions,
      spend,

      // UI Helper Objects
      targeting,
      page_categories: snap.page_categories || [],
      disclaimer: item.disclaimer_label || item.byline || null,
      advertiser_info,
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};