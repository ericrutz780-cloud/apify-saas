import React, { useEffect, useState, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import { api } from './services/api';
import { User, SearchParams, SearchResult, MetaAd, TikTokAd, SavedAd, SearchHistoryItem } from './types';
import MetaAdCard from './components/MetaAdCard';
import TikTokAdCard from './components/TikTokAdCard';
import AdDetailModal from './components/AdDetailModal';
import ErrorBoundary from './components/ErrorBoundary';
// @ts-ignore
import { cleanAndTransformData } from './adAdapter';
import AdFeed from './AdFeed';

import { 
    Search, Loader2, AlertCircle, CheckCircle2, CreditCard, 
    ArrowRight, Zap, Facebook, Instagram, Video,
    ChevronDown, BarChart3, ListFilter, Globe, Bookmark, Trash2, Undo2, X, LayoutGrid 
} from 'lucide-react';

// --- Constants ---
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'FR', name: 'France' },
    { code: 'BR', name: 'Brazil' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'SE', name: 'Sweden' },
    { code: 'TR', name: 'Turkey' },
    { code: 'AE', name: 'United Arab Emirates' }
];

// --- Components ---

const Toast = ({ message, onUndo, onClose, visible }: { message: string, onUndo?: () => void, onClose: () => void, visible: boolean }) => {
    if (!visible) return null;
    return (
        <div className="fixed bottom-6 right-6 z-[1000] animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] justify-between">
                <span className="text-sm font-medium">{message}</span>
                <div className="flex items-center gap-3">
                    {onUndo && (
                        <button onClick={onUndo} className="text-brand-300 hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors">
                            <Undo2 className="w-3 h-3" /> Undo
                        </button>
                    )}
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Pages ---

const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setError('');

    try {
        await api.login(email, password); 
        onLoginSuccess();       
        navigate('/dashboard'); 
    } catch (err: any) {
        console.error("Login Failed", err);
        setError('Login failed. Please check email and password.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center">
           <div className="mx-auto h-12 w-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
             <Zap className="h-6 w-6 text-white fill-white" />
           </div>
           <h2 className="mt-6 text-2xl font-semibold text-gray-900">Welcome back</h2>
           <p className="mt-2 text-sm text-gray-600">
             Enter your credentials to access the workspace.
           </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" 
                placeholder="Enter your email" 
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
    const navigate = useNavigate();

    // Stats Logic
    const searchCounts = user.searchHistory.reduce((acc, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topSearches = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([query]) => query);

    const handleBadgeClick = (term: string) => {
        navigate(`/search?q=${encodeURIComponent(term)}`);
    };

    // --- NEUE RERUN LOGIK (SMART CACHE) ---
    const handleRerun = (item: SearchHistoryItem) => {
        // 1. Suche im localStorage nach einem existierenden Ergebnis für diese Query/Plattform
        let cachedResultId = null;
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('search_')) {
                    const resultStr = localStorage.getItem(key);
                    if (resultStr) {
                        const result = JSON.parse(resultStr);
                        // Prüfen ob Query und Plattform übereinstimmen
                        // Wir prüfen auch, ob das Ergebnis "neu genug" ist (z.B. < 24h), wenn nötig. 
                        // Hier erstmal strikter Match auf Parameter.
                        if (
                            result.params && 
                            result.params.query === item.query && 
                            (result.params.platform === item.platform || item.platform === 'both')
                        ) {
                            cachedResultId = result.id;
                            break; // Gefunden!
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Cache Check Error:", e);
        }

        if (cachedResultId) {
            // Szenario A: Daten sind da -> Lade sofort ohne API Call und ohne Credits
            console.log(`Cache Hit for ${item.query}! Loading result ${cachedResultId}`);
            navigate(`/results/${cachedResultId}`);
        } else {
            // Szenario B: Keine Daten -> Navigiere zur Suche, damit User neu suchen kann (verbraucht Credits)
            // Wir füllen die Suche vor.
            console.log(`Cache Miss for ${item.query}. Redirecting to search.`);
            navigate(`/search?q=${encodeURIComponent(item.query)}&platform=${item.platform}&limit=${item.limit}`);
        }
    };

    // Helper für Datumsformatierung (z.B. "5.12.2025")
    const formatDate = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('de-DE', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            }).format(date);
        } catch (e) {
            return isoString;
        }
    };

    const formatPlatform = (p: string) => {
        if (p === 'both') return 'Both';
        return p.charAt(0).toUpperCase() + p.slice(1);
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1 text-sm">Overview of your activity and available credits.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/feed')} 
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                    >
                        <LayoutGrid className="w-4 h-4 mr-2 text-gray-500" />
                        Live Feed
                    </button>

                    <button 
                        onClick={() => navigate('/search')} 
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        New Search
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card 1: Credits */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Credits Available</span>
                        <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                             <CreditCard className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-semibold text-gray-900">{user.credits}</p>
                        <span className="text-sm text-gray-500">credits</span>
                    </div>
                    <div className="mt-auto pt-4 flex items-center text-sm">
                        <span onClick={() => navigate('/account?tab=billing')} className="text-brand-600 font-medium hover:text-brand-700 cursor-pointer flex items-center">
                            Top up credits <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                    </div>
                 </div>

                 {/* Card 2: Total Searches */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Total Searches</span>
                        <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                             <BarChart3 className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-2 mb-3">
                        <p className="text-3xl font-semibold text-gray-900">{user.searchHistory.length}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                         {topSearches.length > 0 ? topSearches.map(term => (
                             <span 
                                key={term}
                                onClick={() => handleBadgeClick(term)}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer border border-brand-100 transition-colors"
                             >
                                {term}
                             </span>
                         )) : (
                             <span className="text-xs text-gray-400 italic">No top searches yet</span>
                         )}
                    </div>
                 </div>

                 {/* Card 3: Active Plan */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Active Plan</span>
                        <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                             <Zap className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-semibold text-gray-900">Starter</p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center text-sm text-gray-500">
                        Renews on Nov 1, 2023
                    </div>
                 </div>
            </div>

            {/* Card 4: Recent Searches Table - DESIGN UPDATE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Recent Searches</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white border-b border-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">QUERY</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">PLATFORM</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">DATE</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">RESULTS</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                             {user.searchHistory.length > 0 ? (
                                 user.searchHistory.slice(0, 10).map((search) => (
                                     <tr key={search.id} className="hover:bg-gray-50 transition-colors group">
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                             {search.query}
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                             {formatPlatform(search.platform)}
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">
                                             {formatDate(search.timestamp)}
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 tabular-nums">
                                             {search.resultsCount}
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                             <button 
                                                onClick={() => handleRerun(search)}
                                                className="text-brand-600 hover:text-brand-800 font-medium hover:underline transition-all cursor-pointer"
                                             >
                                                 Rerun
                                             </button>
                                         </td>
                                     </tr>
                                 ))
                             ) : (
                                 <tr>
                                     <td colSpan={5} className="px-6 py-12 text-center">
                                         <div className="mx-auto flex flex-col items-center">
                                             <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                                 <Search className="h-5 w-5 text-gray-400" />
                                             </div>
                                             <h3 className="text-sm font-medium text-gray-900">No searches yet</h3>
                                             <p className="mt-1 text-sm text-gray-500">Start your first competitive analysis.</p>
                                         </div>
                                     </td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const SearchPage = ({ user, refreshUser }: { user: User, refreshUser: () => void }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
    const [country, setCountry] = useState('US');
    const [limit, setLimit] = useState(10);
    const [isCustomLimit, setIsCustomLimit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = searchParams.get('q');
        const p = searchParams.get('platform');
        const l = searchParams.get('limit');
        
        if (q) setQuery(q);
        if (p && (p === 'meta' || p === 'tiktok')) setPlatform(p as 'meta' | 'tiktok');
        if (l) {
            const limitVal = parseInt(l, 10);
            if (!isNaN(limitVal) && limitVal > 0) {
                setLimit(limitVal);
                if (![10, 25, 50, 100].includes(limitVal)) setIsCustomLimit(true);
            }
        }
    }, [searchParams]);

    const cost = limit;
    const canAfford = user.credits >= cost;
    const remainingCredits = user.credits - cost;

    const handleSearch = async () => {
        if (!query) return;
        if (!canAfford) return;

        setLoading(true);
        setError('');

        try {
            const result = await api.runSearch({ query, platform, country, limit });
            await refreshUser();
            localStorage.setItem(`search_${result.id}`, JSON.stringify(result));
            navigate(`/results/${result.id}`);
        } catch (err: any) {
            setError(err.message || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="w-full">
                <div className="text-left mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ad Intelligence Search</h1>
                    <p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta and TikTok libraries.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative transition-all focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 w-full">
                    <div className="flex items-center px-4">
                        <Search className="w-6 h-6 text-gray-400 mr-3" />
                        <input 
                            type="text" 
                            className="w-full py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent" 
                            placeholder="e.g. 'Skincare', 'Nike', or a domain URL..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="h-px bg-gray-100 mx-4"></div>
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                    {(['meta', 'tiktok'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPlatform(p)}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                                                platform === p 
                                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {(platform === 'meta') && (
                                <div className="relative">
                                    <select 
                                        value={country} 
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-9 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium h-full w-full"
                                    >
                                        {COUNTRIES.map((c) => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                    <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            )}
                            <div className="relative w-full sm:w-auto min-w-[130px]">
                                {!isCustomLimit ? (
                                    <>
                                        <select 
                                            value={[10, 25, 50, 100].includes(limit) ? limit : 'custom'} 
                                            onChange={(e) => {
                                                if (e.target.value === 'custom') setIsCustomLimit(true);
                                                else setLimit(Number(e.target.value));
                                            }}
                                            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium h-full w-full cursor-pointer"
                                        >
                                            <option value={10}>10 Results</option>
                                            <option value={25}>25 Results</option>
                                            <option value={50}>50 Results</option>
                                            <option value={100}>100 Results</option>
                                            <option value="custom">Custom...</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </>
                                ) : (
                                    <>
                                        <input 
                                            type="number"
                                            value={limit}
                                            onChange={(e) => setLimit(Number(e.target.value))}
                                            min={1}
                                            className="appearance-none bg-white border border-brand-500 text-gray-900 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-medium h-full w-full"
                                            placeholder="Custom"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                setIsCustomLimit(false);
                                                if (![10, 25, 50, 100].includes(limit)) setLimit(10);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-3 w-full md:w-auto justify-end mt-4 md:mt-0">
                            <div className="text-sm">
                                <span className="text-gray-500 mr-1">Cost:</span>
                                <span className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>{cost || 0} credits</span>
                            </div>
                            <button 
                                onClick={handleSearch}
                                disabled={!query || !canAfford || loading || limit <= 0}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Run Search <ArrowRight className="w-4 h-4 ml-2" /></>}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-start px-2">
                    {!canAfford ? (
                        <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Insufficient credits. You have {user.credits} available.
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                            You will have <span className="font-medium text-gray-900 mx-1">{remainingCredits}</span> credits left after this search.
                        </div>
                    )}
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-center">
                <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Facebook className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Meta Ad Library</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Access active ads from Facebook, Instagram, Audience Network and Messenger.</p>
                </div>
                <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-pink-600">
                        <Video className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900">TikTok Creative Center</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Discover top performing viral TikTok ads with detailed engagement metrics.</p>
                </div>
                <div className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-4 text-orange-600">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Instant Results</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Real-time scraping delivers the freshest data directly to your dashboard.</p>
                </div>
            </div>
        </div>
    );
};

const ResultsPage = ({ user, refreshUser, onOpenModal }: { user: User, refreshUser: () => void, onOpenModal: (data: any, type: any) => void }) => {
    const navigate = useNavigate();
    const path = window.location.hash;
    const id = path.split('/').pop();
    const [result, setResult] = useState<SearchResult | null>(null);
    const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
    const [country, setCountry] = useState('ALL');
    const [limit, setLimit] = useState(10);
    const [isCustomLimit, setIsCustomLimit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formatFilter, setFormatFilter] = useState<'all' | 'video' | 'image'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'reach_views' | 'spend_shares'>('newest');
    const [viewMode, setViewMode] = useState<'condensed' | 'details'>(() => {
        return (localStorage.getItem('view_mode') as 'condensed' | 'details') || 'details';
    });

    const handleViewModeChange = (mode: 'condensed' | 'details') => {
        setViewMode(mode);
        localStorage.setItem('view_mode', mode);
    };

    useEffect(() => {
        const stored = localStorage.getItem(`search_${id}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            setResult(parsed);
            setQuery(parsed.params.query);
            if (parsed.params.platform !== 'both') setPlatform(parsed.params.platform);
            setLimit(parsed.params.limit);
            if (![10, 25, 50, 100].includes(parsed.params.limit)) setIsCustomLimit(true);
            if (parsed.params.country) setCountry(parsed.params.country);
            if (parsed.params.platform === 'tiktok') setActiveTab('tiktok');
            else setActiveTab('facebook');
        }
    }, [id]);

    const cost = limit;
    const canAfford = user.credits >= cost;

    const handleSearch = async () => {
        if (!query) return;
        if (!canAfford) return;
        setLoading(true);
        setError('');
        try {
            const result = await api.runSearch({ query, platform, country, limit });
            await refreshUser();
            localStorage.setItem(`search_${result.id}`, JSON.stringify(result));
            navigate(`/results/${result.id}`);
        } catch (err: any) {
            setError(err.message || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const transformedMetaAds = useMemo(() => {
        if (!result || !result.metaAds) return [];
        const ads = result.metaAds;
        // @ts-ignore
        if (ads.length > 0 && ads[0].pageName) return ads;
        
        const adsToTransform = ads.map(ad => ({ data: ad }));
        return cleanAndTransformData(adsToTransform);
    }, [result]);

    if (!result) return <div className="flex justify-center pt-24"><Loader2 className="animate-spin w-8 h-8 text-brand-600" /></div>;

    const showMeta = result.params.platform !== 'tiktok';
    const showTikTok = result.params.platform !== 'meta';
    
    const metaAds = transformedMetaAds;
    const tikTokAds = result.tikTokAds || [];
    
    const facebookAds = metaAds.filter((ad: any) => ad.platform && ad.platform.includes('facebook'));
    const instagramAds = metaAds.filter((ad: any) => ad.platform && ad.platform.includes('instagram'));

    const getFilteredAndSortedAds = () => {
        let ads: any[] = [];
        let isMetaTab = false;

        if (activeTab === 'facebook') { ads = [...facebookAds]; isMetaTab = true; } 
        else if (activeTab === 'instagram') { ads = [...instagramAds]; isMetaTab = true; } 
        else { ads = [...tikTokAds]; isMetaTab = false; }

        if (isMetaTab) {
            if (formatFilter === 'video') ads = ads.filter((ad: any) => ad.media?.type === 'video');
            else if (formatFilter === 'image') ads = ads.filter((ad: any) => ad.media?.type === 'image' || ad.media?.type === 'carousel');

            ads.sort((a, b) => {
                // Nur noch Newest und Reach für Meta (da Likes/Spend oft fehlen)
                if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
                if (sortBy === 'reach_views') return (b.impressions || 0) - (a.impressions || 0);
                if (sortBy === 'spend_shares') return (b.spend || 0) - (a.spend || 0);
                return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
            });
            return ads;
        } else {
            if (formatFilter === 'image') return [];
            ads.sort((a, b) => {
                if (sortBy === 'likes') return (b.diggCount || 0) - (a.diggCount || 0);
                if (sortBy === 'reach_views') return (b.playCount || 0) - (a.playCount || 0); 
                if (sortBy === 'spend_shares') return (b.shareCount || 0) - (a.shareCount || 0);
                return new Date(b.createTimeISO || 0).getTime() - new Date(a.createTimeISO || 0).getTime();
            });
            return ads;
        }
    };

    const displayedAds = getFilteredAndSortedAds();
    const isMetaActive = activeTab === 'facebook' || activeTab === 'instagram';

    return (
        <div className="w-full">
            <div className="w-full">
                 <div className="text-left mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ad Intelligence Search</h1>
                    <p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta and TikTok libraries.</p>
                </div>
                
                <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative transition-all focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 w-full">
                    {/* Simplified Search Bar */}
                    <div className="flex items-center px-4">
                        <Search className="w-6 h-6 text-gray-400 mr-3" />
                        <input 
                            type="text" 
                            className="w-full py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent" 
                            placeholder="Search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                         <button 
                            onClick={handleSearch}
                            disabled={!query || !canAfford || loading}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all disabled:opacity-50 ml-4"
                        >
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 space-y-6">
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
                        <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                            Results for <span className="text-brand-600">"{result.params.query}"</span>
                        </h2>
                        <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start">
                            {showMeta && (
                                <>
                                    <button onClick={() => setActiveTab('facebook')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'facebook' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}>
                                        <Facebook className="w-3.5 h-3.5 mr-2 text-[#1877F2]" /> Facebook <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{facebookAds.length}</span>
                                    </button>
                                    <button onClick={() => setActiveTab('instagram')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'instagram' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}>
                                        <Instagram className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> Instagram <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{instagramAds.length}</span>
                                    </button>
                                </>
                            )}
                            {showTikTok && (
                                <button onClick={() => setActiveTab('tiktok')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'tiktok' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}>
                                    <Video className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> TikTok <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{result.tikTokAds.length}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <ListFilter className="w-4 h-4 mr-2 text-gray-500" />
                            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                                {(['all', 'video', 'image'] as const).map((f) => (
                                    <button key={f} onClick={() => setFormatFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${formatFilter === f ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-gray-600 hover:bg-gray-50'}`}>{f === 'all' ? 'All' : f}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                             <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-gray-50">
                                <option value="newest">Newest</option>
                                <option value="likes">Likes</option>
                                <option value="reach_views">{isMetaActive ? 'Reach' : 'Views'}</option>
                                <option value="spend_shares">{isMetaActive ? 'Spend' : 'Shares'}</option>
                             </select>
                        </div>
                         <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                             <select value={viewMode} onChange={(e) => handleViewModeChange(e.target.value as any)} className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-gray-50">
                                <option value="details">Details</option>
                                <option value="condensed">Condensed</option>
                             </select>
                        </div>
                    </div>
                </div>
            
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {/* HIER NUTZEN WIR displayedAds (die transformierten und gefilterten Daten) */}
                    {isMetaActive && displayedAds.map((ad: any, i: number) => (
                        <MetaAdCard 
                            key={ad.id || `fallback-meta-${i}`} 
                            ad={ad} 
                            viewMode={viewMode} 
                            onClick={(data) => onOpenModal(data, 'meta')} 
                            platformContext={activeTab === 'facebook' || activeTab === 'instagram' ? activeTab : undefined} 
                        />
                    ))}
                    {activeTab === 'tiktok' && displayedAds.map((ad: any, i: number) => (
                        <TikTokAdCard 
                            key={ad.id || `fallback-tiktok-${i}`} 
                            ad={ad} 
                            viewMode={viewMode} 
                            onClick={(data) => onOpenModal(data, 'tiktok')} 
                        />
                    ))}
                </div>
                {displayedAds.length === 0 && <div className="text-center py-20 text-gray-500">No results match your filters</div>}
            </div>
        </div>
    );
};

const SavedPage = ({ user, refreshUser, onOpenModal, onRemove }: { user: User, refreshUser: () => void, onOpenModal: (data: any, type: any) => void, onRemove: (id: string) => void }) => {
    if (user.savedAds.length === 0) return <div className="flex flex-col items-center justify-center py-32 text-center"><Bookmark className="w-8 h-8 text-brand-600 mb-6" /><h2 className="text-2xl font-bold text-gray-900">No saved ads yet</h2></div>;

    return (
        <div className="w-full">
            <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Saved Library</h1></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {user.savedAds.map((savedAd) => (
                    <div key={savedAd.id} className="relative group/saved">
                         {savedAd.type === 'meta' ? <MetaAdCard ad={savedAd.data as MetaAd} onClick={(data) => onOpenModal(data, 'meta')} /> : <TikTokAdCard ad={savedAd.data as TikTokAd} onClick={(data) => onOpenModal(data, 'tiktok')} />}
                         <button onClick={(e) => { e.stopPropagation(); onRemove(savedAd.id); }} className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur text-red-600 rounded-full shadow-sm opacity-0 group-hover/saved:opacity-100 transition-opacity hover:bg-red-50 border border-gray-200"><X className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Account = ({ user }: { user: User }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';

    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900">Settings</h1></div>
             <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setSearchParams({ tab: 'profile' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}>My Profile</button>
                <button onClick={() => setSearchParams({ tab: 'billing' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'billing' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}>Billing & Plans</button>
             </div>
             {activeTab === 'profile' && (
                 <div className="space-y-6">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                         <div className="flex items-start space-x-6">
                            <div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold border border-brand-100">{user.name.charAt(0)}</div>
                            <div className="flex-1 space-y-4 max-w-lg">
                                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" disabled value={user.name} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm" /></div>
                                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="text" disabled value={user.email} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm" /></div>
                            </div>
                         </div>
                    </div>
                 </div>
             )}
             {activeTab === 'billing' && (
                 <div className="space-y-8">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between p-4 bg-brand-50/50 rounded-lg border border-brand-100">
                             <div className="flex items-center">
                                <div className="p-2 bg-brand-100 rounded-md text-brand-600 mr-4"><Zap className="w-5 h-5" /></div>
                                <div><div className="text-sm font-semibold text-gray-900">Starter Plan</div><div className="text-sm text-gray-500">Active until Nov 1, 2023</div></div>
                             </div>
                             <button className="text-sm font-medium text-brand-600 hover:text-brand-700">Manage Subscription</button>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    )
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<{data: any, type: 'meta' | 'tiktok'} | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean, onUndo?: () => void }>({ message: '', visible: false });

  const refreshUser = async () => {
    try {
      const userData = await api.getUser();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setLoading(false);
    };
    init();
  }, []);

  const showToast = (message: string, onUndo?: () => void) => {
      setToast({ message, visible: true, onUndo });
      setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); }, 5000);
  };

  const handleSaveAd = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => {
      try { await api.saveAd(ad, type); await refreshUser(); setSelectedAd(null); showToast("Ad saved to library"); } catch (e) { console.error("Failed to save ad", e); }
  };

  const handleRemoveAd = async (id: string) => {
      const adToRemove = user?.savedAds.find(ad => ad.id === id);
      try { await api.removeSavedAd(id); await refreshUser(); showToast("Ad removed from library", async () => { if (adToRemove) { await api.saveAd(adToRemove.data, adToRemove.type); await refreshUser(); } }); } catch (e) { console.error("Failed to remove ad", e); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const savedAdEntry = selectedAd && user?.savedAds.find(ad => ad.data.id === selectedAd.data.id && ad.type === selectedAd.type);
  const isSaved = !!savedAdEntry;

  return (
    <ErrorBoundary> 
        <Router>
          <Layout user={user}>
            <Toast message={toast.message} visible={toast.visible} onUndo={toast.onUndo} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />
            <AdDetailModal isOpen={!!selectedAd} onClose={() => setSelectedAd(null)} data={selectedAd?.data} type={selectedAd?.type} onSave={handleSaveAd} isSaved={isSaved} onRemove={() => savedAdEntry && handleRemoveAd(savedAdEntry.id)} />
            <Routes>
              <Route path="/login" element={<Login onLoginSuccess={refreshUser} />} />
              <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
              
              {/* NEU: Route für den AdFeed */}
              <Route path="/feed" element={user ? <div className="w-full"><div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Live Ad Feed</h1></div><AdFeed /></div> : <Navigate to="/login" replace />} />

              <Route path="/search" element={user ? <SearchPage user={user} refreshUser={refreshUser} /> : <Navigate to="/login" replace />} />
              <Route path="/results/:id" element={user ? <ResultsPage user={user} refreshUser={refreshUser} onOpenModal={(data, type) => setSelectedAd({data, type})} /> : <Navigate to="/login" replace />} />
              <Route path="/saved" element={user ? <SavedPage user={user} refreshUser={refreshUser} onOpenModal={(data, type) => setSelectedAd({data, type})} onRemove={handleRemoveAd} /> : <Navigate to="/login" replace />} />
              <Route path="/account" element={user ? <Account user={user} /> : <Navigate to="/login" replace />} />
              <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
    </ErrorBoundary>
  );
};

export default App;