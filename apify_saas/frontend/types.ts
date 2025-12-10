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
  timestamp: string;
  resultsCount: number;
  limit: number;
  // HIER WAR DER FEHLER: Das Feld hat gefehlt!
  country?: string; 
}

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  savedAds: SavedAd[];
  searchHistory: SearchHistoryItem[];
}

export type Platform = 'meta' | 'tiktok' | 'both';

export interface SearchParams {
  query: string;
  platform: Platform;
  limit: number;
  country?: string;
}

// --- META AD MODELS ---

export interface MetaAdSnapshot {
  cta_text: string;
  link_url: string;
  body: {
    text: string;
  };
  images: Array<{ resized_image_url: string; original_image_url?: string; video_preview_image_url?: string }>;
  videos: Array<{ video_hd_url: string; video_sd_url?: string; video_preview_image_url?: string }>;
  cards?: any[];
}

// NEU: Interfaces für Demografie-Daten
export interface DemographicBreakdown {
  age_range: string;
  male: number | null;
  female: number | null;
  unknown: number | null;
}

export interface CountryBreakdown {
  country: string;
  age_gender_breakdowns: DemographicBreakdown[];
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
  reach_estimate?: number | null; 
  breakdown?: MetaAdTargetingBreakdown[];
}

export interface MetaAdRegionTransparency {
    region: string; // e.g. "European Union", "United Kingdom"
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
  ad_archive_id?: string;
  isActive: boolean;
  publisher_platform: string[];
  start_date: string;
  page_name: string;
  page_profile_uri: string;
  ad_library_url: string;
  snapshot: MetaAdSnapshot;
  
  // Metrics
  likes: number;
  impressions: number | null;
  spend: number | null;
  
  // NEU: Felder für Viralität & Co.
  reach?: number | null; 
  efficiency_score?: number | null;
  viral_factor?: number | null;
  page_size?: number | null;

  // Detailed Data
  targeting?: MetaAdTargeting;
  transparency_regions?: any[]; 
  page_categories?: string[];
  disclaimer?: string;
  advertiser_info?: MetaAdAdvertiserInfo;
  about_disclaimer?: MetaAdAboutDisclaimer;
  beneficiary_payer?: MetaAdBeneficiaryPayer;
  
  // Rich Data
  demographics?: CountryBreakdown[];
  target_locations?: any[];

  avatar?: string | null;
}

// --- TIKTOK AD MODELS ---

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
}