export interface SavedAd {
  id: string;
  type: 'meta' | 'tiktok';
  data: MetaAd | TikTokAd;
  savedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  platform: Platform;
  country?: string;
  timestamp: string;
  resultsCount: number;
  limit: number;
}

// FIX: 'agency' entfernt, nur noch Starter, Pro, Enterprise
export type UserPlan = 'starter' | 'pro' | 'enterprise';

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: UserPlan;
  savedAds: SavedAd[];
  searchHistory: SearchHistoryItem[];
}

export type Platform = 'meta' | 'tiktok' | 'both';

export interface SearchParams {
  query: string;
  platform: Platform;
  limit: number;
  country?: string;
  startDateMin?: string;
  startDateMax?: string;
}

// Meta Ad Models
export interface MetaAdSnapshot {
  cta_text: string;
  link_url: string;
  body: {
    text: string;
  };
  images: Array<{ resized_image_url: string }>;
  videos: Array<{ video_hd_url: string }>;
}

export interface MetaAdTargetingBreakdown {
    location: string;
    age_range: string;
    gender: string;
    reach: number;
}

export interface MetaAdTargeting {
  ages: string[];
  genders: string[];
  locations: string[];
  excluded_locations?: string[];
  reach_estimate?: number;
  breakdown?: MetaAdTargetingBreakdown[];
}

export interface MetaAdRegionTransparency {
    region: string;
    description: string;
    ages: string[];
    genders: string[];
    locations: string[];
    excluded_locations?: string[];
    reach_estimate?: number;
    breakdown?: MetaAdTargetingBreakdown[];
}

export interface MetaAdAdvertiserInfo {
    facebook_handle?: string;
    facebook_followers?: number;
    instagram_handle?: string;
    instagram_followers?: number;
    about_text?: string;
    category?: string;
}

export interface MetaAdAboutDisclaimer {
    text: string;
    location?: string;
    website_url?: string;
    beneficiary?: string;
    payer?: string;
}

export interface MetaAdBeneficiaryPayer {
    text: string;
    beneficiary: string;
    payer: string;
}

export interface MetaAd {
  id: string;
  isActive: boolean;
  publisher_platform: string[];
  start_date: string;
  page_name: string;
  page_profile_uri: string;
  ad_library_url: string;
  snapshot: MetaAdSnapshot;
  likes: number;
  impressions: number;
  spend: number;
  efficiency_score?: number;
  targeting?: MetaAdTargeting;
  transparency_regions?: MetaAdRegionTransparency[];
  page_categories?: string[];
  disclaimer?: string;
  advertiser_info?: MetaAdAdvertiserInfo;
  about_disclaimer?: MetaAdAboutDisclaimer;
  beneficiary_payer?: MetaAdBeneficiaryPayer;
  // FIX: Avatar Feld hinzugefügt
  avatar?: string | null;
}

// TikTok Ad Models (bleiben als Typ erhalten, falls alte Daten existieren)
export interface TikTokVideoMeta {
  coverUrl: string;
  duration: number;
  height: number;
  width: number;
}

export interface TikTokAuthorMeta {
  nickName: string;
  profileUrl: string;
  avatarUrl: string;
}

export interface TikTokAd {
  id: string;
  webVideoUrl: string;
  text: string;
  createTimeISO: string;
  diggCount: number;
  shareCount: number;
  playCount: number;
  commentCount: number;
  collectCount: number;
  videoMeta: TikTokVideoMeta;
  authorMeta: TikTokAuthorMeta;
}

export interface SearchResult {
  id: string;
  params: SearchParams;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  metaAds: MetaAd[];
  tikTokAds: TikTokAd[];
  cost: number;
  data?: any[]; 
}