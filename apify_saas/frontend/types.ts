// types.ts (Original Structure + New Fields)

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

// --- META ADS ---

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

// NEU: Für Demografie-Daten
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
  reach?: number | null; // Das wichtige Feld!
  spend: number | null;

  // Rich Data
  demographics?: CountryBreakdown[]; // Rohdaten aus dem Backend
  target_locations?: any[];
  
  // Legacy / UI Helpers
  page_categories?: string[];
  disclaimer?: string;
  avatar?: string | null;
}

// ... (TikTok Interfaces bleiben wie im Original) ...
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