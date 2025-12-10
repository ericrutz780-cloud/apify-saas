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

// Meta Ad Models
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

// NEU: Interfaces für die Demografie-Daten
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
  ages: string[]; // e.g. "18-65+"
  genders: string[]; // e.g. "All", "Female"
  locations: string[]; // e.g. "Germany", "France", "US"
  excluded_locations?: string[];
  reach_estimate?: number | null; // EU Reach estimate
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
  
  // NEU: Felder für Viralitäts-Logik und Frontend-Anzeige
  reach?: number | null; 
  efficiency_score?: number | null; // Der 0-100 Score
  viral_factor?: number | null;     // Der Faktor (z.B. 37.5x)
  page_size?: number | null;

  // Detailed Data
  targeting?: MetaAdTargeting;
  transparency_regions?: MetaAdRegionTransparency[];
  page_categories?: string[]; // e.g. "Clothing Store"
  disclaimer?: string; // "Paid for by..."
  advertiser_info?: MetaAdAdvertiserInfo;
  about_disclaimer?: MetaAdAboutDisclaimer;
  beneficiary_payer?: MetaAdBeneficiaryPayer;
  
  // NEU: Rich Data direkt am Objekt
  demographics?: CountryBreakdown[];
  target_locations?: any[];

  avatar?: string | null;
}

// TikTok Ad Models
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
  diggCount: number; // Likes
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