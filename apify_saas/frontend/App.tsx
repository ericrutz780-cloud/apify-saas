import React, { useEffect, useState, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useSearchParams, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import { api } from './services/api';
import { User, SearchParams, SearchResult, MetaAd, TikTokAd, SavedAd, UserPlan, SearchHistoryItem } from './types';
import MetaAdCard from './components/MetaAdCard';
import TikTokAdCard from './components/TikTokAdCard';
import AdDetailModal from './components/AdDetailModal';
import DateRangePicker from './components/DateRangePicker';
import CountrySelector from './components/CountrySelector';
import ErrorBoundary from './components/ErrorBoundary';
import AdFeed from './AdFeed';
import { 
    Search, Loader2, AlertCircle, CheckCircle2, CreditCard, Lock, 
    ArrowRight, TrendingUp, Zap, Clock, Filter, Facebook, Instagram, Video,
    ChevronDown, SlidersHorizontal, BarChart3, ListFilter, ArrowUpDown, Globe, Bookmark, Trash2, Undo2, X, LayoutGrid, Mail, Sparkles
} from 'lucide-react';
// @ts-ignore
import { cleanAndTransformData } from './adAdapter';
import { DemoPage } from './DemoPage';

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
    'pro': 250,
    'agency': 500
};

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
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" placeholder="Enter your email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}
          </button>
        </form>
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

    // --- FIX START: Caching Logik ---
    const handleRerun = (item: SearchHistoryItem) => {
        // Zuerst im Cache schauen
        const cachedResult = localStorage.getItem(`search_${item.id}`);

        if (cachedResult) {
            console.log("♻️ Lade aus Cache:", item.id);
            navigate(`/results/${item.id}`);
        } else {
            // Fallback: Neue Suche
            const countryParam = item.country ? `&country=${item.country}` : '';
            navigate(`/search?q=${encodeURIComponent(item.query)}&platform=${item.platform}&limit=${item.limit}${countryParam}`);
        }
    };
    // --- FIX END ---

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
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-gray-500">Credits Available</span><div className="p-2 bg-gray-50 rounded-full border border-gray-100"><CreditCard className="w-4 h-4 text-gray-600" /></div></div><div className="flex items-baseline space-x-2"><p className="text-3xl font-semibold text-gray-900">{user.credits}</p><span className="text-sm text-gray-500">credits</span></div><div className="mt-auto pt-4 flex items-center text-sm"><span onClick={() => navigate('/account?tab=billing')} className="text-brand-600 font-medium hover:text-brand-700 cursor-pointer flex items-center">Top up credits <ArrowRight className="w-4 h-4 ml-1" /></span></div></div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-gray-500">Total Searches</span><div className="p-2 bg-gray-50 rounded-full border border-gray-100"><BarChart3 className="w-4 h-4 text-gray-600" /></div></div><div className="flex items-baseline space-x-2 mb-3"><p className="text-3xl font-semibold text-gray-900">{user.searchHistory.length}</p></div><div className="mt-auto flex flex-wrap gap-2">{topSearches.length > 0 ? topSearches.map(term => (<span key={term} onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer border border-brand-100 transition-colors">{term}</span>)) : <span className="text-xs text-gray-400 italic">No top searches yet</span>}</div></div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col"><div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-gray-500">Active Plan</span><div className="p-2 bg-gray-50 rounded-full border border-gray-100"><Zap className="w-4 h-4 text-gray-600" /></div></div><div className="flex items-baseline space-x-2"><p className="text-3xl font-semibold text-gray-900 capitalize">{user.plan}</p></div><div className="mt-auto pt-4 flex items-center text-sm text-gray-500">Renews on Nov 1, 2023</div></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">Recent Searches</h3></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th className="relative px-6 py-3"><span className="sr-only">Actions</span></th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{user.searchHistory.length > 0 ? (user.searchHistory.slice(0, 5).map((search) => (<tr key={search.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{search.query}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{search.platform}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(search.timestamp).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleRerun(search)} className="text-brand-600 hover:text-brand-900">Rerun</button></td></tr>))) : (<tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">No searches yet</td></tr>)}</tbody></table>
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
    const [country, setCountry] = useState('DE');
    const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = searchParams.get('q');
        const p = searchParams.get('platform');
        if (q) setQuery(q);
        if (p && (p === 'meta' || p === 'tiktok')) setPlatform(p as 'meta' | 'tiktok');
    }, [searchParams]);

    // FIX: Variable 'cost' muss VOR 'canAfford' definiert werden!
    const limit = PLAN_LIMITS[user.plan] || 100;
    const cost = limit;
    const canAfford = user.credits >= cost;

    const handleSearch = async () => {
        if (!query || !canAfford) return;
        setLoading(true); setError('');
        try {
            const result = await api.runSearch({ query, platform, country, limit: cost, startDateMin: dateRange.from?.toISOString().split('T')[0], startDateMax: dateRange.to?.toISOString().split('T')[0] });
            await refreshUser();
            localStorage.setItem(`search_${result.id}`, JSON.stringify(result));
            navigate(`/results/${result.id}`);
        } catch (err: any) { setError(err.message || 'Search failed.'); } finally { setLoading(false); }
    };

    return (
        <div className="w-full">
            <div className="text-left mb-8"><h1 className="text-2xl font-semibold text-gray-900">Ad Intelligence Search</h1><p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta and TikTok.</p></div>
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative transition-all focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 w-full">
                <div className="flex items-center px-4"><Search className="w-6 h-6 text-gray-400 mr-3" /><input type="text" className="w-full py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent" placeholder="e.g. 'Skincare', 'Nike'..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus /></div>
                <div className="h-px bg-gray-100 mx-4"></div>
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                        <div className="relative flex-1 md:flex-none"><div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">{(['meta', 'tiktok'] as const).map((p) => (<button key={p} onClick={() => setPlatform(p)} className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${platform === p ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>{p}</button>))}</div></div>
                        {(platform === 'meta') && <CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} />}
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                    </div>
                    <div className="text-right flex items-center gap-3"><div className="text-sm"><span className="text-gray-500 mr-1">Cost:</span><span className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>{cost} credits</span></div><button onClick={handleSearch} disabled={!query || !canAfford || loading} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm flex items-center">{loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Run Search <ArrowRight className="w-4 h-4 ml-2" /></>}</button></div>
                </div>
            </div>
            {!canAfford && <div className="mt-4 flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-100"><AlertCircle className="w-4 h-4 mr-2" /> Insufficient credits.</div>}
            {error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
        </div>
    );
};

const ResultsPage = ({ user, refreshUser, onOpenModal, onToggleSave }: { user: User, refreshUser: () => void, onOpenModal: (data: any, type: any) => void, onToggleSave: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [result, setResult] = useState<SearchResult | null>(null);
    const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'tiktok'>('meta');
    const [country, setCountry] = useState('DE');
    const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ from: undefined, to: undefined });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formatFilter, setFormatFilter] = useState<'all' | 'video' | 'image'>('all');
    const [sortBy, setSortBy] = useState<'efficiency_score' | 'reach' | 'newest'>('efficiency_score');
    const [viewMode, setViewMode] = useState<'condensed' | 'details'>(() => (localStorage.getItem('view_mode') as 'condensed' | 'details') || 'details');

    useEffect(() => {
        const stored = localStorage.getItem(`search_${id}`);
        if (stored) {
            const parsed = JSON.parse(stored);
            setResult(parsed);
            setQuery(parsed.params.query);
            if (parsed.params.platform !== 'both') setPlatform(parsed.params.platform);
            if (parsed.params.country) setCountry(parsed.params.country);
            if (parsed.params.platform === 'tiktok') setActiveTab('tiktok'); else setActiveTab('facebook');
        }
    }, [id]);

    const cost = PLAN_LIMITS[user.plan] || 100;
    const canAfford = user.credits >= cost;

    const handleSearch = async () => {
        if (!query || !canAfford) return;
        setLoading(true); setError('');
        try {
            const result = await api.runSearch({ query, platform, country, limit: cost, startDateMin: dateRange.from?.toISOString().split('T')[0], startDateMax: dateRange.to?.toISOString().split('T')[0] });
            await refreshUser();
            localStorage.setItem(`search_${result.id}`, JSON.stringify(result));
            navigate(`/results/${result.id}`);
        } catch (err: any) { setError(err.message || 'Search failed.'); } finally { setLoading(false); }
    };

    const transformedMetaAds = useMemo(() => {
        if (!result || !result.metaAds) return [];
        const ads = result.metaAds;
        
        // --- FIX: Check for 'demographics' to know if it's already clean ---
        // 'demographics' only exists on clean data. 'aaa_info' exists on raw data.
        // We force clean if 'demographics' is missing, even if 'page_name' exists.
        // @ts-ignore
        if (ads.length > 0 && ads[0].demographics) return ads; 
        
        const adsToTransform = ads.map(ad => ({ data: ad }));
        return cleanAndTransformData(adsToTransform);
    }, [result]);

    if (!result) return <div className="flex justify-center pt-24"><Loader2 className="animate-spin w-8 h-8 text-brand-600" /></div>;

    const showMeta = result.params.platform !== 'tiktok';
    const showTikTok = result.params.platform !== 'meta';
    const facebookAds = transformedMetaAds.filter((ad: MetaAd) => ad.publisher_platform.includes('facebook'));
    const instagramAds = transformedMetaAds.filter((ad: MetaAd) => ad.publisher_platform.includes('instagram'));
    const isMetaActive = activeTab === 'facebook' || activeTab === 'instagram';

    const groupAdsByText = (ads: MetaAd[]) => {
        const groups: { [key: string]: MetaAd[] } = {};
        ads.forEach(ad => {
            const key = ad.snapshot.body.text ? ad.snapshot.body.text.trim() : ad.id;
            if (!groups[key]) groups[key] = [];
            groups[key].push(ad);
        });
        return Object.values(groups).map(group => {
            group.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
            return { representative: group[0], group: group, count: group.length };
        });
    };

    const getFilteredAndSortedAds = () => {
        let ads: any[] = [];
        let isMetaTab = false;

        if (activeTab === 'facebook') { ads = [...facebookAds]; isMetaTab = true; }
        else if (activeTab === 'instagram') { ads = [...instagramAds]; isMetaTab = true; }
        else { ads = [...result.tikTokAds]; isMetaTab = false; }

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

    return (
        <div className="w-full">
            <div className="w-full">
                 <div className="text-left mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ad Intelligence Search</h1><p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta and TikTok libraries.</p></div>
                 <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative transition-all focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 w-full">
                    <div className="flex items-center px-4"><Search className="w-6 h-6 text-gray-400 mr-3" /><input type="text" className="w-full py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
                    <div className="h-px bg-gray-100 mx-4"></div>
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                         <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                            <div className="relative flex-1 md:flex-none"><div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">{(['meta', 'tiktok'] as const).map((p) => (<button key={p} onClick={() => setPlatform(p)} className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${platform === p ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>{p}</button>))}</div></div>
                            {(platform === 'meta') && <CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} />}
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                         </div>
                         <div className="text-right flex items-center gap-3"><button onClick={handleSearch} disabled={!query || !canAfford || loading} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm flex items-center">{loading ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</button></div>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 space-y-6">
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
                        <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">Results for <span className="text-brand-600">"{result.params.query}"</span></h2>
                        <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start">
                            {showMeta && (<><button onClick={() => setActiveTab('facebook')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'facebook' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Facebook className="w-3.5 h-3.5 mr-2 text-[#1877F2]" /> Facebook <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{facebookAds.length}</span></button><button onClick={() => setActiveTab('instagram')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'instagram' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Instagram className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> Instagram <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{instagramAds.length}</span></button></>)}
                            {showTikTok && (<button onClick={() => setActiveTab('tiktok')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'tiktok' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Video className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> TikTok <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{result.tikTokAds.length}</span></button>)}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                        <div className="flex items-center gap-3 w-full sm:w-auto"><div className="flex items-center text-gray-500 text-sm font-medium whitespace-nowrap"><ListFilter className="w-4 h-4 mr-2" /> Filters:</div><div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">{(['all', 'video', 'image'] as const).map((f) => (<button key={f} onClick={() => setFormatFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${formatFilter === f ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-gray-600 hover:bg-gray-50'}`}>{f === 'all' ? 'All' : f}</button>))}</div></div>
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end"><span className="text-sm font-medium text-gray-500 whitespace-nowrap">Sort:</span><div className="relative group w-full sm:w-auto"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ArrowUpDown className="h-3.5 w-3.5 text-gray-400" /></div><select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full sm:w-auto appearance-none pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer hover:bg-gray-50"><option value="efficiency_score">Viral Score</option><option value="reach">Reach</option><option value="newest">Newest</option></select><div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none"><ChevronDown className="h-4 w-4 text-gray-400" /></div></div></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {isMetaActive && displayedItems.map((item: any) => {
                        const ad = item.representative;
                        const savedEntry = user.savedAds.find(s => s.data.id === ad.id && s.type === 'meta');
                        return <MetaAdCard key={ad.id} ad={ad} versionCount={item.count} viewMode={viewMode} onClick={(data) => onOpenModal(item.group, 'meta')} platformContext={activeTab === 'facebook' || activeTab === 'instagram' ? activeTab : undefined} onToggleSave={(ad) => onToggleSave(ad, 'meta')} isSaved={!!savedEntry} />;
                    })}
                    {activeTab === 'tiktok' && displayedItems.map((ad: any) => (
                        <TikTokAdCard key={ad.id} ad={ad} viewMode={viewMode} onClick={(data) => onOpenModal([data], 'tiktok')} />
                    ))}
                </div>
                {displayedItems.length === 0 && <div className="text-center py-20 text-gray-500">No results match your filters</div>}
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
                {user.savedAds.map((savedAd) => (<React.Fragment key={savedAd.id}>{savedAd.type === 'meta' ? <MetaAdCard ad={savedAd.data as MetaAd} onClick={(data) => onOpenModal([data], 'meta')} onToggleSave={() => onRemove(savedAd.id)} actionIcon={<Trash2 className="w-4 h-4" />} /> : <TikTokAdCard ad={savedAd.data as TikTokAd} onClick={(data) => onOpenModal([data], 'tiktok')} onAction={() => onRemove(savedAd.id)} actionIcon={<Trash2 className="w-4 h-4" />} />}</React.Fragment>))}
            </div>
        </div>
    );
};

const Account = ({ user, refreshUser }: { user: User, refreshUser: () => Promise<void> }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: user.name, email: user.email });
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => { setFormData({ name: user.name, email: user.email }); }, [user]);
    const handleSave = async () => { setIsSaving(true); try { await api.updateUser(formData); await refreshUser(); setIsEditing(false); } catch (error) { console.error("Failed to update profile", error); } finally { setIsSaving(false); } };
    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900">Settings</h1></div>
             <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setSearchParams({ tab: 'profile' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}>My Profile</button>
                <button onClick={() => setSearchParams({ tab: 'billing' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'billing' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500'}`}>Billing & Plans</button>
             </div>
             {activeTab === 'profile' && (<div className="space-y-6"><div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden"><div className="px-6 py-4 border-b border-gray-200"><h3 className="text-base font-medium text-gray-900">Personal Information</h3></div><div className="p-6"><div className="flex items-start space-x-6"><div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold border border-brand-100">{formData.name.charAt(0)}</div><div className="flex-1 space-y-4 max-w-lg"><div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" disabled={!isEditing} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" disabled={!isEditing} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm" /></div></div></div></div><div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">{isEditing ? <><button onClick={() => setIsEditing(false)} className="text-sm font-medium text-gray-700 mr-3">Cancel</button><button onClick={handleSave} className="text-sm font-medium text-white bg-brand-600 px-3 py-1.5 rounded-md">{isSaving ? 'Saving...' : 'Save'}</button></> : <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md">Edit Profile</button>}</div></div></div>)}
             {activeTab === 'billing' && (<div className="space-y-8"><div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6"><div className="flex items-center justify-between p-4 bg-brand-50/50 rounded-lg border border-brand-100"><div className="flex items-center"><div className="p-2 bg-brand-100 rounded-md text-brand-600 mr-4"><Zap className="w-5 h-5" /></div><div><div className="text-sm font-semibold text-gray-900 capitalize">{user.plan} Plan</div></div></div><button className="text-sm font-medium text-brand-600">Manage</button></div></div></div>)}
        </div>
    )
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAdsGroup, setSelectedAdsGroup] = useState<{data: any[], type: 'meta' | 'tiktok'} | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean, onUndo?: () => void }>({ message: '', visible: false });

  const refreshUser = async () => { try { const userData = await api.getUser(); setUser(userData); } catch (error) { console.error("Error fetching user:", error); } };
  useEffect(() => { const init = async () => { await refreshUser(); setLoading(false); }; init(); }, []);
  const showToast = (message: string, onUndo?: () => void) => { setToast({ message, visible: true, onUndo }); setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); }, 5000); };
  
  const handleToggleSave = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => {
      if (!user) return;
      const existing = user.savedAds.find(s => s.data.id === ad.id && s.type === type);
      if (existing) await handleRemoveAd(existing.id); else await handleSaveAd(ad, type);
  };
  const handleSaveAd = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => { try { await api.saveAd(ad, type); await refreshUser(); showToast("Ad saved to library"); } catch (e) { console.error("Failed to save ad", e); } };
  const handleRemoveAd = async (id: string) => { try { await api.removeSavedAd(id); await refreshUser(); showToast("Ad removed"); } catch (e) { console.error("Failed to remove ad", e); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const primaryAd = selectedAdsGroup?.data[0];
  const savedAdEntry = primaryAd && user?.savedAds.find(ad => ad.data.id === primaryAd.id && ad.type === selectedAdsGroup.type);
  const isSaved = !!savedAdEntry;

  return (
    <ErrorBoundary>
        <Router>
            <Routes>
                {/* 1. Public Demo Route (Isolated) */}
                <Route path="/demo" element={<DemoPage />} />

                {/* 2. Main App Routes (Wrapped in Layout) */}
                <Route path="*" element={
                    <Layout user={user}>
                        <Toast message={toast.message} visible={toast.visible} onUndo={toast.onUndo} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />
                        <AdDetailModal isOpen={!!selectedAdsGroup} onClose={() => setSelectedAdsGroup(null)} group={selectedAdsGroup?.data || []} type={selectedAdsGroup?.type} onSave={handleSaveAd} isSaved={isSaved} onRemove={() => savedAdEntry && handleRemoveAd(savedAdEntry.id)} />
                        
                        <Routes>
                            <Route path="/login" element={<Login onLoginSuccess={refreshUser} />} />
                            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
                            <Route path="/feed" element={user ? <div className="w-full"><div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Live Ad Feed</h1></div><AdFeed /></div> : <Navigate to="/login" replace />} />
                            <Route path="/search" element={user ? <SearchPage user={user} refreshUser={refreshUser} /> : <Navigate to="/login" replace />} />
                            <Route path="/results/:id" element={user ? <ResultsPage user={user} refreshUser={refreshUser} onOpenModal={(data, type) => setSelectedAdsGroup({data, type})} onToggleSave={handleToggleSave} /> : <Navigate to="/login" replace />} />
                            <Route path="/saved" element={user ? <SavedPage user={user} refreshUser={refreshUser} onOpenModal={(data, type) => setSelectedAdsGroup({data, type})} onRemove={handleRemoveAd} /> : <Navigate to="/login" replace />} />
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