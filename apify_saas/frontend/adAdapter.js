export const cleanAndTransformData = (dbRows) => {
  if (!dbRows || !Array.isArray(dbRows)) return [];

  const processedAds = dbRows.map((row) => {
    const item = row.data || row;
    if (!item) return null;

    const snap = item.snapshot || {};

    // 1. Platform
    const rawPlatforms = item.publisher_platform || item.publisherPlatform || [];
    const platforms = rawPlatforms.map(p => p.toLowerCase());

    // 2. Media
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
    if (safeBody) {
        safeBody = safeBody.replace(/\{\{.*?\}\}/g, '').trim();
    }

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

    // 5. Metrics & Targeting (ULTIMATE REACH FIX)
    const likes = item.likes || item.page_like_count || item.pageLikeCount || 0;
    
    // Wir suchen die Reichweite überall
    let reach = 0;

    // Option 1: Direktes Feld vom Backend
    if (item.reach_estimate) reach = item.reach_estimate;
    else if (item.reachEstimate) reach = item.reachEstimate;
    
    // Option 2: EU Transparency (direkt)
    else if (item.eu_transparency?.eu_total_reach) reach = item.eu_transparency.eu_total_reach;
    
    // Option 3: EU Data (Backend Mapping)
    else if (item.eu_data?.eu_total_reach) reach = item.eu_data.eu_total_reach;
    else if (item.eu_data?.eu_transparency?.eu_total_reach) reach = item.eu_data.eu_transparency.eu_total_reach;

    // Option 4: Transparency by Location (Raw Scrape)
    else if (item.transparency_by_location?.eu_transparency?.eu_total_reach) {
        reach = item.transparency_by_location.eu_transparency.eu_total_reach;
    }

    // Option 5: AAA Info (Raw Scrape)
    else if (item.aaa_info?.eu_total_reach) {
        reach = item.aaa_info.eu_total_reach;
    }

    // Option 6: Impressions Fallback
    else if (item.impressions_with_index) {
         const idx = item.impressions_with_index.impressions_index || -1;
         if (idx > -1) reach = idx;
    }

    reach = Number(reach) || 0;

    const spend = item.spend || item.spendEstimate || null;
    const locations = item.targeted_or_reached_countries || item.targetedOrReachedCountries || item.countries || [];
    const ages = item.target_ages ? [item.target_ages] : (item.targetAges ? [item.targetAges] : []);
    const genders = item.gender ? [item.gender] : (item.genders || []);
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

    // WICHTIG: Wir geben eu_data korrekt weiter, egal wo es herkommt
    const transparencyRegions = item.eu_data || item.euData || item.eu_transparency || 
                              item.transparency_by_location?.eu_transparency || 
                              item.aaa_info || [];

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
      reach: reach, 
      spend,
      targeting,
      transparency_regions: transparencyRegions, 
      page_categories: snap.page_categories || item.categories || [],
      disclaimer: item.disclaimer_label || item.disclaimerLabel || item.byline || null,
      advertiser_info,
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};