import { MetaAd, TikTokAd, User } from '../types';

export const MOCK_USER: User = {
  id: 'u_123',
  email: 'demo@adspy.com',
  name: 'Alex Marketer',
  credits: 1500,
  savedAds: [],
  searchHistory: [
      { id: 'h_1', query: 'Ralph Christian', platform: 'meta', timestamp: new Date().toISOString(), resultsCount: 120, limit: 100 },
      { id: 'h_2', query: 'Nike', platform: 'meta', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resultsCount: 120, limit: 100 },
  ]
};

const BASE_META_ADS: MetaAd[] = [
  {
    id: 'meta_5458580464366042',
    isActive: true,
    publisher_platform: ['facebook', 'instagram', 'audience_network', 'messenger'],
    start_date: '2025-12-06T00:00:00Z',
    page_name: 'Ralph Christian Watches',
    page_profile_uri: 'https://www.facebook.com/RalphChristianWatches/',
    ad_library_url: '#',
    likes: 219604,
    impressions: 15000,
    spend: 0,
    page_categories: ['Schmuck/Uhren'],
    // Diese Felder sind optional im Typ, wir lassen sie hier weg oder füllen sie minimal
    targeting: {
        ages: ['18-65+'],
        genders: ['Weiblich'],
        locations: ['Belgien', 'Griechenland', 'Zypern'],
        reach_estimate: 11,
        breakdown: [
            { location: 'Belgien', age_range: '25-34', gender: 'Weiblich', reach: 1 },
            { location: 'Belgien', age_range: '35-44', gender: 'Weiblich', reach: 1 },
            { location: 'Griechenland', age_range: '25-34', gender: 'Weiblich', reach: 1 },
        ]
    },
    snapshot: {
      cta_text: 'Shop Now',
      link_url: 'https://ralphchristian.com',
      body: {
        text: "Last Chance to Shop Our Black Friday Sale 💖 Up to 20% Off Best-Selling Ladies' Watches ✨ Don't Miss Out 🚀 Free Shipping ⚡"
      },
      images: [{ resized_image_url: 'https://placehold.co/600x600' }],
      videos: []
    }
    // about_disclaimer und beneficiary_payer sind optional und hier weggelassen -> Kein TS Fehler mehr
  }
];

const BASE_TIKTOK_ADS: TikTokAd[] = [
  {
    id: 'tiktok_base_1',
    webVideoUrl: 'https://tiktok.com',
    text: 'This phone stabilizer is a game changer! #tech',
    createTimeISO: new Date().toISOString(),
    diggCount: 124000,
    shareCount: 15300,
    playCount: 4500000,
    commentCount: 2300,
    collectCount: 45000,
    videoMeta: {
      coverUrl: 'https://placehold.co/400x800',
      duration: 24,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'SnapTech Reviews',
      profileUrl: '#',
      avatarUrl: 'https://placehold.co/100x100'
    }
  }
];

const generateMetaAds = (count: number): MetaAd[] => {
    const ads: MetaAd[] = [];
    for (let i = 0; i < count; i++) {
        const template = BASE_META_ADS[i % BASE_META_ADS.length];
        ads.push({
            ...template,
            id: `meta_gen_${i}_${template.id}`,
            start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i % 10)).toISOString(),
        });
    }
    return ads;
};

const generateTikTokAds = (count: number): TikTokAd[] => {
    const ads: TikTokAd[] = [];
    for (let i = 0; i < count; i++) {
        const template = BASE_TIKTOK_ADS[i % BASE_TIKTOK_ADS.length];
        ads.push({
            ...template,
            id: `tiktok_gen_${i}`,
        });
    }
    return ads;
};

export const MOCK_META_ADS = generateMetaAds(20);
export const MOCK_TIKTOK_ADS = generateTikTokAds(10);