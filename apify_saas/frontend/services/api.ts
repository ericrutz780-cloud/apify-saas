/// <reference types="vite/client" />
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd, SearchHistoryItem, UserPlan } from '../types';
// @ts-ignore
import { cleanAndTransformData } from '../adAdapter';
// @ts-ignore
import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, '');
const API_URL = `${CLEAN_BASE_URL}/api/v1`;

class ApiService {
  private user: User | null = null;
  private token: string | null = null;

  private _getLocalHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem('adspy_local_history');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  private _saveLocalHistory(item: SearchHistoryItem) {
    const history = this._getLocalHistory();
    const filtered = history.filter(h => h.id !== item.id);
    const updated = [item, ...filtered].slice(0, 50);
    localStorage.setItem('adspy_local_history', JSON.stringify(updated));
  }

  async register(email: string, password: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const err = await response.json();
        const msg = err.detail ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)) : 'Registration failed';
        throw new Error(msg);
    }
    return await response.json();
  }

  async login(email: string, password: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }

        const data = await response.json();
        this.token = data.access_token;
        localStorage.setItem('adspy_token', data.access_token);
        
        localStorage.setItem('adspy_user_id', data.user.id);
        localStorage.setItem('adspy_user_email', data.user.email || email);

        await this.getUser();
        return this.user!;
    } catch (e: any) {
        console.error("Login Error:", e);
        throw new Error(e.message || "Login failed");
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
      if (!this.user) throw new Error("Nicht eingeloggt.");

      const response = await fetch(`${API_URL}/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              user_id: this.user.id,
              email: this.user.email,
              old_password: oldPassword,
              new_password: newPassword
          })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Passwort konnte nicht geändert werden.");
      }
  }

  async requestPasswordReset(email: string): Promise<void> {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
      });

      if (!response.ok) {
          console.error("Reset request failed technically");
      }
  }

  // NEU: Kontaktformular senden
  async sendContactForm(data: { name: string; email: string; message: string }): Promise<void> {
      const response = await fetch(`${API_URL}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });

      if (!response.ok) {
          throw new Error("Failed to send message");
      }
  }

  async getUser(): Promise<User | null> {
    const storedId = localStorage.getItem('adspy_user_id');
    const storedEmail = localStorage.getItem('adspy_user_email') || '';
    
    if (!storedId) return null;

    try {
        const response = await fetch(`${API_URL}/user/me?user_id=${storedId}`);
        let profileData: any = {};
        
        if (response.ok) {
            profileData = await response.json();
        }

        const localHistory = this._getLocalHistory();

        const rawPlan = profileData.plan || 'starter';
        const normalizedPlan = rawPlan.toLowerCase() as UserPlan;
        
        let limit = profileData.searchLimit;
        if (!limit) {
            limit = normalizedPlan === 'pro' ? 1000 : (normalizedPlan === 'enterprise' ? 5000 : 100);
        }

        this.user = { 
            id: storedId,
            email: profileData.email || storedEmail,
            name: profileData.name || 'User',
            plan: normalizedPlan,
            credits: profileData.credits || 0,
            searchLimit: limit,
            savedAds: profileData.savedAds || [],
            searchHistory: localHistory.length > 0 ? localHistory : (profileData.searchHistory || [])
        };
        
        return this.user;
    } catch (e) {
        console.warn("User fetch failed", e);
        return null;
    }
  }

  async updateUser(data: Partial<User>): Promise<User> {
      if (!this.user) throw new Error("User not logged in");

      const response = await fetch(`${API_URL}/user/me?user_id=${this.user.id}`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              name: data.name,
          })
      });

      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Failed to update profile");
      }

      this.user = { ...this.user, ...data };
      return this.user;
  }

  async getSearchHistory(searchId: string): Promise<SearchResult> {
    if (!this.user) throw new Error("Login required");
    
    if (!searchId || searchId === 'dashboard' || searchId === 'feed' || searchId.includes('undefined')) {
        throw new Error("Invalid search ID ignored"); 
    }

    const benchmarkResult = await supabase.from('benchmark_cpr_cache').select('*');
    const benchmarkMap: Record<string, number> = {};
    if (benchmarkResult.data) {
        benchmarkResult.data.forEach((row: any) => {
            const key = `${row.country}_${row.gender}_${row.age_group}`;
            benchmarkMap[key] = row.cpr_value;
        });
    }

    const cleanId = searchId.split('?')[0];

    const response = await fetch(`${API_URL}/search/history/${cleanId}?user_id=${this.user.id}`);
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Network Error" }));
        const msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        throw new Error(msg);
    }
    
    const body = await response.json();
    const rawAds = body.data || [];

    let cleanedMetaAds: any[] = [];
    const metaRaw = rawAds.filter((ad: any) => !ad.platform || ad.platform === 'meta' || ad.publisher_platform);
    if (metaRaw.length > 0) {
         const rowsToTransform = metaRaw.map((item: any) => ({ data: item }));
         cleanedMetaAds = cleanAndTransformData(rowsToTransform, benchmarkMap);
    }
    const tikTokAds = rawAds.filter((ad: any) => ad.platform === 'tiktok');
    
    const combinedData = [...cleanedMetaAds, ...tikTokAds];

    return {
        id: cleanId,
        search_id: cleanId,
        params: { 
            query: body.meta?.query || "", 
            platform: 'meta', 
            country: 'DE', 
            limit: body.meta?.count || 0
        },
        timestamp: new Date().toISOString(),
        status: 'completed',
        metaAds: cleanedMetaAds,
        tikTokAds: tikTokAds,
        data: combinedData,
        meta: body.meta,
        cost: 0
    };
  }

  async runSearch(params: SearchParams): Promise<SearchResult> {
    if (!this.user) throw new Error("Unauthorized: Bitte einloggen.");

    const cleanCountry = (!params.country || params.country === 'ALL') ? 'US' : params.country;
    const limit = this.user.searchLimit || 100;

    const payload = {
        keyword: params.query,
        platform: params.platform === 'both' ? 'meta' : params.platform,
        limit: limit,
        country: cleanCountry,
        start_date_min: params.startDateMin, 
        start_date_max: params.startDateMax,
        sort_by: 'newest',
        active_status: 'active'
    };

    const [response, benchmarkResult] = await Promise.all([
        fetch(`${API_URL}/search/?user_id=${this.user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),
        supabase.from('benchmark_cpr_cache').select('*')
    ]);

    const benchmarkMap: Record<string, number> = {};
    if (benchmarkResult.data) {
        benchmarkResult.data.forEach((row: any) => {
            const key = `${row.country}_${row.gender}_${row.age_group}`;
            benchmarkMap[key] = row.cpr_value;
        });
    }

    if (!response.ok) {
        const err = await response.json();
        const msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        throw new Error(msg);
    }

    const responseBody = await response.json();
    const searchId = responseBody.meta?.search_id || responseBody.id || Math.random().toString(36).substring(7);
    
    let rawAdList = responseBody.data || [];
    let cleanedMetaAds: any[] = [];
    let tikTokAds: any[] = [];

    if (params.platform !== 'tiktok') {
        const metaRaw = rawAdList.filter((ad: any) => !ad.platform || ad.platform === 'meta' || ad.publisher_platform);
        if (metaRaw.length > 0) {
             const rowsToTransform = metaRaw.map((item: any) => ({ data: item }));
             cleanedMetaAds = cleanAndTransformData(rowsToTransform, benchmarkMap);
        }
    }

    if (params.platform !== 'meta') {
        tikTokAds = rawAdList.filter((ad: any) => ad.platform === 'tiktok');
    }

    if (this.user) {
        this.user.credits -= limit;
        
        const newHistoryItem: SearchHistoryItem = {
            id: searchId, 
            query: params.query,
            platform: params.platform,
            timestamp: new Date().toISOString(),
            resultsCount: cleanedMetaAds.length + tikTokAds.length,
            limit: limit,
            country: cleanCountry
        };
        this.user.searchHistory = [newHistoryItem, ...this.user.searchHistory];
        this._saveLocalHistory(newHistoryItem);
    }

    const combinedData = [...cleanedMetaAds, ...tikTokAds];

    return {
      id: searchId,
      search_id: searchId,
      params,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metaAds: cleanedMetaAds,
      tikTokAds: tikTokAds,
      data: combinedData,
      meta: responseBody.meta,
      cost: limit
    };
  }

  async saveAd(ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok'): Promise<SavedAd> {
    if (!this.user) throw new Error("Login required");

    const response = await fetch(`${API_URL}/user/saved-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.user.id, type, data: ad })
    });

    if (!response.ok) throw new Error("Failed to save");

    const savedAd: SavedAd = {
      id: "temp", 
      type, 
      data: ad, 
      savedAt: new Date().toISOString()
    };
    
    return savedAd;
  }

  async removeSavedAd(id: string): Promise<void> {
      if (!this.user) return;
      
      if (id.length < 10) {
          this.user.savedAds = this.user.savedAds.filter(ad => ad.id !== id);
          return;
      }

      await fetch(`${API_URL}/user/saved-ads/${id}?user_id=${this.user.id}`, { method: 'DELETE' });
      this.user.savedAds = this.user.savedAds.filter(ad => ad.id !== id);
  }

  async purchaseCredits(amount: number): Promise<void> {
    if (this.user) this.user.credits += amount;
  }

  async createCheckoutSession(priceId: string): Promise<{ url: string }> {
      if (!this.user) throw new Error("Please log in to purchase.");
      
      const response = await fetch(`${API_URL}/create-checkout-session?user_id=${this.user.id}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price_id: priceId })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Checkout initiation failed');
      }

      return await response.json();
  }
}

export const api = new ApiService();