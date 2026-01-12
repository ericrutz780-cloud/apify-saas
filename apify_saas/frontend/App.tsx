import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useSearchParams, useParams, Link } from 'react-router-dom';
import Layout from './components/Layout';
import { api } from './services/api';
import { User, SearchResult, MetaAd, TikTokAd, UserPlan } from './types';
import MetaAdCard from './components/MetaAdCard';
import TikTokAdCard from './components/TikTokAdCard';
import AdDetailModal from './components/AdDetailModal';
import ExportModal from './components/ExportModal';
import DateRangePicker from './components/DateRangePicker';
import CountrySelector from './components/CountrySelector';
import ErrorBoundary from './components/ErrorBoundary';
import AdFeed from './AdFeed';
import { 
    Search, Loader2, AlertCircle, CheckCircle2, CreditCard, 
    ArrowRight, Zap, Filter, Facebook, Instagram, Video,
    ChevronDown, BarChart3, ListFilter, ArrowUpDown, Bookmark, Trash2, Undo2, X, LayoutGrid, Mail, Sparkles, Users as UsersIcon, Coins, Download
} from 'lucide-react';
// @ts-ignore
import { cleanAndTransformData } from './adAdapter';

// --- Pages Imports ---
import { DemoPage } from './DemoPage';
import { PricingPage } from './PricingPage';
import { Register } from './Register';
import { LandingPage } from './LandingPage';
import { EmailConfirmed } from './EmailConfirmed';

// --- Constants ---
const COUNTRIES = [
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' },
    { code: 'EE', name: 'Estonia' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GR', name: 'Greece' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IT', name: 'Italy' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MT', name: 'Malta' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NO', name: 'Norway' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'RO', name: 'Romania' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' }
];

const PLAN_LIMITS: Record<UserPlan, number> = {
    'starter': 100,
    'pro': 1000,
    'agency': 5000,
    'enterprise': 50000
};

const STATUS_MESSAGES = [
    "Spinning up scraper nodes...",
    "Connecting to Meta Ad Library...",
    "Authenticating secure session...",
    "Querying ad database...",
    "Scraping creative assets...",
    "Analyzing targeting demographics...",
    "Extracting spend estimates...",
    "Calculating viral efficiency...",
    "Finalizing report results..."
];

// --- Components ---

const SearchProgressBar = ({ progress, status }: { progress: number, status: string }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full sm:w-64 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider animate-pulse">{status}</span>
                <span className="text-sm font-bold text-gray-700">{progress}%</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

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

// --- SEARCH SECTION COMPONENT (Reusable) ---
const SearchInputSection = ({ 
    query, setQuery, 
    platform, setPlatform, 
    country, setCountry, 
    dateRange, setDateRange,
    loading, progress, statusIndex,
    handleSearch,
    canAfford, cost, remainingCredits,
    error, user
}: any) => {
    return (
        <div className="w-full mb-8">
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative transition-all focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 w-full">
                <div className="flex items-center px-4">
                    <Search className="w-6 h-6 text-gray-400 mr-3" />
                    <input 
                        type="text" 
                        className="w-full py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent" 
                        placeholder="e.g. 'Skincare', 'Nike'..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                        autoFocus 
                    />
                </div>
                <div className="h-px bg-gray-100 mx-4"></div>
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                        <div className="relative flex-1 md:flex-none">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                {(['meta', 'tiktok'] as const).map((p) => (
                                    <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${platform === p ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>{p}</button>
                                ))}
                            </div>
                        </div>
                        {(platform === 'meta') && <CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} />}
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                    </div>
                    <div className="text-right flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 min-h-[48px]">
                        {loading ? (
                            <SearchProgressBar progress={Math.floor(progress)} status={STATUS_MESSAGES[statusIndex]} />
                        ) : (
                            <>
                                <div className="text-sm">
                                    <span className="text-gray-500 mr-1">Cost:</span>
                                    <span className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>{cost} credits</span>
                                </div>
                                <button onClick={handleSearch} disabled={!query || !canAfford || loading} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Run Search <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-between items-start px-2">
                    {!canAfford ? (
                        <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Insufficient credits. You have {user.credits}.
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                            You will have <span className="font-medium text-gray-900 mx-1">{remainingCredits}</span> credits left.
                        </div>
                    )}
                    {error && <div className="text-red-600 text-sm">{error}</div>}
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
           <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the workspace.</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm shadow-xs" placeholder="Enter your email" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm shadow-xs" placeholder="••••••••" /></div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}</button>
        </form>
        <div className="text-center mt-4"><span className="text-sm text-gray-500">Don't have an account? </span><Link to="/register" className="text-sm font-medium text-brand-600 hover:text-brand-500">Sign up</Link></div>
      </div>
    </div>
  );
};

const Dashboard = ({ user }: { user: User }) => {
    const navigate = useNavigate();
    const searchCounts = user.searchHistory.reduce((acc, item) => {
        acc[item.query] = (acc[item.query] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topSearches = Object.entries(searchCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([query]) => query);

    const handleRerun = (item: any) => {
        navigate(`/search?q=${encodeURIComponent(item.query)}&platform=${item.platform || 'meta'}&country=${item.country || 'DE'}&autorun=true`);
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1><p className="text-gray-500 mt-1 text-sm">Overview of your activity and available credits.</p></div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/feed')} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"><LayoutGrid className="w-4 h-4 mr-2 text-gray-500" /> Live Feed</button>
                    <button onClick={() => navigate('/search')} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-all"><Search className="w-4 h-4 mr-2" /> New Search</button>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-gray-500">Credits Available</span><div className="p-2 bg-gray-50 rounded-full border border-gray-100"><CreditCard className="w-4 h-4 text-gray-600" /></div></div><div className="flex items-baseline space-x-2"><p className="text-3xl font-semibold text-gray-900">{user.credits}</p><span className="text-sm text-gray-500">credits</span></div><div className="mt-auto pt-4 flex items-center text-sm"><span onClick={() => navigate('/account?tab=billing&mode=topup')} className="text-brand-600 font-medium hover:text-brand-700 cursor-pointer flex items-center">Top up credits <ArrowRight className="w-4 h-4 ml-1" /></span></div></div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-gray-500">Total Searches</span><div className="p-2 bg-gray-50 rounded-full border border-gray-100"><BarChart3 className="w-4 h-4 text-gray-600" /></div></div><div className="flex items-baseline space-x-2 mb-3"><p className="text-3xl font-semibold text-gray-900">{user.searchHistory.length}</p></div><div className="mt-auto flex flex-wrap gap-2">{topSearches.length > 0 ? topSearches.map(term => (<span key={term} onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer border border-brand-100 transition-colors">{term}</span>)) : <span className="text-xs text-gray-400 italic">No top searches yet</span>}</div></div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-gray-500">Active Plan</span><div className="p-2 bg-gray-50 rounded-full border border-gray-100"><Zap className="w-4 h-4 text-gray-600" /></div></div><div className="flex items-baseline space-x-2"><p className="text-3xl font-semibold text-gray-900 capitalize">{user.plan}</p></div><div className="mt-auto pt-4 flex items-center text-sm text-gray-500 justify-between"><span>Renews monthly</span><Link to="/account?tab=billing" className="text-brand-600 hover:text-brand-700 font-medium">Change</Link></div></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">Recent Searches</h3></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th className="relative px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{user.searchHistory.length > 0 ? (user.searchHistory.slice(0, 5).map((search) => (<tr key={search.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{search.query}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{search.country ? (COUNTRIES.find(c => c.code === search.country)?.name || search.country) : 'Global'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(search.timestamp).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleRerun(search)} className="text-brand-600 hover:text-brand-900">Rerun</button></td></tr>))) : (<tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">No searches yet</td></tr>)}</tbody></table>
                </div>
            </div>
        </div>
    )
}

// Wrapper to handle shared state for Search and Results logic
const SearchLogicWrapper = ({ user, refreshUser, initialResultId }: { user: User, refreshUser: () => void, initialResultId?: string }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Search State
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
    const [country, setCountry] = useState('DE');
    const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>(() => ({ from: undefined, to: undefined }));
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const [error, setError] = useState('');
    const hasAutoRun = useRef(false);

    // Results State
    const [result, setResult] = useState<SearchResult | null>(null);
    const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
    const [formatFilter, setFormatFilter] = useState<'all' | 'video' | 'image'>('all');
    const [sortBy, setSortBy] = useState<'efficiency_score' | 'reach' | 'newest'>('efficiency_score');
    const [viewMode, setViewMode] = useState<'condensed' | 'details'>(() => (localStorage.getItem('view_mode') as 'condensed' | 'details') || 'details');
    
    // Modal & Export State
    const [selectedAdsGroup, setSelectedAdsGroup] = useState<{data: any[], type: 'meta' | 'tiktok'} | null>(null);
    const [exportData, setExportData] = useState<SearchResult | null>(null);
    const [toast, setToast] = useState<{ message: string, visible: boolean, onUndo?: () => void }>({ message: '', visible: false });

    // Constants
    const limit = PLAN_LIMITS[user.plan] || 100;
    const cost = limit;
    const canAfford = user.credits >= cost;
    const remainingCredits = user.credits - cost;

    // --- Search Handler ---
    const handleSearch = useCallback(async () => {
        if (!query || !canAfford || loading) return;
        setLoading(true); setProgress(0); setStatusIndex(0); setError('');

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const next = Math.min(99, prev + (100 / (7000 / 100)));
                if (next > (100 / STATUS_MESSAGES.length) * (statusIndex + 1)) {
                    setStatusIndex(idx => Math.min(STATUS_MESSAGES.length - 1, idx + 1));
                }
                return next;
            });
        }, 100);

        try {
            const result = await api.runSearch({ 
                query, 
                platform, 
                country, 
                limit: cost, 
                startDateMin: dateRange.from?.toISOString().split('T')[0], 
                startDateMax: dateRange.to?.toISOString().split('T')[0] 
            });
            clearInterval(progressTimer); setProgress(100); setStatusIndex(STATUS_MESSAGES.length - 1);
            
            setTimeout(async () => {
                await refreshUser();
                localStorage.setItem(`search_${result.id}`, JSON.stringify(result));
                setLoading(false);
                navigate(`/results/${result.id}?q=${encodeURIComponent(query)}&platform=${platform}&country=${country}`);
            }, 500);
        } catch (err: any) { 
            clearInterval(progressTimer); setLoading(false); setError(err.message || 'Search failed.'); 
        }
    }, [query, platform, country, dateRange, user.credits, cost, canAfford, loading, refreshUser, navigate, statusIndex]);

    // Initialize state
    useEffect(() => {
        const q = searchParams.get('q');
        const p = searchParams.get('platform');
        const c = searchParams.get('country');
        const autorun = searchParams.get('autorun');
        
        if (q) setQuery(q);
        if (p && (p === 'meta' || p === 'tiktok')) setPlatform(p as 'meta' | 'tiktok');
        if (c) setCountry(c);

        if (initialResultId) {
            const stored = localStorage.getItem(`search_${initialResultId}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                setResult(parsed);
                if (!q) setQuery(parsed.params.query);
                if (!p && parsed.params.platform) setPlatform(parsed.params.platform);
                if (!c && parsed.params.country) setCountry(parsed.params.country);
                if (parsed.params.platform === 'tiktok') setActiveTab('tiktok'); else setActiveTab('facebook');
            }
        }

        if (autorun === 'true' && q && !hasAutoRun.current && !loading && !initialResultId) {
            hasAutoRun.current = true;
            handleSearch();
        }
    }, [searchParams, initialResultId, handleSearch, loading]);


    // Results Processing Logic - DATA HANDLING FIX
    const transformedMetaAds = useMemo(() => {
        if (!result) return [];
        
        // 1. Get raw ads from either metaAds (structured) or data (flat/backend response)
        // @ts-ignore
        let rawAds = result.metaAds || result.data || [];
        
        // Ensure it's an array
        if (!Array.isArray(rawAds)) return [];

        // 2. If data is already transformed (has demographics), use it directly
        // @ts-ignore
        if (rawAds.length > 0 && rawAds[0].demographics) return rawAds; 
        
        // 3. Otherwise run through adapter, wrapping in {data: ...} as expected by adAdapter
        const adsToTransform = rawAds.map((ad: any) => ({ data: ad }));
        return cleanAndTransformData(adsToTransform);
    }, [result]);

    const canExport = user.plan === 'pro' || user.plan === 'agency';

    const groupAdsByText = (ads: MetaAd[]) => {
        const groups: { [key: string]: MetaAd[] } = {};
        ads.forEach(ad => { const key = ad.snapshot.body.text ? ad.snapshot.body.text.trim() : ad.id; if (!groups[key]) groups[key] = []; groups[key].push(ad); });
        return Object.values(groups).map(group => { group.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()); return { representative: group[0], group: group, count: group.length }; });
    };

    const getFilteredAndSortedAds = () => {
        if (!result) return [];
        let ads: any[] = [];
        let isMetaTab = false;
        
        // @ts-ignore
        const tiktokAds = result.tikTokAds || [];

        if (activeTab === 'facebook') { ads = [...transformedMetaAds.filter((ad: MetaAd) => ad.publisher_platform.includes('facebook'))]; isMetaTab = true; }
        else if (activeTab === 'instagram') { ads = [...transformedMetaAds.filter((ad: MetaAd) => ad.publisher_platform.includes('instagram'))]; isMetaTab = true; }
        else { ads = [...tiktokAds]; isMetaTab = false; }

        if (isMetaTab) {
            if (formatFilter === 'video') ads = ads.filter(ad => ad.snapshot.videos && ad.snapshot.videos.length > 0);
            else if (formatFilter === 'image') ads = ads.filter(ad => (!ad.snapshot.videos || ad.snapshot.videos.length === 0));
            const grouped = groupAdsByText(ads as MetaAd[]);
            grouped.sort((a, b) => {
                const adA = a.representative, adB = b.representative;
                if (sortBy === 'efficiency_score') return (adB.efficiency_score || 0) - (adA.efficiency_score || 0);
                if (sortBy === 'reach') return (adB.targeting?.reach_estimate || 0) - (adA.targeting?.reach_estimate || 0);
                return new Date(adB.start_date).getTime() - new Date(adA.start_date).getTime();
            });
            return grouped;
        } else {
            if (formatFilter === 'image') return [];
            ads.sort((a, b) => {
                if (sortBy === 'efficiency_score') return b.diggCount - a.diggCount;
                if (sortBy === 'reach') return b.playCount - a.playCount;
                return new Date(b.createTimeISO).getTime() - new Date(a.createTimeISO).getTime();
            });
            return ads;
        }
    };

    const displayedItems = getFilteredAndSortedAds();
    const isMetaActive = activeTab === 'facebook' || activeTab === 'instagram';
    
    // --- Shared Handlers ---
    const showToast = (message: string, onUndo?: () => void) => { setToast({ message, visible: true, onUndo }); setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000); };
    const handleToggleSave = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => {
        if (!user) return;
        const existing = user.savedAds.find(s => s.data.id === ad.id && s.type === type);
        if (existing) await handleRemoveAd(existing.id); else await handleSaveAd(ad, type);
    };
    const handleSaveAd = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => { try { await api.saveAd(ad, type); await refreshUser(); showToast("Ad saved to library"); } catch (e) { console.error("Failed to save ad", e); } };
    const handleRemoveAd = async (id: string) => { const adToRemove = user?.savedAds.find(ad => ad.id === id); try { await api.removeSavedAd(id); await refreshUser(); showToast("Ad removed from library", async () => { if (adToRemove) { await api.saveAd(adToRemove.data, adToRemove.type); await refreshUser(); } }); } catch (e) { console.error("Failed to remove ad", e); } };
    const handleExportFile = (format: 'csv' | 'json') => { if (!exportData) return; const fileName = `stella_ads_${new Date().toISOString()}.${format}`; console.log(`Downloading ${fileName}...`); showToast(`Exported results as ${format.toUpperCase()}`); setExportData(null); };

    const primaryAd = selectedAdsGroup?.data[0];
    const savedAdEntry = primaryAd && user?.savedAds.find(ad => ad.data.id === primaryAd.id && ad.type === selectedAdsGroup.type);
    const isSaved = !!savedAdEntry;

    return (
        <div className="w-full">
            <Toast message={toast.message} visible={toast.visible} onUndo={toast.onUndo} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />
            <AdDetailModal isOpen={!!selectedAdsGroup} onClose={() => setSelectedAdsGroup(null)} group={selectedAdsGroup?.data || []} type={selectedAdsGroup?.type} onSave={handleSaveAd} isSaved={isSaved} onRemove={() => savedAdEntry && handleRemoveAd(savedAdEntry.id)} />
            <ExportModal isOpen={!!exportData} onClose={() => setExportData(null)} onExport={handleExportFile} resultCount={exportData ? (exportData.metaAds?.length || 0) + (exportData.tikTokAds?.length || 0) : 0} />

            <div className="w-full">
                <div className="text-left mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ad Intelligence Search</h1><p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta and TikTok.</p></div>
                
                {/* Search Input Section is ALWAYS rendered here */}
                <SearchInputSection 
                    query={query} setQuery={setQuery} 
                    platform={platform} setPlatform={setPlatform} 
                    country={country} setCountry={setCountry}
                    dateRange={dateRange} setDateRange={setDateRange}
                    loading={loading} progress={progress} statusIndex={statusIndex}
                    handleSearch={handleSearch}
                    canAfford={canAfford} cost={cost} remainingCredits={remainingCredits}
                    error={error} user={user}
                />
            </div>

            {/* RESULTS SECTION - Rendered conditionally below search input */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 space-y-6">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
                            <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">Results for <span className="text-brand-600">"{result.params.query}"</span></h2>
                            <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
                            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start">
                                {result.params.platform !== 'tiktok' && (<><button onClick={() => setActiveTab('facebook')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'facebook' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Facebook className="w-3.5 h-3.5 mr-2 text-[#1877F2]" /> Facebook <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{transformedMetaAds.filter(a => a.publisher_platform.includes('facebook')).length}</span></button><button onClick={() => setActiveTab('instagram')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'instagram' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Instagram className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> Instagram <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{transformedMetaAds.filter(a => a.publisher_platform.includes('instagram')).length}</span></button></>)}
                                {/* @ts-ignore */}
                                {result.params.platform !== 'meta' && (<button onClick={() => setActiveTab('tiktok')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'tiktok' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Video className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> TikTok <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{result.tikTokAds?.length || 0}</span></button>)}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                            <div className="flex items-center gap-3 w-full sm:w-auto"><div className="flex items-center text-gray-500 text-sm font-medium whitespace-nowrap"><ListFilter className="w-4 h-4 mr-2" /> Filters:</div><div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">{(['all', 'video', 'image'] as const).map((f) => (<button key={f} onClick={() => setFormatFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${formatFilter === f ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-gray-600 hover:bg-gray-50'}`}>{f === 'all' ? 'All' : f}</button>))}</div></div>
                            <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Sort:</span>
                                <div className="relative group w-full sm:w-auto"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ArrowUpDown className="h-3.5 w-3.5 text-gray-400" /></div><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full sm:w-auto appearance-none pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-gray-50"><option value="efficiency_score">Viral Score</option><option value="reach">Reach</option><option value="newest">Newest</option></select><div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none"><ChevronDown className="h-4 w-4 text-gray-400" /></div></div>
                                {canExport && (
                                    <button
                                        onClick={() => setExportData(result)}
                                        className="flex items-center gap-2 px-4 h-[35px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-normal transition-all shadow-sm group"
                                        title="Export results to CSV/JSON"
                                    >
                                        <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                                        Export
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        {isMetaActive && displayedItems.map((item: any) => {
                            const ad = item.representative;
                            const savedEntry = user.savedAds.find(s => s.data.id === ad.id && s.type === 'meta');
                            return <MetaAdCard key={ad.id} ad={ad} versionCount={item.count} viewMode={viewMode} onClick={(data) => setSelectedAdsGroup({data: item.group, type: 'meta'})} platformContext={activeTab === 'facebook' || activeTab === 'instagram' ? activeTab : undefined} onToggleSave={(ad) => handleToggleSave(ad, 'meta')} isSaved={!!savedEntry} />;
                        })}
                        {activeTab === 'tiktok' && displayedItems.map((ad: any) => (
                            <TikTokAdCard key={ad.id} ad={ad} viewMode={viewMode} onClick={(data) => setSelectedAdsGroup({data: [data], type: 'tiktok'})} />
                        ))}
                    </div>
                    {displayedItems.length === 0 && !loading && <div className="text-center py-20 text-gray-500">No results match your filters</div>}
                </div>
            )}
        </div>
    );
};

const SavedPage = ({ user, refreshUser, onOpenModal, onRemove }: { user: User, refreshUser: () => void, onOpenModal: (data: any, type: any) => void, onRemove: (id: string) => void }) => {
    if (user.savedAds.length === 0) return <div className="flex flex-col items-center justify-center py-32 text-center"><Bookmark className="w-8 h-8 text-brand-600 mb-6" /><h2 className="text-2xl font-bold text-gray-900">No saved ads yet</h2></div>;
    return (
        <div className="w-full">
            <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Saved Library</h1></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {user.savedAds.map((savedAd) => (<React.Fragment key={savedAd.id}>{savedAd.type === 'meta' ? <MetaAdCard ad={savedAd.data as MetaAd} onClick={(data) => onOpenModal([data], 'meta')} onToggleSave={() => onRemove(savedAd.id)} actionIcon={<Trash2 className="w-4 h-4" />} /> : <TikTokAdCard ad={savedAd.data as TikTokAd} onClick={(data) => onOpenModal([data], 'tiktok')} onAction={() => onRemove(savedAd.id)} actionIcon={<Trash2 className="w-4 h-4" />} />}</React.Fragment>))}
            </div>
        </div>
    );
};

const Account = ({ user, refreshUser }: { user: User, refreshUser: () => Promise<void> }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'topup'>(searchParams.get('mode') === 'topup' ? 'topup' : 'monthly');
    useEffect(() => { if (searchParams.get('mode') === 'topup') setBillingCycle('topup'); }, [searchParams]);
    const activeTab = searchParams.get('tab') || 'profile';

    // Pricing Plans Data
    const pricingPlans = [
        { name: 'Starter', id: 'starter', subheader: 'Best for: Occasional Research', monthlyPrice: '€49', yearlyPrice: '€39', credits: '1,500 Credits', scans: '100 Data Points per Search', seats: '1 User Seat', topup: '€25 / 1k Credits', export: '-' },
        { name: 'Pro', id: 'pro', subheader: 'Best for: Heavy Users & Scaling', monthlyPrice: '€129', yearlyPrice: '€99', credits: '10,000 Credits', scans: '1,000 Data Points per Search', seats: '2 User Seats', topup: '€10 / 1k Credits', export: 'CSV/JSON Export', popular: true },
        { name: 'Enterprise', id: 'enterprise', subheader: 'Best for: Agencies & Large Teams', monthlyPrice: 'Contact Us', yearlyPrice: 'Contact Us', credits: '50,000 Credits', scans: 'Custom Analysis Limits', seats: '5 User Seats', topup: '€5 / 1k Credits', export: 'API & White Label' },
    ];
    const creditTopupPlans = [
        { name: 'Starter', id: 'starter_topup', subheader: 'Standard Top-up Rate', price: '25 €', unit: '/ 1k Credits', features: ['Instant availability', 'Credits never expire', 'One-time purchase'], buttonText: 'Buy Credits' },
        { name: 'Pro', id: 'pro_topup', subheader: 'Best Value Top-up', price: '10 €', unit: '/ 1k Credits', features: ['Volume savings', 'Credits never expire', 'Priority scraping nodes'], popular: true, buttonText: 'Buy Credits' },
        { name: 'Enterprise', id: 'enterprise_topup', subheader: 'Wholesale Top-up', price: '5 €', unit: '/ 1k Credits', features: ['Maximum cost efficiency', 'Custom credit pools', 'Dedicated support'], buttonText: 'Buy Credits' }
    ];

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: user.name, email: user.email });
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => { setFormData({ name: user.name, email: user.email }); }, [user]);
    const handleSave = async () => { setIsSaving(true); try { await api.updateUser(formData); await refreshUser(); setIsEditing(false); } catch (error) { console.error("Failed to update profile", error); } finally { setIsSaving(false); } };

    return (
        <div className="w-full">
             <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900">Settings</h1><p className="text-gray-500 mt-1">Manage your account and subscription.</p></div>
             <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button onClick={() => setSearchParams({ tab: 'profile' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>My Profile</button>
                <button onClick={() => setSearchParams({ tab: 'billing' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Billing & Plans</button>
                <button onClick={() => setSearchParams({ tab: 'privacy' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'privacy' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Legal & Privacy</button>
             </div>
             
             {activeTab === 'profile' && (<div className="space-y-6 animate-in fade-in duration-300"><div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden"><div className="px-6 py-4 border-b border-gray-200"><h3 className="text-base font-medium text-gray-900">Personal Information</h3></div><div className="p-6"><div className="flex items-start space-x-6"><div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold border border-brand-100">{formData.name.charAt(0)}</div><div className="flex-1 space-y-4 max-w-lg"><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" disabled={!isEditing} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" disabled={!isEditing} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} /></div></div></div></div><div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">{isEditing ? <><button onClick={() => setIsEditing(false)} className="text-sm font-medium text-gray-700 mr-3 border border-gray-300 px-3 py-1.5 rounded-md">Cancel</button><button onClick={handleSave} className="text-sm font-medium text-white bg-brand-600 px-3 py-1.5 rounded-md">{isSaving ? 'Saving...' : 'Save Changes'}</button></> : <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md">Edit Profile</button>}</div></div>
             
             {/* Contact Us Section */}
             <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="text-base font-medium text-gray-900">Contact Us</h3></div>
                <div className="p-6">
                    <div className="flex items-center gap-4"><div className="p-3 bg-brand-50 rounded-lg text-brand-600"><Mail className="w-5 h-5" /></div><div><p className="text-sm font-medium text-gray-700">Email Support</p><a href="mailto:info@stellaads.com" className="text-sm text-brand-600 hover:text-brand-700 font-semibold">info@stellaads.com</a></div></div>
                </div>
             </div>
             </div>)}

             {activeTab === 'billing' && (
                 <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col items-center">
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 mb-8 overflow-x-auto max-w-full">
                            <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Monthly</button>
                            <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Yearly <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase">Save 20%</span></button>
                            <button onClick={() => setBillingCycle('topup')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${billingCycle === 'topup' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'}`}><Coins className="w-3.5 h-3.5" /> Top up credits</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            {(billingCycle === 'topup' ? creditTopupPlans : pricingPlans).map((plan: any) => (
                                <div key={plan.id} className={`bg-white rounded-2xl shadow-sm flex flex-col border ${user.plan === plan.id && billingCycle !== 'topup' ? 'border-brand-600 ring-4 ring-brand-500/10' : 'border-gray-200'} relative`}>
                                    <div className="p-6 border-b border-gray-100"><h3 className="text-xl font-bold text-gray-900">{plan.name}</h3><p className="text-xs text-gray-500 mt-1 h-4">{plan.subheader}</p><div className="mt-6 flex flex-col">{plan.id === 'enterprise' && billingCycle !== 'topup' ? <div className="text-2xl font-bold text-gray-900 h-10 flex items-center">Contact Us</div> : <div className="flex items-baseline"><span className="text-4xl font-bold text-gray-900 tracking-tight">{billingCycle === 'topup' ? plan.price : (billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}</span><span className="ml-1 text-sm text-gray-500 font-medium">{billingCycle === 'topup' ? plan.unit : '/mo'}</span></div>}{billingCycle === 'yearly' && plan.id !== 'enterprise' && <div className="text-xs text-green-600 font-medium mt-1">Billed annually</div>}</div></div>
                                    <div className="p-6 bg-gray-25/50 flex-1"><ul className="space-y-4">{billingCycle === 'topup' ? plan.features.map((feature: string) => (<li key={feature} className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-brand-600 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">{feature}</span></li>)) : <><li className="flex items-center text-sm"><Sparkles className="w-4 h-4 text-brand-600 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">{plan.credits}</span></li><li className="flex items-center text-sm"><Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-600">{plan.scans}</span></li><li className="flex items-center text-sm"><UsersIcon className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-600">{plan.seats}</span></li></>}</ul></div>
                                    <div className="p-6 bg-white rounded-b-2xl"><button className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md ${user.plan === plan.id && billingCycle !== 'topup' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>{billingCycle === 'topup' ? plan.buttonText : (user.plan === plan.id ? 'Your Plan' : 'Buy Now')}</button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}
             
             {activeTab === 'privacy' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden p-8 text-gray-800">
                        <h2 className="text-2xl font-bold mb-6">Legal Notice</h2>
                        <div className="space-y-4 mb-10 text-sm">
                            <div>
                                <h3 className="font-semibold text-gray-900">Information pursuant to Sect. 5 German Telemedia Act (TMG)</h3>
                                <p className="text-gray-600 mt-1">StellaAds GmbH<br />Musterstraße 123<br />10115 Berlin</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Represented by</h3>
                                <p className="text-gray-600 mt-1">Max Mustermann</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Contact</h3>
                                <p className="text-gray-600 mt-1">Phone: +49 (0) 123 44 55 66<br />Email: info@stellaads.com</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Register Entry</h3>
                                <p className="text-gray-600 mt-1">Entry in the commercial register.<br />Register Court: Amtsgericht Berlin-Charlottenburg<br />Register Number: HRB 123456</p>
                            </div>
                        </div>
            
                        <hr className="border-gray-200 my-8" />
            
                        <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
                        <div className="space-y-6 text-sm">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">1. Privacy at a glance</h3>
                                <h4 className="font-medium text-gray-800 mt-3">General information</h4>
                                <p className="text-gray-600 mt-1 leading-relaxed">
                                    The following notes provide a simple overview of what happens to your personal data when you visit this website. Personal data is any data with which you can be personally identified.
                                </p>
                                <h4 className="font-medium text-gray-800 mt-3">Data collection on this website</h4>
                                <p className="text-gray-600 mt-1 leading-relaxed">
                                    <strong>Who is responsible for the data collection on this website?</strong><br/>
                                    The data processing on this website is carried out by the website operator. You can find their contact details in the imprint of this website.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Hosting and Content Delivery Networks (CDN)</h3>
                                <p className="text-gray-600 mb-2 leading-relaxed">
                                    We host the content of our website with the following providers:
                                </p>
                                <h4 className="font-medium text-gray-800">External Hosting</h4>
                                <p className="text-gray-600 mt-1 leading-relaxed">
                                    This website is hosted externally. The personal data collected on this website is stored on the servers of the hoster(s). This may include IP addresses, contact requests, meta and communication data, contract data, contact details, names, website accesses and other data generated via a website.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-2">3. General Notes and Mandatory Information</h3>
                                <h4 className="font-medium text-gray-800">Data Protection</h4>
                                <p className="text-gray-600 mt-1 leading-relaxed">
                                    The operators of these pages take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations and this privacy policy.
                                </p>
                            </div>
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
  
  const refreshUser = async () => {
    try {
      const userData = await api.getUser();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
        <Router>
            <Routes>
                {/* 1. Public Routes */}
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                
                {/* 2. Main App Routes */}
                <Route path="*" element={
                    <Layout user={user}>
                        <Routes>
                            <Route path="/login" element={<Login onLoginSuccess={refreshUser} />} />
                            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
                            <Route path="/feed" element={user ? <div className="w-full"><div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Live Ad Feed</h1></div><AdFeed /></div> : <Navigate to="/login" replace />} />
                            {/* FIX: SearchPageLogicWrapper combines search & results view logic */}
                            <Route path="/search" element={user ? <SearchLogicWrapper user={user} refreshUser={refreshUser} /> : <Navigate to="/login" replace />} />
                            <Route 
                                path="/results/:id" 
                                element={user ? <SearchLogicWrapper user={user} refreshUser={refreshUser} initialResultId={window.location.hash.split('/').pop()} /> : <Navigate to="/login" replace />} 
                            />
                            <Route 
                                path="/saved" 
                                element={user ? <SavedPage user={user} refreshUser={refreshUser} onOpenModal={() => {}} onRemove={() => {}} /> : <Navigate to="/login" replace />} 
                            />
                            <Route path="/account" element={user ? <Account user={user} refreshUser={refreshUser} /> : <Navigate to="/login" replace />} />
                            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
                        </Routes>
                    </Layout>
                } />
            </Routes>
        </Router>
    </ErrorBoundary>
  );
};

export default App;