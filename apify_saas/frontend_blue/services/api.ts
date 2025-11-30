
import { MOCK_META_ADS, MOCK_TIKTOK_ADS, MOCK_USER } from './mockData';
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd, SearchHistoryItem } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private user: User = { ...MOCK_USER };

  async getUser(): Promise<User> {
    await delay(500);
    return { ...this.user };
  }

  async runSearch(params: SearchParams): Promise<SearchResult> {
    await delay(800); // Simulate Apify scrapping time
    
    const cost = params.limit; // 1 credit per result requested
    
    if (this.user.credits < cost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    this.user.credits -= cost;

    // Filter Logic to simulate real search
    const query = params.query.toLowerCase();
    
    let filteredMeta: MetaAd[] = [];
    if (params.platform !== 'tiktok') {
        filteredMeta = MOCK_META_ADS.filter(ad => 
            ad.page_name.toLowerCase().includes(query) || 
            ad.snapshot.body.text.toLowerCase().includes(query)
        );
    }

    let filteredTikTok: TikTokAd[] = [];
    if (params.platform !== 'meta') {
        filteredTikTok = MOCK_TIKTOK_ADS.filter(ad => 
            ad.authorMeta.nickName.toLowerCase().includes(query) || 
            ad.text.toLowerCase().includes(query)
        );
    }

    // Apply Limit (distribute limit between platforms if 'both' is selected)
    // If exact matches are fewer than limit, return all matches.
    // If matches exceed limit, slice them.
    
    const totalMatches = filteredMeta.length + filteredTikTok.length;
    
    // Simple distribution for 'both': take half from each if possible, or fill up.
    if (params.platform === 'both') {
        const metaLimit = Math.ceil(params.limit / 2);
        // If meta matches are less than half, give more quota to tiktok
        const metaTake = Math.min(filteredMeta.length, metaLimit);
        const tiktokTake = Math.min(filteredTikTok.length, params.limit - metaTake);
        
        filteredMeta = filteredMeta.slice(0, metaTake);
        filteredTikTok = filteredTikTok.slice(0, tiktokTake);
    } else {
        filteredMeta = filteredMeta.slice(0, params.limit);
        filteredTikTok = filteredTikTok.slice(0, params.limit);
    }

    const result: SearchResult = {
      id: Math.random().toString(36).substring(7),
      params,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metaAds: filteredMeta,
      tikTokAds: filteredTikTok,
      cost
    };
    
    // Add to history
    const historyItem: SearchHistoryItem = {
        id: result.id,
        query: params.query,
        platform: params.platform,
        timestamp: new Date().toISOString(),
        resultsCount: result.metaAds.length + result.tikTokAds.length,
        limit: params.limit
    };
    
    // Add to beginning of array
    this.user.searchHistory.unshift(historyItem);

    return result;
  }

  async purchaseCredits(amount: number): Promise<void> {
    await delay(1000);
    this.user.credits += amount;
  }

  async saveAd(ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok'): Promise<SavedAd> {
    await delay(300);
    const savedAd: SavedAd = {
      id: Math.random().toString(36).substring(7),
      type,
      data: ad,
      savedAt: new Date().toISOString()
    };
    // Check if already saved
    const exists = this.user.savedAds.find(s => 
      s.data.id === ad.id && s.type === type
    );
    
    if (!exists) {
        this.user.savedAds.unshift(savedAd);
    }
    return savedAd;
  }

  async removeSavedAd(id: string): Promise<void> {
      await delay(300);
      this.user.savedAds = this.user.savedAds.filter(ad => ad.id !== id);
  }
}

export const api = new ApiService();
