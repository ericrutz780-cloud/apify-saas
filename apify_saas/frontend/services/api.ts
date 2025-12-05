/// <reference types="vite/client" />
import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd } from '../types';
import { MOCK_USER } from './mockData';
// @ts-ignore
import { cleanAndTransformData } from '../adAdapter';

// --- KONFIGURATION ---
// Wir nutzen die Environment Variable von Vercel (Render Backend).
// Wenn VITE_API_URL nicht gesetzt ist (lokal), nehmen wir localhost.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Wir entfernen ein eventuelles Slash am Ende der URL, um Fehler zu vermeiden
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, '');

// Das Backend erwartet /api/v1 als Prefix
const API_URL = `${CLEAN_BASE_URL}/api/v1`;

console.log("API Configured to:", API_URL); // Debug-Info in der Konsole

class ApiService {
  private user: User | null = null;
  private token: string | null = null;

  // 1. LOGIN (Korrigiert: Nimmt jetzt email UND password)
  async login(email: string, password: string): Promise<User> {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // WICHTIG: Hier wird jetzt das echte Passwort gesendet!
            body: JSON.stringify({ email, password: password })
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

  // 2. GET USER
  async getUser(): Promise<User | null> {
    if (this.user) return this.user;

    const storedId = localStorage.getItem('adspy_user_id');
    if (!storedId) return null;

    try {
        const response = await fetch(`${API_URL}/user/me?user_id=${storedId}`);
        if (response.ok) {
            const profileData = await response.json();
            this.user = { ...MOCK_USER, ...profileData, id: storedId };
            return this.user;
        } else {
            localStorage.removeItem('adspy_user_id');
            return null;
        }
    } catch (e) {
        return null;
    }
  }

  // 3. SUCHE (MIT ADAPTER INTEGRATION)
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
        if (typeof err.detail === 'string') {
            errorMsg = err.detail;
        } else if (Array.isArray(err.detail)) {
            errorMsg = err.detail.map((e: any) => `${e.loc[1]}: ${e.msg}`).join(', ');
        }
        throw new Error(errorMsg);
    }

    const responseBody = await response.json();
    let rawAdList = responseBody.data || [];

    // HIER WIRD TRANSFORMIERT:
    let cleanedMetaAds: any[] = [];

    if (params.platform !== 'tiktok') {
        const rowsToTransform = rawAdList.map((item: any) => ({ data: item }));
        cleanedMetaAds = cleanAndTransformData(rowsToTransform);
    }

    if (this.user) {
        this.user.credits -= params.limit;
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