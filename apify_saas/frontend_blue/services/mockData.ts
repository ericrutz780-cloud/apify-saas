import { MetaAd, TikTokAd, User } from '../types';

export const MOCK_USER: User = {
  id: 'u_123',
  email: 'demo@adspy.com',
  name: 'Alex Marketer',
  credits: 1500,
  savedAds: []
};

// --- Base Templates for Realistic Data ---

const BASE_META_ADS: MetaAd[] = [
  // 1. Skincare (High relevance for 'Skincare' search)
  {
    id: 'meta_base_1',
    publisher_platform: ['instagram'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    page_name: 'Lumina Skincare',
    page_profile_uri: 'https://instagram.com/luminaskin',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 4520,
    impressions: 125000,
    spend: 1200,
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
    id: 'meta_base_2',
    publisher_platform: ['facebook', 'instagram'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    page_name: 'Nomad Carry',
    page_profile_uri: 'https://facebook.com/nomadcarry',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 8900,
    impressions: 850000,
    spend: 5400,
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
    id: 'meta_base_3',
    publisher_platform: ['facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    page_name: 'TaskMaster App',
    page_profile_uri: 'https://facebook.com/taskmaster',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 210,
    impressions: 15000,
    spend: 350,
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
    id: 'meta_base_4',
    publisher_platform: ['instagram', 'facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    page_name: 'Freshly Brewed',
    page_profile_uri: 'https://instagram.com/freshlybrewed',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 56000,
    impressions: 2100000,
    spend: 18500,
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
    id: 'meta_base_5',
    publisher_platform: ['facebook'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    page_name: 'FitTrack',
    page_profile_uri: 'https://facebook.com/fittrack',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 3400,
    impressions: 98000,
    spend: 800,
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
  // 6. Nike / Sportswear (High relevance for 'Nike' search)
  {
    id: 'meta_base_6',
    publisher_platform: ['instagram', 'facebook', 'messenger'],
    start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    page_name: 'Nike',
    page_profile_uri: 'https://instagram.com/nike',
    ad_library_url: 'https://facebook.com/ads/library',
    likes: 154000,
    impressions: 5400000,
    spend: 45000,
    snapshot: {
      cta_text: 'Shop New Arrivals',
      link_url: 'https://nike.com',
      body: {
        text: 'Experience unrivaled comfort with Nike Flyknit. Revolutionize your footwear. Lightweight, form-fitting design that feels like a second skin. 👟🔥 #JustDoIt #Nike'
      },
      images: [{ resized_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }],
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
        
        ads.push({
            ...template,
            id: `meta_gen_${i}`,
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