import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { api } from './services/api';
import { User, SearchParams, SearchResult, MetaAd, TikTokAd, SavedAd } from './types';
import MetaAdCard from './components/MetaAdCard';
import TikTokAdCard from './components/TikTokAdCard';
import AdDetailModal from './components/AdDetailModal';
import { 
    Search, Loader2, AlertCircle, CheckCircle2, CreditCard, Lock, 
    ArrowRight, TrendingUp, Zap, Clock, Filter, Facebook, Instagram, Video,
    ChevronDown, SlidersHorizontal, BarChart3, ListFilter, ArrowUpDown, Globe, Bookmark, Trash2, Undo2, X, LayoutTemplate
} from 'lucide-react';

// --- Constants ---
const COUNTRIES = [
    { code: 'ALL', name: 'All Countries' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'BR', name: 'Brazil' },
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

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
    }, 1000);
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
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" 
                placeholder="Enter your email" 
                defaultValue="demo@adspy.com" 
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm transition-all shadow-xs" 
                placeholder="••••••••" 
                defaultValue="password" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">Remember me</label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-brand-600 hover:text-brand-700">Forgot password?</a>
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
    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1 text-sm">Overview of your activity and available credits.</p>
                </div>
                <button 
                    onClick={() => navigate('/search')} 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                >
                    <Search className="w-4 h-4 mr-2 text-gray-500" />
                    New Search
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Stats Card 1 */}
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
                        <span onClick={() => navigate('/billing')} className="text-brand-600 font-medium hover:text-brand-700 cursor-pointer flex items-center">
                            Top up credits <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                    </div>
                 </div>

                 {/* Stats Card 2 */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">Total Searches</span>
                        <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                             <BarChart3 className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-semibold text-gray-900">12</p>
                        <span className="text-sm text-green-600 font-medium flex items-center bg-green-50 px-2 py-0.5 rounded-full">+4 this week</span>
                    </div>
                 </div>

                 {/* Stats Card 3 */}
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Recent Searches</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                             <tr>
                                 <td colSpan={4} className="px-6 py-12 text-center">
                                     <div className="mx-auto flex flex-col items-center">
                                         <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                             <Search className="h-5 w-5 text-gray-400" />
                                         </div>
                                         <h3 className="text-sm font-medium text-gray-900">No searches yet</h3>
                                         <p className="mt-1 text-sm text-gray-500">Start your first competitive analysis.</p>
                                     </div>
                                 </td>
                             </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const SearchPage = ({ user, refreshUser }: { user: User, refreshUser: () => void }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'tiktok' | 'both'>('both');
    const [country, setCountry] = useState('ALL');
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            
            {/* Search Input Section - Full width within container */}
            <div className="w-full">
                <div className="text-left mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ad Intelligence Search</h1>
                    <p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta and TikTok libraries.</p>
                </div>

                {/* Clean Input Container */}
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
                    
                    {/* Divider */}
                    <div className="h-px bg-gray-100 mx-4"></div>

                    {/* Filters Section */}
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                    {(['both', 'meta', 'tiktok'] as const).map((p) => (
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

                            {/* Country Selector - Only shows if Platform is Meta or Both */}
                            {(platform === 'meta' || platform === 'both') && (
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

                            <div className="relative">
                                <select 
                                    value={limit} 
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium h-full w-full sm:w-auto"
                                >
                                    <option value={10}>10 Results</option>
                                    <option value={25}>25 Results</option>
                                    <option value={50}>50 Results</option>
                                    <option value={100}>100 Results</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-3 w-full md:w-auto justify-end mt-4 md:mt-0">
                            <div className="text-sm">
                                <span className="text-gray-500 mr-1">Cost:</span>
                                <span className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>{cost} credits</span>
                            </div>
                            <button 
                                onClick={handleSearch}
                                disabled={!query || !canAfford || loading}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Run Search <ArrowRight className="w-4 h-4 ml-2" /></>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status / Error Message */}
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
                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}
                </div>
            </div>

            {/* Info Grid - Full Width */}
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
    const [activeTab, setActiveTab] = useState<'meta' | 'tiktok'>('meta');
    
    // Search Bar State
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<'meta' | 'tiktok' | 'both'>('both');
    const [country, setCountry] = useState('ALL');
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formatFilter, setFormatFilter] = useState<'all' | 'video' | 'image'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'reach_views' | 'spend_shares'>('newest');
    
    // View Mode State
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
            
            // Sync search bar state with result
            setQuery(parsed.params.query);
            setPlatform(parsed.params.platform);
            setLimit(parsed.params.limit);
            if (parsed.params.country) setCountry(parsed.params.country);

            if (parsed.params.platform === 'tiktok') setActiveTab('tiktok');
        }
    }, [id]);

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

    if (!result) return <div className="flex justify-center pt-24"><Loader2 className="animate-spin w-8 h-8 text-brand-600" /></div>;

    const showMeta = result.params.platform !== 'tiktok';
    const showTikTok = result.params.platform !== 'meta';

    // Filtering and Sorting Logic
    const getFilteredAndSortedAds = () => {
        if (activeTab === 'meta') {
            let ads = [...result.metaAds];
            // Filter
            if (formatFilter === 'video') {
                ads = ads.filter(ad => ad.snapshot.videos && ad.snapshot.videos.length > 0);
            } else if (formatFilter === 'image') {
                ads = ads.filter(ad => (!ad.snapshot.videos || ad.snapshot.videos.length === 0));
            }

            // Sort
            ads.sort((a, b) => {
                if (sortBy === 'likes') return b.likes - a.likes;
                if (sortBy === 'reach_views') return b.impressions - a.impressions;
                if (sortBy === 'spend_shares') return b.spend - a.spend;
                // Newest (default)
                return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
            });
            return ads;
        } else {
            let ads = [...result.tikTokAds];
            // TikTok is mostly video, but let's keep logic for consistency if we had image ads
             if (formatFilter === 'image') return []; // Assume no image ads for tiktok MVP

            // Sort
            ads.sort((a, b) => {
                if (sortBy === 'likes') return b.diggCount - a.diggCount;
                if (sortBy === 'reach_views') return b.playCount - a.playCount; // Views
                if (sortBy === 'spend_shares') return b.shareCount - a.shareCount; // Shares
                // Newest (default)
                return new Date(b.createTimeISO).getTime() - new Date(a.createTimeISO).getTime();
            });
            return ads;
        }
    };

    const displayedAds = getFilteredAndSortedAds();

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
                        />
                    </div>
                    <div className="h-px bg-gray-100 mx-4"></div>
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                    {(['both', 'meta', 'tiktok'] as const).map((p) => (
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

                            {/* Country Selector - Only shows if Platform is Meta or Both */}
                            {(platform === 'meta' || platform === 'both') && (
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

                            <div className="relative">
                                <select 
                                    value={limit} 
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm font-medium h-full w-full sm:w-auto"
                                >
                                    <option value={10}>10 Results</option>
                                    <option value={25}>25 Results</option>
                                    <option value={50}>50 Results</option>
                                    <option value={100}>100 Results</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-3 w-full md:w-auto justify-end mt-4 md:mt-0">
                            <div className="text-sm">
                                <span className="text-gray-500 mr-1">Cost:</span>
                                <span className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>{cost} credits</span>
                            </div>
                            <button 
                                onClick={handleSearch}
                                disabled={!query || !canAfford || loading}
                                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Run Search <ArrowRight className="w-4 h-4 ml-2" /></>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status / Error Message */}
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
                     {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                     )}
                </div>
            </div>

            {/* NEW: Filter and Results Section (Appears below search) */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 space-y-6">
                
                {/* Control Row: Search Term, Tabs, Filters, Sort */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                    
                    {/* Left: Query & Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
                        <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
                            Results for <span className="text-brand-600">"{result.params.query}"</span>
                        </h2>
                        <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
                        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start">
                            {showMeta && (
                                <button 
                                    onClick={() => setActiveTab('meta')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        activeTab === 'meta' 
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Facebook className="w-3.5 h-3.5 mr-2 text-[#1877F2]" />
                                    Meta <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{result.metaAds.length}</span>
                                </button>
                            )}
                            {showTikTok && (
                                <button 
                                    onClick={() => setActiveTab('tiktok')}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        activeTab === 'tiktok' 
                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Video className="w-3.5 h-3.5 mr-2 text-[#E4405F]" />
                                    TikTok <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{result.tikTokAds.length}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Filters & Sort */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                         {/* Filters */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center text-gray-500 text-sm font-medium whitespace-nowrap">
                                <ListFilter className="w-4 h-4 mr-2" />
                                Filters:
                            </div>
                            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                                {(['all', 'video', 'image'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFormatFilter(f)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                                            formatFilter === f 
                                            ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {f === 'all' ? 'All Formats' : f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Sort:</span>
                            <div className="relative group w-full sm:w-auto">
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                                 </div>
                                 <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="w-full sm:w-auto appearance-none pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer hover:bg-gray-50"
                                 >
                                    <option value="newest">Newest First</option>
                                    <option value="likes">Most Likes</option>
                                    <option value="reach_views">
                                        {activeTab === 'meta' ? 'Estimated Reach' : 'Most Views'}
                                    </option>
                                    <option value="spend_shares">
                                        {activeTab === 'meta' ? 'Estimated Spend' : 'Most Shares'}
                                    </option>
                                 </select>
                                 <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                 </div>
                            </div>
                        </div>

                        {/* View Mode */}
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">View:</span>
                            <div className="relative group w-full sm:w-auto">
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LayoutTemplate className="h-3.5 w-3.5 text-gray-400" />
                                 </div>
                                 <select
                                    value={viewMode}
                                    onChange={(e) => handleViewModeChange(e.target.value as any)}
                                    className="w-full sm:w-auto appearance-none pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer hover:bg-gray-50"
                                 >
                                    <option value="details">More Details</option>
                                    <option value="condensed">Condensed</option>
                                 </select>
                                 <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            
                {/* Results Grid - Max 3 columns on desktop (lg) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {activeTab === 'meta' && displayedAds.map((ad: any) => (
                        <MetaAdCard key={ad.id} ad={ad} viewMode={viewMode} onClick={(data) => onOpenModal(data, 'meta')} />
                    ))}
                    
                    {activeTab === 'tiktok' && displayedAds.map((ad: any) => (
                        <TikTokAdCard key={ad.id} ad={ad} viewMode={viewMode} onClick={(data) => onOpenModal(data, 'tiktok')} />
                    ))}
                </div>

                {displayedAds.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="mx-auto h-12 w-12 text-gray-400 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Filter className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">No results match your filters</h3>
                        <p className="text-gray-500 mt-1 text-sm">Try adjusting your filters to see more ads.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SavedPage = ({ user, refreshUser, onOpenModal, onRemove }: { user: User, refreshUser: () => void, onOpenModal: (data: any, type: any) => void, onRemove: (id: string) => void }) => {
    
    if (user.savedAds.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center py-32 text-center">
                 <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-6">
                     <Bookmark className="w-8 h-8 text-brand-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">No saved ads yet</h2>
                 <p className="text-gray-500 mt-2 max-w-sm">
                     Save interesting ads from your searches to build your personal swipe file.
                 </p>
             </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Saved Library</h1>
                <p className="text-gray-500 mt-1 text-sm">Your personal collection of saved creatives.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {user.savedAds.map((savedAd) => (
                    <div key={savedAd.id} className="relative group/saved">
                         {savedAd.type === 'meta' ? (
                             <MetaAdCard ad={savedAd.data as MetaAd} onClick={(data) => onOpenModal(data, 'meta')} />
                         ) : (
                             <TikTokAdCard ad={savedAd.data as TikTokAd} onClick={(data) => onOpenModal(data, 'tiktok')} />
                         )}
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(savedAd.id);
                            }}
                            className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur text-red-600 rounded-full shadow-sm opacity-0 group-hover/saved:opacity-100 transition-opacity hover:bg-red-50 border border-gray-200"
                            title="Remove from saved"
                         >
                             <Trash2 className="w-4 h-4" />
                         </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Billing = () => {
    return (
        <div className="space-y-12 pb-12">
            <div className="text-center max-w-2xl mx-auto pt-8">
                <h2 className="text-base font-semibold text-brand-600 tracking-wide uppercase">Pricing</h2>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
                    Simple, transparent pricing
                </h1>
                <p className="mt-4 text-xl text-gray-500">
                    Choose the plan that best fits your ad intelligence needs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {[
                    { name: 'Starter', credits: 1500, price: '$19', description: 'Essential tools for small teams.' },
                    { name: 'Pro', credits: 5000, price: '$49', popular: true, description: 'Advanced features for growing brands.' },
                    { name: 'Agency', credits: 10000, price: '$149', description: 'Maximum power for large scale.' },
                ].map((plan) => (
                    <div key={plan.name} className={`bg-white rounded-2xl shadow-sm flex flex-col border ${plan.popular ? 'border-brand-600 ring-4 ring-brand-500/10' : 'border-gray-200'}`}>
                        <div className="p-8 flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                </div>
                                {plan.popular && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                                        Popular
                                    </span>
                                )}
                            </div>
                            <div className="mt-6 flex items-baseline">
                                <span className="text-4xl font-bold text-gray-900 tracking-tight">{plan.price}</span>
                                <span className="ml-1 text-sm text-gray-500 font-medium">/month</span>
                            </div>
                            
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <div className="flex items-center mb-4">
                                     <span className="text-2xl font-bold text-gray-900 mr-2">{plan.credits}</span>
                                     <span className="text-sm text-gray-600">Credits / mo</span>
                                </div>
                                <ul className="space-y-4">
                                    {['Access to all platforms', 'HD Video Downloads', 'Real-time Search', 'Priority Support'].map(feature => (
                                        <li key={feature} className="flex items-start text-sm text-gray-600">
                                            <CheckCircle2 className="w-5 h-5 text-brand-600 mr-3 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="p-8 pt-0 mt-auto">
                            <button className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-sm ${plan.popular ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                                Choose {plan.name}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const Account = ({ user }: { user: User }) => {
    return (
        <div className="max-w-4xl mx-auto">
             <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
                <p className="text-gray-500 mt-1">Manage your profile and subscription details.</p>
             </div>
             
             <div className="space-y-6">
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-base font-medium text-gray-900">Personal Information</h3>
                    </div>
                    <div className="p-6">
                         <div className="flex items-start space-x-6">
                            <div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold border border-brand-100">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-4 max-w-lg">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" disabled value={user.name} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm" />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input type="text" disabled value={user.email} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm" />
                                 </div>
                            </div>
                         </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
                        <button className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm">
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-base font-medium text-gray-900">Subscription & Usage</h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between p-4 bg-brand-50/50 rounded-lg border border-brand-100">
                             <div className="flex items-center">
                                <div className="p-2 bg-brand-100 rounded-md text-brand-600 mr-4">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">Starter Plan</div>
                                    <div className="text-sm text-gray-500">Active until Nov 1, 2023</div>
                                </div>
                             </div>
                             <button className="text-sm font-medium text-brand-600 hover:text-brand-700">Upgrade Plan</button>
                        </div>
                        
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">Credit Usage</span>
                                <span className="text-gray-500">{user.credits} remaining</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-brand-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    )
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedAd, setSelectedAd] = useState<{data: any, type: 'meta' | 'tiktok'} | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string, visible: boolean, onUndo?: () => void }>({ message: '', visible: false });

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

  const showToast = (message: string, onUndo?: () => void) => {
      setToast({ message, visible: true, onUndo });
      setTimeout(() => {
          setToast(prev => ({ ...prev, visible: false }));
      }, 5000);
  };

  const handleSaveAd = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => {
      try {
          await api.saveAd(ad, type);
          await refreshUser();
          setSelectedAd(null);
          showToast("Ad saved to library");
      } catch (e) {
          console.error("Failed to save ad", e);
      }
  };

  const handleRemoveAd = async (id: string) => {
      // Find ad to restore later if needed
      const adToRemove = user?.savedAds.find(ad => ad.id === id);
      
      try {
          await api.removeSavedAd(id);
          await refreshUser(); // Optimistic update would be better but this is MVP
          
          showToast("Ad removed from library", async () => {
              // Undo Logic
              if (adToRemove) {
                   await api.saveAd(adToRemove.data, adToRemove.type);
                   await refreshUser();
              }
          });

      } catch (e) {
          console.error("Failed to remove ad", e);
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user}>
        {/* Global Toast */}
        <Toast 
            message={toast.message} 
            visible={toast.visible} 
            onUndo={toast.onUndo} 
            onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
        />
        
        {/* Global Modal */}
        <AdDetailModal 
            isOpen={!!selectedAd} 
            onClose={() => setSelectedAd(null)} 
            data={selectedAd?.data} 
            type={selectedAd?.type}
            onSave={handleSaveAd}
        />

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/search" 
            element={user ? <SearchPage user={user} refreshUser={refreshUser} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/results/:id" 
            element={user ? <ResultsPage user={user} refreshUser={refreshUser} onOpenModal={(data, type) => setSelectedAd({data, type})} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/saved" 
            element={user ? <SavedPage user={user} refreshUser={refreshUser} onOpenModal={(data, type) => setSelectedAd({data, type})} onRemove={handleRemoveAd} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/billing" 
            element={user ? <Billing /> : <Navigate to="/login" replace />} 
          />
           <Route 
            path="/account" 
            element={user ? <Account user={user} /> : <Navigate to="/login" replace />} 
          />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;