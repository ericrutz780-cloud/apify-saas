export interface SavedAd {
  id: string;
  type: 'meta' | 'tiktok';
  data: MetaAd | TikTokAd;
  savedAt: string;
}

// FIX: 'country' hinzugefügt, damit api.ts keinen Fehler mehr wirft
export interface SearchHistoryItem {
  id: string;
  query: string;
  platform: Platform;
  timestamp: string;
  resultsCount: number;
  limit: number;
  country?: string; // Optionaler Country Code (z.B. "US", "DE")
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
export interface MetaAdCardItem {
    title?: string;
    body?: string;
    link_url?: string;
    cta_text?: string;
    original_image_url?: string;
    resized_image_url?: string;
    video_hd_url?: string;
    video_sd_url?: string;
    video_preview_image_url?: string;
}

export interface MetaAdSnapshot {
  cta_text: string;
  link_url: string;
  body: {
    text: string;
  };
  images: Array<{ resized_image_url: string; original_image_url?: string }>;
  videos: Array<{ video_hd_url: string; video_sd_url?: string; video_preview_image_url?: string }>;
  cards?: MetaAdCardItem[];
}

export interface MetaAd {
  id: string;
  publisher_platform: string[];
  start_date: string;
  page_name: string;
  page_profile_uri: string;
  ad_library_url: string;
  snapshot: MetaAdSnapshot;
  likes: number;
  impressions: number;
  spend: number;
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