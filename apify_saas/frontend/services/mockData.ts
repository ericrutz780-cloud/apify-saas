import { MetaAd, TikTokAd, User } from '../types';

export const MOCK_USER: User = {
  id: 'u_123',
  email: 'demo@adspy.com',
  name: 'Alex Marketer',
  credits: 1500,
  savedAds: [],
  searchHistory: [
      { id: 'h_1', query: 'Skincare', platform: 'both', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), resultsCount: 45, limit: 50 },
      { id: 'h_2', query: 'Nike', platform: 'meta', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resultsCount: 120, limit: 100 },
      { id: 'h_3', query: 'SaaS', platform: 'meta', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), resultsCount: 12, limit: 25 },
      { id: 'h_4', query: 'Coffee', platform: 'tiktok', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), resultsCount: 89, limit: 100 },
      { id: 'h_5', query: 'Skincare', platform: 'meta', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), resultsCount: 34, limit: 50 },
      { id: 'h_6', query: 'Fitness', platform: 'both', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), resultsCount: 200, limit: 200 },
  ]
};

// --- Base Templates for Realistic Data ---

const BASE_META_ADS: MetaAd[] = [
  // 1. Skincare (High relevance for 'Skincare' search)
  {
    id: 'meta_438927489231',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['instagram'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    page_name: 'Lumina Skincare',
    page_profile_uri: 'https://instagram.com/luminaskin',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 4520,
    impressions: 125000,
    spend: 1200,
    page_categories: ['Beauty, Cosmetic & Personal Care'],
    disclaimer: 'Paid for by Lumina Skincare Ltd.',
    targeting: {
        ages: ['18-45'],
        genders: ['Female'],
        locations: ['United States', 'Canada', 'United Kingdom'],
        reach_estimate: 500000
    },
    snapshot: {
      cta_text: 'Shop Now',
      link_url: 'https://luminaskin.com/products/glow-serum',
      body: {
        text: 'Achieve that golden hour glow all day long. ✨ Our Vitamin C serum is dermatologically tested and vegan. 50% OFF for the next 24h! 🌿 #CleanBeauty #SkincareRoutine #GlowUp'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 2. Travel
  {
    id: 'meta_78329102384',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['facebook', 'instagram'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    page_name: 'Nomad Carry',
    page_profile_uri: 'https://facebook.com/nomadcarry',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 8900,
    impressions: 850000,
    spend: 5400,
    page_categories: ['Luggage & Bags'],
    targeting: {
        ages: ['25-54'],
        genders: ['All'],
        locations: ['European Union', 'United States'],
        reach_estimate: 1200000
    },
    snapshot: {
      cta_text: 'Shop Travel',
      link_url: 'https://nomadcarry.com/collections/backpacks',
      body: {
        text: 'One bag. Endless destinations. 🌍 Meet the backpack designed for the modern digital nomad. Waterproof, theft-proof, and arguably bulletproof. 🎒✈️ #TravelGear #DigitalNomad'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 3. SaaS
  {
    id: 'meta_9283748234',
    isActive: false, // FIX: Added isActive
    publisher_platform: ['facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    page_name: 'TaskMaster App',
    page_profile_uri: 'https://facebook.com/taskmaster',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 210,
    impressions: 15000,
    spend: 350,
    page_categories: ['Software Company'],
    targeting: {
        ages: ['24-60'],
        genders: ['All'],
        locations: ['United States'],
        reach_estimate: 50000
    },
    snapshot: {
      cta_text: 'Start Free Trial',
      link_url: 'https://taskmaster.io/signup',
      body: {
        text: 'Stop drowning in emails. 📧 TaskMaster helps you organize your team\'s workflow in one visual dashboard. Join 10,000+ productive teams today. 🚀 #Productivity #SaaS'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 4. Coffee
  {
    id: 'meta_1928304958',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['instagram', 'facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    page_name: 'Freshly Brewed',
    page_profile_uri: 'https://instagram.com/freshlybrewed',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 56000,
    impressions: 2100000,
    spend: 18500,
    page_categories: ['Coffee Shop', 'Subscription Service'],
    targeting: {
        ages: ['18-65+'],
        genders: ['All'],
        locations: ['United Kingdom', 'Ireland'],
        reach_estimate: 250000
    },
    snapshot: {
      cta_text: 'Get 20% Off',
      link_url: 'https://freshlybrewed.com/subscription',
      body: {
        text: 'Your morning ritual just got an upgrade. ☕ Sustainably sourced beans delivered to your door. Taste the difference of fresh roast. #CoffeeLover #MorningRoutine'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 5. Fitness
  {
    id: 'meta_5647382910',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    page_name: 'FitTrack',
    page_profile_uri: 'https://facebook.com/fittrack',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 3400,
    impressions: 98000,
    spend: 800,
    page_categories: ['Health & Wellness'],
    targeting: {
        ages: ['18-40'],
        genders: ['All'],
        locations: ['Germany', 'Austria', 'Switzerland'],
        reach_estimate: 150000
    },
    snapshot: {
      cta_text: 'Download App',
      link_url: 'https://fittrack.com/app',
      body: {
        text: 'Tracking macros has never been easier. 🥑 Scan your food, track your progress, and hit your goals with FitTrack AI. #Fitness #Health #MacroCounting'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 6a. Nike / Sportswear - Version 1 (EU Focus)
  {
    id: 'meta_5458580464366042',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['instagram', 'facebook', 'messenger'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    page_name: 'Nike',
    page_profile_uri: 'https://instagram.com/nike',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 154000,
    impressions: 5400000,
    spend: 45000,
    page_categories: ['Sportswear', 'Retail'],
    disclaimer: 'Paid for by Nike Inc.',
    advertiser_info: {
        facebook_handle: '@nike',
        facebook_followers: 185000000,
        instagram_handle: '@nike',
        instagram_followers: 305000000,
        category: 'Sportswear & Apparel',
        about_text: 'Just Do It. Nike delivers innovative products, experiences and services to inspire athletes. We champion continual progress for athletes and sport by taking action to help athletes reach their potential.'
    },
    about_disclaimer: {
        text: "Based on where the ad is shown and the ad category, advertisers may be required to disclose the beneficiary and payer, and may also disclose additional information.",
        location: "United States",
        website_url: "https://www.nike.com/",
        beneficiary: "NIKE INC",
        payer: "NIKE INC"
    },
    beneficiary_payer: {
        text: "When targeting certain locations, advertisers are required to disclose who will benefit from an ad and who is paying for it.",
        beneficiary: "NIKE INC",
        payer: "NIKE INC"
    },
    targeting: {
        ages: ['18-35'],
        genders: ['All'],
        locations: ['Austria', 'Belgium', 'France', 'Germany', 'Netherlands', 'Spain'],
        excluded_locations: ['Cyprus', 'Malta', 'Réunion'],
        reach_estimate: 10452100,
        breakdown: [
            { location: 'Austria', age_range: '18-24', gender: 'Male', reach: 125000 },
            { location: 'Austria', age_range: '18-24', gender: 'Female', reach: 110000 },
            { location: 'Belgium', age_range: '25-34', gender: 'Male', reach: 240000 },
            { location: 'Belgium', age_range: '25-34', gender: 'Female', reach: 215000 },
            { location: 'France', age_range: '18-35', gender: 'All', reach: 4500000 },
            { location: 'Germany', age_range: '18-35', gender: 'All', reach: 5200000 },
            { location: 'Spain', age_range: '20-30', gender: 'Male', reach: 890000 },
        ]
    },
    transparency_regions: [
        {
            region: "European Union",
            description: "We provide additional information for ads that were shown on Meta technologies anywhere in the EU.",
            ages: ['18-35'],
            genders: ['All'],
            locations: ['Austria', 'Belgium', 'France', 'Germany', 'Netherlands', 'Spain'],
            excluded_locations: ['Cyprus', 'Malta', 'Réunion'],
            reach_estimate: 10452100,
            breakdown: [
                { location: 'Austria', age_range: '18-24', gender: 'Male', reach: 125000 },
                { location: 'Austria', age_range: '18-24', gender: 'Female', reach: 110000 },
                { location: 'Belgium', age_range: '25-34', gender: 'Male', reach: 240000 },
                { location: 'Belgium', age_range: '25-34', gender: 'Female', reach: 215000 },
                { location: 'France', age_range: '18-35', gender: 'All', reach: 4500000 },
                { location: 'Germany', age_range: '18-35', gender: 'All', reach: 5200000 },
                { location: 'Spain', age_range: '20-30', gender: 'Male', reach: 890000 },
            ]
        },
        {
            region: "United Kingdom",
            description: "We provide additional information for ads that were shown on Meta technologies in the United Kingdom.",
            ages: ['18-65+'],
            genders: ['All'],
            locations: ['United Kingdom'],
            excluded_locations: [],
            reach_estimate: 4500000,
            breakdown: [
                 { location: 'United Kingdom', age_range: '25-34', gender: 'Female', reach: 1200000 },
                 { location: 'United Kingdom', age_range: '25-34', gender: 'Male', reach: 950000 },
                 { location: 'United Kingdom', age_range: '35-44', gender: 'Female', reach: 850000 },
                 { location: 'United Kingdom', age_range: '35-44', gender: 'Male', reach: 750000 },
            ]
        }
    ],
    snapshot: {
      cta_text: 'Shop New Arrivals',
      link_url: 'https://nike.com',
      body: {
        text: 'Experience unrivaled comfort with Nike Flyknit. Revolutionize your footwear. Lightweight, form-fitting design that feels like a second skin. 👟🔥 #JustDoIt #Nike'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 6b. Nike / Sportswear - Version 2 (US/Canada Focus, different date)
  {
    id: 'meta_844224584970398',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['facebook', 'audience_network'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    page_name: 'Nike',
    page_profile_uri: 'https://instagram.com/nike',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 110000,
    impressions: 3200000,
    spend: 29000,
    page_categories: ['Sportswear', 'Retail'],
    disclaimer: 'Paid for by Nike Inc.',
    advertiser_info: {
        facebook_handle: '@nike',
        facebook_followers: 185000000,
        instagram_handle: '@nike',
        instagram_followers: 305000000,
        category: 'Sportswear & Apparel',
        about_text: 'Just Do It. Nike delivers innovative products.'
    },
    targeting: {
        ages: ['25-54'],
        genders: ['All'],
        locations: ['United States', 'Canada'],
        reach_estimate: 8500000
    },
    snapshot: {
      cta_text: 'Shop Now',
      link_url: 'https://nike.com/flyknit',
      body: {
        text: 'Experience unrivaled comfort with Nike Flyknit. Revolutionize your footwear. Lightweight, form-fitting design that feels like a second skin. 👟🔥 #JustDoIt #Nike'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 6c. Nike / Sportswear - Version 3 (UK Only, Female Focus)
  {
    id: 'meta_129482910394821',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['instagram'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    page_name: 'Nike',
    page_profile_uri: 'https://instagram.com/nike',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 45000,
    impressions: 900000,
    spend: 12000,
    page_categories: ['Sportswear', 'Retail'],
    disclaimer: 'Paid for by Nike Inc.',
    advertiser_info: {
        facebook_handle: '@nike',
        facebook_followers: 185000000,
        instagram_handle: '@nike',
        instagram_followers: 305000000,
        category: 'Sportswear & Apparel'
    },
    targeting: {
        ages: ['18-34'],
        genders: ['Female'],
        locations: ['United Kingdom'],
        reach_estimate: 2100000
    },
    snapshot: {
      cta_text: 'Shop Women',
      link_url: 'https://nike.com/women',
      body: {
        text: 'Experience unrivaled comfort with Nike Flyknit. Revolutionize your footwear. Lightweight, form-fitting design that feels like a second skin. 👟🔥 #JustDoIt #Nike'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 6d. Nike / Sportswear - Version 4 (Germany Only, Male Focus)
  {
    id: 'meta_992837482716234',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['facebook', 'messenger'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    page_name: 'Nike',
    page_profile_uri: 'https://instagram.com/nike',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 22000,
    impressions: 600000,
    spend: 8000,
    page_categories: ['Sportswear', 'Retail'],
    disclaimer: 'Paid for by Nike Inc.',
    advertiser_info: {
        facebook_handle: '@nike',
        facebook_followers: 185000000,
        instagram_handle: '@nike',
        instagram_followers: 305000000,
        category: 'Sportswear & Apparel'
    },
    targeting: {
        ages: ['25-45'],
        genders: ['Male'],
        locations: ['Germany'],
        reach_estimate: 1200000
    },
    snapshot: {
      cta_text: 'Shop Men',
      link_url: 'https://nike.com/men',
      body: {
        text: 'Experience unrivaled comfort with Nike Flyknit. Revolutionize your footwear. Lightweight, form-fitting design that feels like a second skin. 👟🔥 #JustDoIt #Nike'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 7. Nike (Facebook Only) - Different Text (Won't group with above)
  {
    id: 'meta_6758493021',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    page_name: 'Nike Running',
    page_profile_uri: 'https://facebook.com/nikerunning',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 24000,
    impressions: 890000,
    spend: 12000,
    page_categories: ['Sportswear'],
    advertiser_info: {
        facebook_handle: '@nikerunning',
        facebook_followers: 15000000,
        category: 'Sportswear',
        about_text: 'Nike Running. Designed for every runner, from the world\'s best to those who just want to join the run.'
    },
    targeting: {
        ages: ['20-50'],
        genders: ['All'],
        locations: ['United States', 'Japan'],
        reach_estimate: 500000
    },
    snapshot: {
      cta_text: 'Shop Now',
      link_url: 'https://nike.com/running',
      body: {
        text: 'Crush your PB with the new ZoomX Vaporfly. 🏃‍♂️💨 Built for speed. Engineered for victory. #NikeRunning #ZoomX'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  },
  // 8. Nike (Instagram Only) - Different Text (Won't group with above)
  {
    id: 'meta_2384910293',
    isActive: true, // FIX: Added isActive
    publisher_platform: ['instagram'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    page_name: 'Nike Sportswear',
    page_profile_uri: 'https://instagram.com/nikesportswear',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 89000,
    impressions: 1200000,
    spend: 25000,
    page_categories: ['Clothing'],
    advertiser_info: {
        instagram_handle: '@nikesportswear',
        instagram_followers: 8500000,
        category: 'Clothing',
        about_text: 'Nike Sportswear. Style meets sport. The future of comfort.'
    },
    targeting: {
        ages: ['18-30'],
        genders: ['Female'],
        locations: ['France', 'Italy'],
        reach_estimate: 800000
    },
    snapshot: {
      cta_text: 'Watch More',
      link_url: 'https://nike.com/sportswear',
      body: {
        text: 'Style meets comfort. The new Tech Fleece collection is here. 🥶 #TechFleece #NikeStyle'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1579338908476-3a3a1d71a706?auto=format&fit=crop&w=800&q=80' }],
      videos: []
    }
  }
];

const BASE_TIKTOK_ADS: TikTokAd[] = [
  // 1. Tech
  {
    id: 'tiktok_base_1',
    webVideoUrl: 'https://tiktok.com/@snaptech/video/1',
    text: 'This phone stabilizer is a game changer for content creators! 🎥✨ No more shaky footage. #tech #filmmaking #creator',
    createTimeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    diggCount: 124000,
    shareCount: 15300,
    playCount: 4500000,
    commentCount: 2300,
    collectCount: 45000,
    videoMeta: {
      coverUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&h=1067&q=80',
      duration: 24,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'SnapTech Reviews',
      profileUrl: 'https://tiktok.com/@snaptech',
      avatarUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80'
    }
  },
  // 2. Cooking
  {
    id: 'tiktok_base_2',
    webVideoUrl: 'https://tiktok.com/@chef_mike/video/2',
    text: 'POV: You finally found the perfect non-stick pan. 🍳 Watch that egg slide! 🤤 50% off link in bio. #cooking #kitchenhacks #foodie',
    createTimeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    diggCount: 890000,
    shareCount: 45000,
    playCount: 12500000,
    commentCount: 8900,
    collectCount: 120000,
    videoMeta: {
      coverUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=600&h=1067&q=80',
      duration: 15,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'Chef Mike',
      profileUrl: 'https://tiktok.com/@chef_mike',
      avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&q=80'
    }
  },
  // 3. Fitness
  {
    id: 'tiktok_base_3',
    webVideoUrl: 'https://tiktok.com/@fitfam/video/3',
    text: 'Stop doing sit-ups! 🔥 Try this 5 min core workout instead. Results in 2 weeks. Get the app for full plan. #fitness #abs #workout',
    createTimeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    diggCount: 4500,
    shareCount: 200,
    playCount: 89000,
    commentCount: 45,
    collectCount: 1200,
    videoMeta: {
      coverUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&h=1067&q=80',
      duration: 45,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'FitFam Global',
      profileUrl: 'https://tiktok.com/@fitfam',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
    }
  },
  // 4. Fashion
  {
    id: 'tiktok_base_4',
    webVideoUrl: 'https://tiktok.com/@styleicon/video/4',
    text: 'OOTD: Styling the new oversized hoodie. Comfort > Everything. ☁️ Grab yours before they sell out! #fashion #ootd #streetwear',
    createTimeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    diggCount: 230000,
    shareCount: 8900,
    playCount: 3400000,
    commentCount: 1200,
    collectCount: 56000,
    videoMeta: {
      coverUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&h=1067&q=80',
      duration: 12,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'Style Icon',
      profileUrl: 'https://tiktok.com/@styleicon',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    }
  },
  // 5. Skincare (TikTok)
  {
    id: 'tiktok_base_5',
    webVideoUrl: 'https://tiktok.com/@skincare_daily/video/5',
    text: 'My AM Skincare Routine for glowing skin! ✨ The Hyaluronic Acid serum is my holy grail. Link in bio! #skincare #glow #routine',
    createTimeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    diggCount: 67000,
    shareCount: 3200,
    playCount: 890000,
    commentCount: 890,
    collectCount: 12000,
    videoMeta: {
      coverUrl: 'https://images.unsplash.com/photo-1556228720-1957be83f360?auto=format&fit=crop&w=600&h=1067&q=80',
      duration: 35,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'Glow With Sarah',
      profileUrl: 'https://tiktok.com/@skincare_daily',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    }
  }
];

// --- Generators ---

const generateMetaAds = (count: number): MetaAd[] => {
    const ads: MetaAd[] = [];
    for (let i = 0; i < count; i++) {
        const template = BASE_META_ADS[i % BASE_META_ADS.length];
        const randomFactor = 0.5 + Math.random(); // 0.5x to 1.5x multiplier
        const randomDays = Math.floor(Math.random() * 60);
        
        // Use a realistic numeric ID structure
        const randomIdSuffix = 5458000000000000 + Math.floor(Math.random() * 999999999999);
        
        ads.push({
            ...template,
            id: `meta_${randomIdSuffix}`,
            isActive: template.isActive, // FIX: Pass isActive through
            // Randomize metrics slightly
            likes: Math.floor(template.likes * randomFactor),
            impressions: Math.floor(template.impressions * randomFactor),
            spend: Math.floor(template.spend * randomFactor),
            // Shift date
            start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * randomDays).toISOString(),
        });
    }
    return ads;
};

const generateTikTokAds = (count: number): TikTokAd[] => {
    const ads: TikTokAd[] = [];
    for (let i = 0; i < count; i++) {
        const template = BASE_TIKTOK_ADS[i % BASE_TIKTOK_ADS.length];
        const randomFactor = 0.5 + Math.random();
        const randomDays = Math.floor(Math.random() * 60);

        ads.push({
            ...template,
            id: `tiktok_gen_${i}`,
            // Randomize metrics
            diggCount: Math.floor(template.diggCount * randomFactor),
            playCount: Math.floor(template.playCount * randomFactor),
            shareCount: Math.floor(template.shareCount * randomFactor),
            collectCount: Math.floor(template.collectCount * randomFactor),
            // Shift date
            createTimeISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * randomDays).toISOString(),
        });
    }
    return ads;
};

// Generate 60 of each to allow for >100 total results in search
export const MOCK_META_ADS = generateMetaAds(60);
export const MOCK_TIKTOK_ADS = generateTikTokAds(60);