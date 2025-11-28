import { MOCK_META_ADS, MOCK_TIKTOK_ADS, MOCK_USER } from './mockData';
import { SearchParams, SearchResult, User } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private user: User = { ...MOCK_USER };

  async getUser(): Promise<User> {
    await delay(500);
    return { ...this.user };
  }

  async runSearch(params: SearchParams): Promise<SearchResult> {
    await delay(1500); // Simulate Apify scrapping time (shortened for demo)
    
    const cost = params.limit; // 1 credit per result requested
    
    if (this.user.credits < cost) {
      throw new Error("Insufficient credits");
    }

    // Deduct credits
    this.user.credits -= cost;

    const result: SearchResult = {
      id: Math.random().toString(36).substring(7),
      params,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metaAds: params.platform !== 'tiktok' ? MOCK_META_ADS : [],
      tikTokAds: params.platform !== 'meta' ? MOCK_TIKTOK_ADS : [],
      cost
    };

    return result;
  }

  async purchaseCredits(amount: number): Promise<void> {
    await delay(1000);
    this.user.credits += amount;
  }
}

export const api = new ApiService();