import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd } from '../types';
import { MOCK_USER } from './mockData';

const API_URL = 'http://127.0.0.1:8000/api/v1'; 

class ApiService {
  private user: User | null = null;
  private token: string | null = null;

  // 1. LOGIN mit LocalStorage
  async login(email: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password' }) 
        });

        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        this.token = data.access_token;
        
        // ID merken!
        localStorage.setItem('adspy_user_id', data.user.id);

        this.user = {
            ...MOCK_USER,
            id: data.user.id,
            email: data.user.email,
        };
        
        // Profil nachladen um Credits zu haben
        await this.getUser(); 
        
        return this.user!;
    } catch (e) {
        console.error("Login Error:", e);
        throw e;
    }
  }

  // 2. GET USER mit Auto-Login
  async getUser(): Promise<User | null> {
    if (this.user) return this.user;

    // Prüfen ob ID gespeichert ist
    const storedId = localStorage.getItem('adspy_user_id');
    if (!storedId) return null; // Kein User -> Login Screen

    try {
        const response = await fetch(`${API_URL}/user/me?user_id=${storedId}`);
        if (response.ok) {
            const profileData = await response.json();
            this.user = { 
                ...MOCK_USER, 
                ...profileData, 
                id: storedId 
            };
            return this.user;
        } else {
            // Falls ID ungültig, Speicher löschen
            localStorage.removeItem('adspy_user_id');
            return null;
        }
    } catch (e) {
        console.error("Backend Error", e);
        return null;
    }
  }

  // 3. SUCHE
  async runSearch(params: SearchParams): Promise<SearchResult> {
    if (!this.user) throw new Error("Unauthorized");

    const response = await fetch(`${API_URL}/search/?user_id=${this.user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            keyword: params.query,
            platform: params.platform === 'both' ? 'meta' : params.platform,
            limit: params.limit,
            country: params.country || 'US',
            sort_by: 'relevancy'
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Search failed");
    }

    const data = await response.json();
    
    // Credits sofort abziehen (UI)
    if (this.user) {
        this.user.credits -= params.limit;
    }

    return {
      id: Math.random().toString(36).substring(7),
      params,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metaAds: params.platform !== 'tiktok' ? data.data : [],
      tikTokAds: params.platform !== 'meta' ? data.data : [],
      cost: params.limit
    };
  }

  // 4. SAVE AD
  async saveAd(ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok'): Promise<SavedAd> {
    if (!this.user) throw new Error("Login required");

    await fetch(`${API_URL}/user/saved-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.user.id, type, data: ad })
    });

    const savedAd: SavedAd = {
      id: Math.random().toString(36).substring(7),
      type, data: ad, savedAt: new Date().toISOString()
    };
    this.user.savedAds.unshift(savedAd);
    return savedAd;
  }

  // 5. REMOVE AD
  async removeSavedAd(id: string): Promise<void> {
      if (!this.user) return;
      await fetch(`${API_URL}/user/saved-ads/${id}?user_id=${this.user.id}`, { method: 'DELETE' });
      this.user.savedAds = this.user.savedAds.filter(ad => ad.id !== id);
  }

  async purchaseCredits(amount: number): Promise<void> {
    if (this.user) this.user.credits += amount;
  }
}

export const api = new ApiService();