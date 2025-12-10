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

    // 5. METRIKEN & INTELLIGENTE REPARATUR
    let reach = item.reach_estimate || item.reachEstimate || item.impressions || 0;
    let likes = item.likes || item.page_like_count || 0;
    let pageSize = item.page_size || (likes > 0 ? likes : 1000);
    
    let efficiencyScore = item.efficiency_score;
    let viralFactor = item.viral_factor;

    // WICHTIG: Wenn Score fehlt ODER unplausibel hoch ist (> 100), rechnen wir neu!
    if (efficiencyScore === undefined || efficiencyScore === null || efficiencyScore > 100) {
        const safeReach = Number(reach) || 0;
        const safeAudience = Math.max(Number(pageSize), 1000);
        const ratio = safeReach / safeAudience;
        
        // Live-Berechnung: 15 * log2(1 + ratio), max 100
        efficiencyScore = Math.round(Math.min(15 * Math.log2(1 + ratio), 100) * 10) / 10;
        
        // Faktor schätzen, falls er fehlt
        if (viralFactor === undefined || viralFactor === null) {
             viralFactor = ratio > 0 ? Math.round((ratio / 3.0) * 10) / 10 : 0;
        }
    }

    const spend = item.spend || item.spendEstimate || null;
    const locations = item.targeted_or_reached_countries || item.targetedOrReachedCountries || item.countries || [];
    const ages = item.target_ages ? [item.target_ages] : (item.targetAges ? [item.targetAges] : []);
    const genders = item.gender ? [item.gender] : (item.genders || []);
    const breakdown = item.demographics || item.demographic_distribution || [];

    const targeting = {
        ages,
        genders,
        locations, 
        reach_estimate: Number(reach),
        breakdown
    };

    const backendInfo = item.advertiser_info || {};
    const advertiser_info = {
        category: (snap.page_categories && snap.page_categories.length > 0) ? snap.page_categories[0] : null,
        facebook_handle: backendInfo.facebook_handle,
        facebook_followers: backendInfo.facebook_followers,
        instagram_handle: backendInfo.instagram_handle,
        instagram_followers: backendInfo.instagram_followers,
        about_text: backendInfo.about_text,
        ...backendInfo
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
      reach: Number(reach), 
      impressions: Number(reach),
      spend,
      
      // Jetzt garantiert sauberer 0-100 Score
      efficiency_score: Number(efficiencyScore),
      viral_factor: Number(viralFactor), 
      page_size: Number(pageSize),

      targeting,
      demographics: item.demographics || [],
      target_locations: item.target_locations || [],
      page_categories: snap.page_categories || item.categories || [],
      disclaimer: item.disclaimer_label || item.disclaimerLabel || item.byline || null,
      advertiser_info,
      avatar: safeAvatar
    };
  });

  return processedAds.filter(ad => ad !== null);
};