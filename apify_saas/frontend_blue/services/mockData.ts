import { MetaAd, TikTokAd, User } from '../types';

export const MOCK_USER: User = {
  id: 'u_123',
  email: 'demo@adspy.com',
  name: 'Demo User',
  credits: 150
};

export const MOCK_META_ADS: MetaAd[] = [
  {
    id: 'm_1',
    publisher_platform: ['facebook', 'instagram'],
    start_date: '2023-10-01',
    page_name: 'EcoHome Essentials',
    page_profile_uri: 'https://facebook.com/ecohome',
    ad_library_url: 'https://facebook.com/ads/library',
    snapshot: {
      cta_text: 'Shop Now',
      link_url: 'https://ecohome-essentials.com/products/bamboo-set',
      body: {
        text: 'Transform your living space with our sustainable bamboo furniture collection. Limited time offer: 20% OFF all sets! 🌿✨ #EcoFriendly #HomeDecor'
      },
      images: [{ resized_image_url: 'https://picsum.photos/600/600?random=1' }],
      videos: []
    }
  },
  {
    id: 'm_2',
    publisher_platform: ['instagram'],
    start_date: '2023-10-05',
    page_name: 'TechGear Pro',
    page_profile_uri: 'https://instagram.com/techgear',
    ad_library_url: 'https://facebook.com/ads/library',
    snapshot: {
      cta_text: 'Learn More',
      link_url: 'https://techgear-pro.io/ai-tool',
      body: {
        text: 'Stop wasting time on manual data entry. Our AI-powered tool handles it for you in seconds. 🚀 Try the demo today.'
      },
      images: [],
      videos: [{ video_hd_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }]
    }
  },
  {
    id: 'm_3',
    publisher_platform: ['facebook'],
    start_date: '2023-09-20',
    page_name: 'FitLife Coaching',
    page_profile_uri: 'https://facebook.com/fitlife',
    ad_library_url: 'https://facebook.com/ads/library',
    snapshot: {
      cta_text: 'Sign Up',
      link_url: 'https://fitlifecoaching.net/challenge',
      body: {
        text: 'Ready to crush your fitness goals? Join our 30-day challenge and see real results. 💪'
      },
      images: [{ resized_image_url: 'https://picsum.photos/600/400?random=2' }],
      videos: []
    }
  }
];

export const MOCK_TIKTOK_ADS: TikTokAd[] = [
  {
    id: 't_1',
    webVideoUrl: 'https://tiktok.com/@gadgetqueen/video/123456789',
    text: 'This kitchen gadget changed my life! 😱 #kitchenhacks #musthave #amazonfinds',
    createTimeISO: '2023-10-02T10:00:00Z',
    diggCount: 45200,
    shareCount: 1200,
    playCount: 1500000,
    commentCount: 340,
    collectCount: 5000,
    videoMeta: {
      coverUrl: 'https://picsum.photos/300/533?random=3',
      duration: 15,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'GadgetQueen',
      profileUrl: 'https://tiktok.com/@gadgetqueen',
      avatarUrl: 'https://picsum.photos/100/100?random=4'
    }
  },
  {
    id: 't_2',
    webVideoUrl: 'https://tiktok.com/@creativestudio/video/987654321',
    text: 'Wait for the end result... ✨ You wont believe it! #art #diy #satisfying',
    createTimeISO: '2023-10-08T14:30:00Z',
    diggCount: 89000,
    shareCount: 4500,
    playCount: 2100000,
    commentCount: 1200,
    collectCount: 15000,
    videoMeta: {
      coverUrl: 'https://picsum.photos/300/533?random=5',
      duration: 30,
      height: 1920,
      width: 1080
    },
    authorMeta: {
      nickName: 'CreativeStudio',
      profileUrl: 'https://tiktok.com/@creativestudio',
      avatarUrl: 'https://picsum.photos/100/100?random=6'
    }
  }
];