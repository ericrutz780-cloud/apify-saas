import { SearchParams, SearchResult, User, MetaAd, TikTokAd, SavedAd } from '../types';
import { MOCK_USER } from './mockData';

// Backend URL
const API_URL = 'http://127.0.0.1:8000/api/v1'; 

class ApiService {
  private user: User | null = null;
  private token: string | null = null;

  // 1. Login (Speichert jetzt im Browser)
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
        
        // WICHTIG: Wir merken uns die ID im Browser!
        localStorage.setItem('adspy_user_id', data.user.id);

        this.user = {
            ...MOCK_USER, // Layout-Basis
            id: data.user.id,
            email: data.user.email,
        };
        
        await this.getUser(); 
        return this.user!;
    } catch (e) {
        console.error("Login Error:", e);
        throw e; // Fehler weiterwerfen, damit UI eine Meldung zeigen kann
    }
  }

  // 2. Profil laden (Kein Mock-Fallback mehr!)
  async getUser(): Promise<User | null> {
    // A) Wenn schon im RAM, direkt zurückgeben
    if (this.user) return this.user;

    // B) Prüfen, ob wir eine gespeicherte Session im Browser haben
    const storedUserId = localStorage.getItem('adspy_user_id');
    
    // WENN NICHT: Geben wir null zurück -> App zeigt Login-Screen!
    if (!storedUserId) {
        return null;
    }

    // C) Wenn ID da ist, versuchen wir das echte Profil zu laden
    try {
        const response = await fetch(`${API_URL}/user/me?user_id=${storedUserId}`);
        
        if (response.ok) {
            const profileData = await response.json();
            
            // Wir mischen echte Daten mit Mock-Struktur (für UI-Sicherheit)
            this.user = {
                ...MOCK_USER,
                ...profileData,
                id: storedUserId // Sicherstellen, dass ID stimmt
            };
            return this.user;
        } else {
            // Falls Server Fehler (z.B. User gelöscht), ausloggen
            this.logout();
            return null;
        }
    } catch (e) {
        console.error("Server nicht erreichbar", e);
        return null; // Kein Mock-Fallback mehr -> Login Screen
    }
  }

  // Helper zum Ausloggen
  logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('adspy_user_id');
      window.location.href = '/login'; // Harter Redirect zum Login
  }

  // 3. Suche ausführen
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

  // 4. Ad speichern
  async saveAd(ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok'): Promise<SavedAd> {
    if (!this.user) throw new Error("Login required");

    await fetch(`${API_URL}/user/saved-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: this.user.id,
            type,
            data: ad
        })
    });

    const savedAd: SavedAd = {
      id: Math.random().toString(36).substring(7),
      type,
      data: ad,
      savedAt: new Date().toISOString()
    };
    
    if (this.user) {
        this.user.savedAds.unshift(savedAd);
    }
    
    return savedAd;
  }

  // 5. Ad entfernen
  async removeSavedAd(id: string): Promise<void> {
      if (!this.user) return;
      
      await fetch(`${API_URL}/user/saved-ads/${id}?user_id=${this.user.id}`, {
          method: 'DELETE'
      });

      this.user.savedAds = this.user.savedAds.filter(ad => ad.id !== id);
  }

  async purchaseCredits(amount: number): Promise<void> {
    if (this.user) this.user.credits += amount;
  }
}

export const api = new ApiService();