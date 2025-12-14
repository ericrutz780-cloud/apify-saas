
import { MOCK_META_ADS, MOCK_TIKTOK_ADS, MOCK_USER } from './mockData';
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd, SearchHistoryItem, UserPlan } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const PLAN_LIMITS: Record<UserPlan, number> = {
    'starter': 100,
    'pro': 250,
    'agency': 500
};

class ApiService {
  private user: User = { ...MOCK_USER };

  async getUser(): Promise<User> {
    await delay(500);
    return { ...this.user };
  }

  async updateUser(data: Partial<User>): Promise<User> {
    await delay(800);
    this.user = { ...this.user, ...data };
    return { ...this.user };
  }

  async runSearch(params: SearchParams): Promise<SearchResult> {
    await delay(800); // Simulate Apify scrapping time
    
    // Determine limit based on plan, ignore params.limit logic for cost calculation if passed from UI
    // In a real app, backend enforces this.
    const effectiveLimit = PLAN_LIMITS[this.user.plan] || 100;
    const cost = effectiveLimit; // 1 credit per result requested
    
    if (this.user.credits < cost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    this.user.credits -= cost;

    // Filter Logic to simulate real search
    const query = params.query.toLowerCase();
    
    // --- META FILTERING ---
    let filteredMeta: MetaAd[] = [];
    if (params.platform !== 'tiktok') {
        filteredMeta = MOCK_META_ADS.filter(ad => {
            const matchesQuery = ad.page_name.toLowerCase().includes(query) || 
                               ad.snapshot.body.text.toLowerCase().includes(query);
            
            let matchesDate = true;
            if (params.startDateMin) {
                matchesDate = matchesDate && new Date(ad.start_date) >= new Date(params.startDateMin);
            }
            if (params.startDateMax) {
                matchesDate = matchesDate && new Date(ad.start_date) <= new Date(params.startDateMax);
            }
            
            return matchesQuery && matchesDate;
        });
    }

    // --- TIKTOK FILTERING ---
    let filteredTikTok: TikTokAd[] = [];
    if (params.platform !== 'meta') {
        filteredTikTok = MOCK_TIKTOK_ADS.filter(ad => {
             const matchesQuery = ad.authorMeta.nickName.toLowerCase().includes(query) || 
                                ad.text.toLowerCase().includes(query);
             
             let matchesDate = true;
             if (params.startDateMin) {
                 matchesDate = matchesDate && new Date(ad.createTimeISO) >= new Date(params.startDateMin);
             }
             if (params.startDateMax) {
                 matchesDate = matchesDate && new Date(ad.createTimeISO) <= new Date(params.startDateMax);
             }
             
             return matchesQuery && matchesDate;
        });
    }

    // Apply Limit based on Plan (distribute limit between platforms if 'both' is selected)
    
    // Simple distribution for 'both': take half from each if possible, or fill up.
    if (params.platform === 'both') {
        const metaLimit = Math.ceil(effectiveLimit / 2);
        // If meta matches are less than half, give more quota to tiktok
        const metaTake = Math.min(filteredMeta.length, metaLimit);
        const tiktokTake = Math.min(filteredTikTok.length, effectiveLimit - metaTake);
        
        filteredMeta = filteredMeta.slice(0, metaTake);
        filteredTikTok = filteredTikTok.slice(0, tiktokTake);
    } else {
        filteredMeta = filteredMeta.slice(0, effectiveLimit);
        filteredTikTok = filteredTikTok.slice(0, effectiveLimit);
    }

    const result: SearchResult = {
      id: Math.random().toString(36).substring(7),
      params: { ...params, limit: effectiveLimit }, // Update params with actual used limit
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
        limit: effectiveLimit
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
