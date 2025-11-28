export type Platform = 'META' | 'TIKTOK';

export interface Ad {
  id: string;
  platform: Platform;
  advertiserName: string;
  advertiserHandle: string;
  headline: string; // Meta only mostly
  primaryText: string;
  ctaText: string;
  format: 'IMAGE' | 'VIDEO';
  imageUrl: string;
  
  // Metrics
  likes: number;
  shares: number;
  views: number; // Playcount
  impressions: number; // Meta
  spend: number; // Meta
  timestamp: string; // ISO Date
}

export interface SearchParams {
  keyword: string;
  limit: number;
  country?: string; // Meta only
}

export type SortOption = 'RECENCY' | 'LIKES' | 'SHARES' | 'VIEWS' | 'IMPRESSIONS' | 'SPEND';

export interface FilterState {
  sortBy: SortOption;
  format?: 'ALL' | 'IMAGE' | 'VIDEO';
  minLikes?: number;
}
