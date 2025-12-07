/// <reference types="vite/client" />
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd, SearchHistoryItem } from '../types';
import { MOCK_USER } from './mockData';
// @ts-ignore
import { cleanAndTransformData } from '../adAdapter';

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

        this.user = {
            ...MOCK_USER,
            id: data.user.id,
            email: data.user.email,
        };

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
        const localHistory = this._getLocalHistory();
        this.user = { 
            ...MOCK_USER, 
            id: storedId, 
            searchHistory: localHistory.length > 0 ? localHistory : MOCK_USER.searchHistory 
        };
        return this.user;
    }
  }

  async runSearch(params: SearchParams): Promise<SearchResult> {
    if (!this.user) throw new Error("Unauthorized");

    const cleanCountry = (!params.country || params.country === 'ALL') ? 'US' : params.country;

    const response = await fetch(`${API_URL}/search/?user_id=${this.user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            keyword: params.query,
            platform: params.platform === 'both' ? 'meta' : params.platform,
            limit: params.limit,
            country: cleanCountry,
            sort_by: 'newest'
        })
    });

    if (!response.ok) {
        const err = await response.json();
        let errorMsg = "Search failed";
        if (typeof err.detail === 'string') errorMsg = err.detail;
        else if (Array.isArray(err.detail)) errorMsg = err.detail.map((e: any) => `${e.loc[1]}: ${e.msg}`).join(', ');
        throw new Error(errorMsg);
    }

    const responseBody = await response.json();
    let rawAdList = responseBody.data || [];

    let cleanedMetaAds: any[] = [];
    if (params.platform !== 'tiktok') {
        const rowsToTransform = rawAdList.map((item: any) => ({ data: item }));
        cleanedMetaAds = cleanAndTransformData(rowsToTransform);
    }

    if (this.user) {
        this.user.credits -= params.limit;

        // FIX: Jetzt ist 'country' erlaubt, da wir types.ts aktualisiert haben
        const newHistoryItem: SearchHistoryItem = {
            id: Math.random().toString(36).substring(7),
            query: params.query,
            platform: params.platform,
            timestamp: new Date().toISOString(),
            resultsCount: params.platform !== 'tiktok' ? cleanedMetaAds.length : rawAdList.length,
            limit: params.limit,
            country: cleanCountry
        };

        this.user.searchHistory = [newHistoryItem, ...this.user.searchHistory];
        this._saveLocalHistory(newHistoryItem);
    }

    return {
      id: Math.random().toString(36).substring(7),
      params,
      timestamp: new Date().toISOString(),
      status: 'completed',
      metaAds: cleanedMetaAds,
      tikTokAds: params.platform !== 'meta' ? rawAdList : [],
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