export type Platform = 'meta' | 'tiktok' | 'both';
export type UserPlan = 'starter' | 'pro' | 'enterprise';

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

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: UserPlan;
  searchLimit: number; 
  savedAds: SavedAd[];
  searchHistory: SearchHistoryItem[];
}

export interface SearchParams {
  query: string;
  platform: Platform;
  limit: number;
  country?: string;
  startDateMin?: string;
  startDateMax?: string;
}

// --- META ADS ---

export interface MetaAdSnapshot {
  cta_text: string;
  link_url: string;
  title: string;
  body: {
    text: string;
  };
  images: Array<{ 
      resized_image_url: string; 
      original_image_url?: string; 
  }>;
  videos: Array<{ 
      video_hd_url: string; 
      video_sd_url?: string;
      video_preview_image_url?: string; 
  }>;
  cards?: any[]; 
  page_name?: string;
  page_profile_picture_url?: string;
  transparency_by_location?: any;
  creation_time?: string;
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
  ad_archive_id: string; 
  isActive: boolean;
  publisher_platform: string[];
  start_date: string;
  end_date?: string;
  page_name: string;
  page_profile_uri?: string;
  ad_library_url: string;
  snapshot: MetaAdSnapshot;
  likes?: number;
  impressions?: number;
  spend?: number;
  currency?: string;
  reach?: number;
  eu_total_reach?: number;
  efficiency_score?: number;
  targeting?: MetaAdTargeting;
  demographics?: any[]; 
  transparency_regions?: MetaAdRegionTransparency[];
  page_categories?: string[];
  disclaimer?: string;
  advertiser_info?: MetaAdAdvertiserInfo;
  about_disclaimer?: MetaAdAboutDisclaimer;
  beneficiary_payer?: MetaAdBeneficiaryPayer;
  avatar?: string | null;
  aaa_info?: any;
}

// --- TIKTOK ADS ---

export interface TikTokVideoMeta {
  coverUrl: string;
  downloadUrl?: string;
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
  createTimeISO?: string;
  createdTime?: number;
  diggCount: number;
  shareCount: number;
  playCount: number;
  commentCount: number;
  collectCount?: number;
  videoMeta: TikTokVideoMeta;
  authorMeta: TikTokAuthorMeta;
}

// FIX: 'meta' Feld hinzugefügt
export interface SearchResult {
  id: string;
  search_id?: string;
  params: SearchParams;
  timestamp?: string;
  status?: 'pending' | 'completed' | 'failed';
  metaAds?: MetaAd[];
  tikTokAds?: TikTokAd[];
  cost?: number;
  data: (MetaAd | TikTokAd)[];
  
  meta?: {
    count: number;
    source: string;
    search_id: string;
    query?: string;
    error?: string;
  };
}