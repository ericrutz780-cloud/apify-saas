/// <reference types="vite/client" />
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd, SearchHistoryItem, UserPlan } from '../types';
import { MOCK_USER } from './mockData'; 
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
    const updated = [item, ...history].slice(0, 50);
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
        throw new Error(err.detail || 'Registration failed');
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
        localStorage.setItem('adspy_user_id', data.user.id);

        await this.getUser();
        return this.user!;
    } catch (e: any) {
        console.error("Login Error:", e);
        throw new Error(e.message || "Login failed");
    }
  }

  async getUser(): Promise<User | null> {
    const storedId = localStorage.getItem('adspy_user_id');
    if (!storedId) return null;

    try {
        const response = await fetch(`${API_URL}/user/me?user_id=${storedId}`);
        let profileData = {};
        
        if (response.ok) {
            profileData = await response.json();
        }

        const localHistory = this._getLocalHistory();

        this.user = { 
            ...MOCK_USER, 
            ...profileData, 
            id: storedId,
            searchHistory: localHistory.length > 0 ? localHistory : (MOCK_USER.searchHistory || [])
        };
        
        return this.user;
    } catch (e) {
        console.warn("User fetch failed", e);
        return null;
    }
  }

  async updateUser(data: Partial<User>): Promise<User> {
      if (this.user) {
          this.user = { ...this.user, ...data };
      }
      return this.user!;
  }

  // --- RERUN / HISTORY LOAD ---
  async getSearchHistory(searchId: string): Promise<SearchResult> {
    if (!this.user) throw new Error("Login required");
    
    // 1. Benchmarks laden
    const benchmarkResult = await supabase.from('benchmark_cpr_cache').select('*');
    const benchmarkMap: Record<string, number> = {};
    if (benchmarkResult.data) {
        benchmarkResult.data.forEach((row: any) => {
            const key = `${row.country}_${row.gender}_${row.age_group}`;
            benchmarkMap[key] = row.cpr_value;
        });
    }

    // FIX: ID bereinigen (entfernt ?q=... falls vorhanden)
    const cleanId = searchId.split('?')[0];

    // 2. Daten vom Backend holen
    const response = await fetch(`${API_URL}/search/history/${cleanId}?user_id=${this.user.id}`);
    
    if (!response.ok) throw new Error("History load failed");
    
    const body = await response.json();
    const rawAds = body.data || [];

    // 3. Transformieren
    let cleanedMetaAds: any[] = [];
    
    const metaRaw = rawAds.filter((ad: any) => !ad.platform || ad.platform === 'meta' || ad.publisher_platform);
    if (metaRaw.length > 0) {
         const rowsToTransform = metaRaw.map((item: any) => ({ data: item }));
         cleanedMetaAds = cleanAndTransformData(rowsToTransform, benchmarkMap);
    }
    
    const tikTokAds = rawAds.filter((ad: any) => ad.platform === 'tiktok');

    return {
        id: cleanId,
        params: { 
            query: body.meta.query, 
            platform: 'meta', 
            country: 'DE', 
            limit: body.meta.count 
        },
        timestamp: new Date().toISOString(),
        status: 'completed',
        metaAds: cleanedMetaAds,
        tikTokAds: tikTokAds,
        cost: 0
    };
  }

  async runSearch(params: SearchParams): Promise<SearchResult> {
    if (!this.user) throw new Error("Unauthorized: Bitte einloggen.");

    const cleanCountry = (!params.country || params.country === 'ALL') ? 'US' : params.country;

    const payload = {
        keyword: params.query,
        platform: params.platform === 'both' ? 'meta' : params.platform,
        limit: params.limit,
        country: cleanCountry,
        start_date_min: params.startDateMin, 
        start_date_max: params.startDateMax,
        sort_by: 'newest',
        active_status: 'active'
    };

    // Parallel Benchmarks & Search laden
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
        throw new Error(err.detail || "Search failed");
    }

    const responseBody = await response.json();
    
    // WICHTIG: ID vom Backend nehmen
    const searchId = responseBody.meta?.search_id || Math.random().toString(36).substring(7);
    
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
        this.user.credits -= params.limit;
        
        const newHistoryItem: SearchHistoryItem = {
            id: searchId, // Hier ist die echte DB ID!
            query: params.query,
            platform: params.platform,
            timestamp: new Date().toISOString(),
            resultsCount: cleanedMetaAds.length + tikTokAds.length,
            limit: params.limit,
            country: cleanCountry
        };
        this.user.searchHistory = [newHistoryItem, ...this.user.searchHistory];
        this._saveLocalHistory(newHistoryItem);
    }

    return {
      id: searchId,
      params,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metaAds: cleanedMetaAds,
      tikTokAds: tikTokAds,
      cost: params.limit
    };
  }

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