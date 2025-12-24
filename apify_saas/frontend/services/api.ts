/// <reference types="vite/client" />
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd, SearchHistoryItem, UserPlan } from '../types';
import { MOCK_USER } from './mockData'; // Nur als Fallback für User-Struktur
// @ts-ignore
import { cleanAndTransformData } from '../adAdapter';
// @ts-ignore
import { supabase } from './supabaseClient';

// Verbindung zum echten Backend herstellen
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

        // Wir mischen die echte User-ID mit der Struktur, die das neue Design erwartet
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

  async runSearch(params: SearchParams): Promise<SearchResult> {
    if (!this.user) throw new Error("Unauthorized: Bitte einloggen.");

    const cleanCountry = (!params.country || params.country === 'ALL') ? 'US' : params.country;

    // --- FIX START: Gemeinsame ID generieren ---
    const sharedSearchId = Math.random().toString(36).substring(7);
    // --- FIX END ---

    // Mapping: Frontend (camelCase) -> Backend (snake_case)
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

    console.log("🚀 Sende echte Anfrage an Backend:", payload);

    // --- NEU: Benchmarks laden (Parallel zum Search-Request) ---
    // Wir holen die Search-Results UND die Benchmarks gleichzeitig
    const [response, benchmarkResult] = await Promise.all([
        fetch(`${API_URL}/search/?user_id=${this.user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }),
        supabase.from('benchmark_cpr_cache').select('*')
    ]);

    // Benchmark Map erstellen
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
    let rawAdList = responseBody.data || [];

    // Daten für das Frontend aufbereiten
    let cleanedMetaAds: any[] = [];
    let tikTokAds: any[] = [];

    if (params.platform !== 'tiktok') {
        const metaRaw = rawAdList.filter((ad: any) => !ad.platform || ad.platform === 'meta' || ad.publisher_platform);
        if (metaRaw.length > 0) {
             const rowsToTransform = metaRaw.map((item: any) => ({ data: item }));
             // --- HIER: Map übergeben! ---
             cleanedMetaAds = cleanAndTransformData(rowsToTransform, benchmarkMap);
        }
    }

    if (params.platform !== 'meta') {
        tikTokAds = rawAdList.filter((ad: any) => ad.platform === 'tiktok');
    }

    // Credits abziehen (Lokal aktualisieren)
    if (this.user) {
        this.user.credits -= params.limit;
        
        const newHistoryItem: SearchHistoryItem = {
            id: sharedSearchId, // <--- HIER: Nutzen der shared ID
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
      id: sharedSearchId, // <--- HIER: Nutzen der shared ID
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