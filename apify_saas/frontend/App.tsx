import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useSearchParams, useParams, Link, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { api } from './services/api';
import { User, SearchResult, MetaAd, TikTokAd, UserPlan } from './types';
import MetaAdCard from './components/MetaAdCard';
import CookieConsent from "react-cookie-consent";
// TikTokAdCard Import bleibt für Saved Page Fallback, wird aber in Suche ausgeblendet
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
    ChevronDown, BarChart3, ListFilter, ArrowUpDown, Bookmark, Trash2, Undo2, X, LayoutGrid, Mail, Sparkles, Users as UsersIcon, Coins, Download,
    FileText, ShieldCheck, Lock, KeyRound
} from 'lucide-react';
// @ts-ignore
import { cleanAndTransformData } from './adAdapter';

// --- Pages Imports ---
import { DemoPage } from './DemoPage';
import { PricingPage } from './PricingPage';
import { Register } from './Register';
import { LandingPage } from './LandingPage';
import { EmailConfirmed } from './EmailConfirmed';

// --- STRIPE PRICE IDS ---
// Monthly Plans
const PRICE_ID_STARTER_MONTHLY    = "price_1SqYwQ5vTctBPhfeBKjAv4nY";
const PRICE_ID_PRO_MONTHLY        = "price_1SqYwR5vTctBPhfe7sekjMdK";

// Yearly Plans
const PRICE_ID_STARTER_YEARLY     = "price_1SqYwQ5vTctBPhfeiVkpek9p";
const PRICE_ID_PRO_YEARLY         = "price_1SqYwR5vTctBPhfe4mB23SYr";

// Top-Up Credits
const PRICE_ID_TOPUP_STARTER      = "price_1SqYwS5vTctBPhfeD84iwobm"; 
const PRICE_ID_TOPUP_PRO          = "price_1SqYwS5vTctBPhfeFljQAEOU"; 
const PRICE_ID_TOPUP_ENTERPRISE   = "price_1SqYwT5vTctBPhfe7YuJxtVT"; 

const ENTERPRISE_MAIL             = "info@stellaads.io";

const COUNTRIES = [
    { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' }, { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
    { code: 'DK', name: 'Denmark' }, { code: 'EE', name: 'Estonia' }, { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
    { code: 'HU', name: 'Hungary' }, { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' },
    { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
    { code: 'MT', name: 'Malta' }, { code: 'NL', name: 'Netherlands' }, { code: 'NO', name: 'Norway' },
    { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' },
    { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' }
];

const STATUS_MESSAGES = [
    "Spinning up scraper nodes...", "Connecting to Meta Ad Library...", "Authenticating secure session...",
    "Querying ad database...", "Scraping creative assets...", "Analyzing targeting demographics...",
    "Extracting spend estimates...", "Calculating viral efficiency...", "Finalizing report results..."
];

// --- Helper for LocalStorage Quota ---
const safeLocalStorageSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            console.warn(`LocalStorage quota exceeded for key "${key}". Data will not be persisted but is available in current session.`);
        } else {
            console.error("Error saving to localStorage", e);
        }
    }
};

// --- Components ---

// NEU: Contact Modal für Enterprise Anfragen
const ContactModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vielen Dank! Deine Anfrage wurde gesendet. Wir melden uns in Kürze.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm">
                <Mail className="w-7 h-7 text-brand-600" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-900">Contact Sales</h3>
                <p className="text-slate-500 text-sm font-medium">Für Enterprise & Agentur-Lösungen</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                <input required type="text" className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none bg-slate-50/50 transition-all font-medium" placeholder="Max Mustermann" />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-Mail Adresse</label>
                <input required type="email" className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none bg-slate-50/50 transition-all font-medium" placeholder="name@firma.de" />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nachricht</label>
                <textarea className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none bg-slate-50/50 h-32 resize-none transition-all font-medium" placeholder="Erzähl uns von deinem Team und Anforderungen..." />
            </div>
            <button type="submit" className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 hover:shadow-xl hover:-translate-y-0.5">Anfrage absenden</button>
        </form>
      </div>
    </div>
  );
};

const SearchProgressBar = ({ progress, status }: { progress: number, status: string }) => (
    <div className="flex flex-col gap-1.5 w-full sm:w-64 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider animate-pulse">{status}</span>
            <span className="text-sm font-bold text-gray-700">{progress}%</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    </div>
);

const Toast = ({ message, onUndo, onClose, visible }: { message: string, onUndo?: () => void, onClose: () => void, visible: boolean }) => {
    if (!visible) return null;
    return (
        <div className="fixed bottom-6 right-6 z-[1000] animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] justify-between">
                <span className="text-sm font-medium">{message}</span>
                <div className="flex items-center gap-3">
                    {onUndo && <button onClick={onUndo} className="text-brand-300 hover:text-white text-sm font-semibold flex items-center gap-1 transition-colors"><Undo2 className="w-3 h-3" /> Undo</button>}
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

const SearchInputSection = ({ query, setQuery, country, setCountry, dateRange, setDateRange, loading, progress, statusIndex, handleSearch, canAfford, cost, remainingCredits, error, user }: any) => (
    <div className="w-full mb-8">
        <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm relative transition-all focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:border-brand-500 w-full">
            <div className="flex items-center px-4">
                <Search className="w-6 h-6 text-gray-400 mr-3" />
                <input type="text" className="w-full py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent" placeholder="e.g. 'Skincare', 'Nike'..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} autoFocus />
            </div>
            <div className="h-px bg-gray-100 mx-4"></div>
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:flex-none">
                        <div className="flex items-center gap-2">
                            <div className="px-4 py-1.5 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm ring-1 ring-black/5 flex items-center gap-2 border border-gray-100">
                                <Facebook className="w-4 h-4 text-[#1877F2]" />
                                Meta Ads
                            </div>
                        </div>
                    </div>
                    <CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} />
                    <DateRangePicker date={dateRange} setDate={setDateRange} />
                </div>
                <div className="text-right flex items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 min-h-[48px]">
                    {loading ? <SearchProgressBar progress={Math.floor(progress)} status={STATUS_MESSAGES[statusIndex]} /> : <>
                        <div className="text-sm"><span className="text-gray-500 mr-1">Cost:</span><span className={`font-semibold ${canAfford ? 'text-gray-900' : 'text-red-600'}`}>{cost} credits</span></div>
                        <button onClick={handleSearch} disabled={!query || !canAfford || loading} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed">Run Search <ArrowRight className="w-4 h-4 ml-2" /></button>
                    </>}
                </div>
            </div>
        </div>
        <div className="mt-4 flex justify-between items-start px-2">
            {!canAfford ? <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-100"><AlertCircle className="w-4 h-4 mr-2" /> Insufficient credits. You have {user.credits}.</div> : <div className="text-sm text-gray-500 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> You will have <span className="font-medium text-gray-900 mx-1">{remainingCredits}</span> credits left.</div>}
            {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100 mt-2">{error}</div>}
        </div>
    </div>
);

// --- Pages ---

const Login = ({ onLoginSuccess }: { onLoginSuccess: () => Promise<void> }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // NEU: Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        await api.login(email, password);
        await onLoginSuccess();
    } catch (err: any) {
        setError('Login failed. Please check email and password.');
        setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetLoading(true);
      try {
          await api.requestPasswordReset(resetEmail);
          setResetMessage("If an account exists, a reset link has been sent.");
      } catch(e) {
          setResetMessage("Error sending reset link.");
      } finally {
          setResetLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center">
           <div className="mx-auto h-12 w-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20"><Zap className="h-6 w-6 text-white fill-white" /></div>
           <h2 className="mt-6 text-2xl font-semibold text-gray-900">Welcome back</h2>
           <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the workspace.</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm shadow-xs" placeholder="Enter your email" /></div>
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => setShowResetModal(true)} className="text-xs font-medium text-brand-600 hover:text-brand-500">Forgot password?</button>
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 sm:text-sm shadow-xs" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all">{loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}</button>
        </form>
        <div className="text-center mt-4"><span className="text-sm text-gray-500">Don't have an account? </span><Link to="/register" className="text-sm font-medium text-brand-600 hover:text-brand-500">Sign up</Link></div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowResetModal(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowResetModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
                  <p className="text-sm text-gray-500 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                  
                  {resetMessage ? (
                      <div className="text-center py-4">
                          <p className="text-green-600 text-sm font-medium mb-4">{resetMessage}</p>
                          <button onClick={() => setShowResetModal(false)} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Close</button>
                      </div>
                  ) : (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                          <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="name@company.com" />
                          <button type="submit" disabled={resetLoading} className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-70">{resetLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : "Send Reset Link"}</button>
                      </form>
                  )}
              </div>
          </div>
      )}
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
        // Platform fest auf 'meta' setzen
        navigate(`/results/${item.id}`);
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1><p className="text-gray-500 mt-1 text-sm">Overview of your activity and available credits.</p></div>
                <div className="flex gap-2">
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
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Query</th>
                                <th className="px-6 py-4">Country</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {user.searchHistory.length > 0 ? (user.searchHistory.slice(0, 5).map((search) => (
                            <tr key={search.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{search.query}</td>
                                <td className="px-6 py-4 text-gray-500">{search.country ? (COUNTRIES.find(c => c.code === search.country)?.name || search.country) : 'Global'}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(search.timestamp).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleRerun(search)} className="text-brand-600 hover:text-brand-900 font-medium text-xs">Rerun</button>
                                </td>
                            </tr>
                        ))) : (<tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">No searches yet</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// FIX: Komponente wieder in SearchLogicWrapper umbenannt
const SearchLogicWrapper = ({ user, refreshUser, initialResultId, onOpenModal }: any) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // FIX: Saubere ID-Extraktion mit useParams
    const { id: routeId } = useParams();
    
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('DE');
    const [dateRange, setDateRange] = useState<{from: Date|undefined, to: Date|undefined}>({ from: undefined, to: undefined });
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const [error, setError] = useState('');
    const [result, setResult] = useState<SearchResult | null>(null);
    const [activeTab, setActiveTab] = useState<'facebook'|'instagram'>('facebook');
    const [formatFilter, setFormatFilter] = useState<'all'|'video'|'image'>('all');
    const [sortBy, setSortBy] = useState('efficiency_score');
    const [viewMode, setViewMode] = useState<'condensed' | 'details'>(() => (localStorage.getItem('view_mode') as 'condensed' | 'details') || 'details');
    const [exportData, setExportData] = useState<SearchResult | null>(null);
    
    // FIX: Client-Side Pagination State
    const [visibleCount, setVisibleCount] = useState(50);
    
    // FIX: Ref um Endlos-Loops beim History Loading zu verhindern
    const historyAttempted = useRef<Set<string>>(new Set());

    const limit = user.searchLimit || 100;
    const cost = limit;
    const canAfford = user.credits >= cost;
    const remainingCredits = user.credits - cost;

    // FIX: Prüfen auf Pro oder Enterprise für Export
    const canExport = user.plan === 'pro' || user.plan === 'enterprise';

    // --- FIX: RERUN / LOAD HISTORY LOGIC ---
    useEffect(() => {
        const loadHistory = async (id: string) => {
            // FIX: Hier ist der Schutz gegen "dashboard" und andere ungültige IDs
            if (!id || id === 'dashboard' || id === 'undefined' || id.length < 10) return;

            // FIX: WICHTIG - Wenn das Ergebnis schon geladen ist und die ID übereinstimmt, NICHTS tun.
            // Das verhindert das "Verschwinden" und den CORS-Fehler Loop.
            if (result && (result.id === id || result.search_id === id || (result.meta && result.meta.search_id === id))) {
                console.log("✅ Using existing data from memory, skipping fetch.");
                return;
            }
            
            // FIX: Loop Prevention - Wenn schon versucht, abbrechen!
            if (historyAttempted.current.has(id)) {
                console.warn(`⚠️ Already attempted to load ${id}, skipping to prevent loop.`);
                return;
            }
            historyAttempted.current.add(id);

            // Wenn wir hier sind, müssen wir wirklich laden
            setResult(null); 
            setVisibleCount(50); // Reset Pagination
            setLoading(true); setStatusIndex(8); setProgress(90); 
            
            try {
                // Versuche erst LocalStorage
                const stored = localStorage.getItem(`search_${id}`);
                let loadedFromCache = false;
                
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        // FIX: Nur nutzen, wenn tatsächlich Daten drin sind!
                        // Wenn wir nur Metadaten gespeichert haben (wegen Quota), müssen wir neu laden.
                        if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                            setResult(parsed);
                            setQuery(parsed.params.query);
                            setCountry(parsed.params.country || 'DE');
                            loadedFromCache = true;
                        }
                    } catch(e) {
                        console.warn("Cache parse error", e);
                    }
                }
                
                if (!loadedFromCache) {
                    // Fallback: API Call (DB via api.getSearchHistory)
                    const historyResult = await api.getSearchHistory(id);
                    // Check if result is valid
                    if (historyResult && historyResult.data) {
                        setResult(historyResult);
                        setQuery(historyResult.params.query);
                        setCountry(historyResult.params.country || 'DE');
                    } else {
                        throw new Error("Empty history result");
                    }
                }
            } catch (e) {
                console.error(e);
                setError("Could not load search history. Please try searching again.");
            } finally {
                setLoading(false); setProgress(100);
            }
        };

        // FIX: Wir prüfen nur auf initialResultId und loading, nicht mehr auf !result
        // Das erlaubt das Neuladen, auch wenn schon was da ist.
        if (routeId && !loading) {
            loadHistory(routeId);
        }
    }, [routeId, result]); // Dependencies include result for the check inside

    const handleSearch = useCallback(async () => {
        if (!query || !canAfford || loading) return;
        setLoading(true); setProgress(0); setStatusIndex(0); setError(''); setVisibleCount(50); // Reset Pagination

        // --- FIX: DYNAMISCHER PROGRESS BALKEN ---
        // Formel: 40s Startzeit (Apify Cold Start) + 0.21s pro Ad
        const estimatedDuration = 40 + (limit * 0.21);
        const percentPerTick = 100 / (estimatedDuration * 10); // *10 weil 100ms interval

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                // Wir lassen es max bis 99% laufen
                const next = Math.min(99, prev + percentPerTick);
                
                // Status Messages umschalten
                if (next > (100 / STATUS_MESSAGES.length) * (statusIndex + 1)) {
                    setStatusIndex(idx => Math.min(STATUS_MESSAGES.length - 1, idx + 1));
                }
                return next;
            });
        }, 100);

        try {
            const apiResult = await api.runSearch({ 
                query, platform: 'meta', country, limit: cost, 
                startDateMin: dateRange.from?.toISOString().split('T')[0], 
                startDateMax: dateRange.to?.toISOString().split('T')[0] 
            });
            
            clearInterval(progressTimer); 
            setProgress(100); 
            setStatusIndex(STATUS_MESSAGES.length - 1);
            
            // WICHTIG: Setze das Resultat SOFORT.
            setResult(apiResult);
            
            // FIX: LocalStorage Update OHNE riesige Datenmengen
            // Wir speichern nur die Metadaten, damit der Browser nicht crasht.
            try {
                const cacheData = { ...apiResult, data: [] }; // Leeres Data-Array
                safeLocalStorageSetItem(`search_${apiResult.id}`, JSON.stringify(cacheData));
            } catch (e) {
                console.warn("LocalStorage Update failed:", e);
            }
            
            await refreshUser();
            setLoading(false);
            
            // Navigate triggert jetzt zwar den useEffect oben, aber der checkt "result" und bricht ab.
            navigate(`/results/${apiResult.id}?q=${encodeURIComponent(query)}&country=${country}`, { replace: true });
            
        } catch (err: any) { 
            clearInterval(progressTimer); setLoading(false); setError(err.message || 'Search failed.'); 
        }
    }, [query, country, dateRange, user.credits, cost, canAfford, loading, refreshUser, navigate, statusIndex, limit]);


    const transformedMetaAds = useMemo(() => {
        if (!result) return [];
        // @ts-ignore
        let rawAds = result.metaAds || result.data || [];
        if (!Array.isArray(rawAds)) return [];
        // @ts-ignore
        if (rawAds.length > 0 && (rawAds[0].efficiency_score !== undefined || rawAds[0].demographics)) return rawAds; 
        const adsToTransform = rawAds.map((ad: any) => ({ data: ad }));
        return cleanAndTransformData(adsToTransform);
    }, [result]);

    const groupAdsByText = (ads: MetaAd[]) => {
        const groups: { [key: string]: MetaAd[] } = {};
        ads.forEach(ad => { const key = ad.snapshot.body.text ? ad.snapshot.body.text.trim() : ad.id; if (!groups[key]) groups[key] = []; groups[key].push(ad); });
        return Object.values(groups).map(group => { group.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()); return { representative: group[0], group: group, count: group.length }; });
    };

    const getFilteredAndSortedAds = () => {
        if (!result) return [];
        let ads: any[] = [];
        
        if (activeTab === 'facebook') { ads = [...transformedMetaAds.filter((ad: MetaAd) => ad.publisher_platform.includes('facebook'))]; }
        else if (activeTab === 'instagram') { ads = [...transformedMetaAds.filter((ad: MetaAd) => ad.publisher_platform.includes('instagram'))]; }

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
    };

    const displayedItems = getFilteredAndSortedAds();
    // FIX: Slice items based on visibleCount to prevent lags
    const visibleItems = displayedItems.slice(0, visibleCount);
    
    const isMetaActive = activeTab === 'facebook' || activeTab === 'instagram';
    
    const handleToggleSave = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => {
        if (!user) return;
        const existing = user.savedAds.find(s => s.data.id === ad.id && s.type === type);
        if (existing) await onOpenModal([ad], type); // Placeholder, eigentlich müsste hier remove sein
        else await onOpenModal([ad], type); // Placeholder
    };

    // --- FIX: ECHTE EXPORT FUNKTION ---
    const handleExportFile = (format: 'csv' | 'json') => {
        if (!exportData) return;
        
        const dataToExport = exportData.metaAds || []; // TikTok support ggf. später
        const fileName = `stella_ads_export_${new Date().toISOString().split('T')[0]}.${format}`;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // CSV Generation
            const headers = ['ID', 'Platform', 'Page', 'Text', 'Link', 'Start Date', 'Reach', 'Score', 'Media URL'];
            const rows = dataToExport.map((ad: any) => {
                const escape = (text: string) => `"${(text || '').replace(/"/g, '""')}"`;
                return [
                    ad.id,
                    'Meta',
                    escape(ad.page_name),
                    escape(ad.snapshot?.body?.text),
                    ad.snapshot?.link_url || '',
                    ad.start_date || '',
                    ad.reach || 0,
                    ad.efficiency_score || 0,
                    ad.snapshot?.images?.[0]?.resized_image_url || ad.snapshot?.videos?.[0]?.video_hd_url || ''
                ].join(',');
            });
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        }
        setExportData(null);
    };

    return (
        <div className="w-full">
            {/* FIX: Export Modal hier eingebunden */}
            <ExportModal isOpen={!!exportData} onClose={() => setExportData(null)} onExport={handleExportFile} resultCount={exportData ? (exportData.metaAds?.length || 0) : 0} />

            <div className="w-full">
                <div className="text-left mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Ad Intelligence Search</h1><p className="text-gray-500 mt-1 text-sm">Find winning creatives across Meta.</p></div>
                
                <SearchInputSection query={query} setQuery={setQuery} country={country} setCountry={setCountry} dateRange={dateRange} setDateRange={setDateRange} loading={loading} progress={progress} statusIndex={statusIndex} handleSearch={handleSearch} canAfford={canAfford} cost={cost} remainingCredits={remainingCredits} error={error} user={user} />
            </div>

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4 space-y-6">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full xl:w-auto">
                            <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">Results for <span className="text-brand-600">"{result.params.query}"</span></h2>
                            <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2"></div>
                            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start">
                                <button onClick={() => setActiveTab('facebook')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'facebook' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Facebook className="w-3.5 h-3.5 mr-2 text-[#1877F2]" /> Facebook <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{transformedMetaAds.filter(a => a.publisher_platform.includes('facebook')).length}</span></button>
                                <button onClick={() => setActiveTab('instagram')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'instagram' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}><Instagram className="w-3.5 h-3.5 mr-2 text-[#E4405F]" /> Instagram <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-semibold border border-gray-200 min-w-[20px] text-center">{transformedMetaAds.filter(a => a.publisher_platform.includes('instagram')).length}</span></button>
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
                    {/* GRID ANZEIGE: Nutzt jetzt visibleItems statt displayedItems */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        {isMetaActive && visibleItems.map((item: any) => {
                            const ad = item.representative;
                            const savedEntry = user.savedAds.find(s => s.data.id === ad.id && s.type === 'meta');
                            return <MetaAdCard key={ad.id} ad={ad} versionCount={item.count} viewMode={viewMode} onClick={(data) => onOpenModal(item.group, 'meta')} platformContext={activeTab === 'facebook' || activeTab === 'instagram' ? activeTab : undefined} onToggleSave={(ad) => onOpenModal([ad], 'meta')} isSaved={!!savedEntry} />;
                        })}
                    </div>
                    
                    {/* FIX: Load More Button (English) */}
                    {displayedItems.length > visibleCount && (
                        <div className="flex justify-center py-8">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 50)}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                            >
                                Show more results ({displayedItems.length - visibleCount} remaining)
                            </button>
                        </div>
                    )}

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

    // Pricing & Plan Arrays here... (Unverändert)
    const pricingPlans = [
        { 
            name: 'Starter', 
            id: 'starter', 
            subheader: 'Best for: Occasional Research', 
            monthlyPrice: '€49', 
            yearlyPrice: '€39', 
            credits: '1,500 Credits', 
            scans: '100 Data Points', 
            seats: '1 User Seat', 
            topup: '€25 / 1k', 
            export: '-',
            monthlyPriceId: PRICE_ID_STARTER_MONTHLY,
            yearlyPriceId: PRICE_ID_STARTER_YEARLY 
        },
        { 
            name: 'Pro', 
            id: 'pro', 
            subheader: 'Best for: Heavy Users', 
            monthlyPrice: '€129', 
            yearlyPrice: '€99', 
            credits: '50,000 Credits', 
            scans: '1,000 Data Points', 
            seats: '2 User Seats', 
            topup: '€10 / 1k', 
            export: 'CSV/JSON', 
            popular: true,
            monthlyPriceId: PRICE_ID_PRO_MONTHLY,
            yearlyPriceId: PRICE_ID_PRO_YEARLY
        },
        { 
            name: 'Enterprise', 
            id: 'enterprise', 
            subheader: 'Best for: Agencies', 
            monthlyPrice: 'Contact', 
            yearlyPrice: 'Contact', 
            credits: '250,000 Credits', 
            scans: 'Custom', 
            seats: '5 Seats', 
            topup: '€5 / 1k', 
            export: 'API' 
        }
    ];
    
    const creditTopupPlans = [
        { 
            name: 'Starter', 
            id: 'starter_topup', 
            price: '25 €', 
            unit: '/ 1k Credits', 
            features: ['Instant availability', 'Credits never expire', 'One-time purchase'], 
            buttonText: 'Buy Credits',
            priceId: PRICE_ID_TOPUP_STARTER 
        },
        { 
            name: 'Pro', 
            id: 'pro_topup', 
            price: '10 €', 
            unit: '/ 1k Credits', 
            features: ['Volume savings', 'Credits never expire', 'Priority scraping nodes'], 
            popular: true, 
            buttonText: 'Buy Credits',
            priceId: PRICE_ID_TOPUP_PRO 
        },
        { 
            name: 'Enterprise', 
            id: 'enterprise_topup', 
            price: '5 €', 
            unit: '/ 1k Credits', 
            features: ['Maximum cost efficiency', 'Custom credit pools', 'Dedicated support'], 
            buttonText: 'Buy Credits',
            priceId: PRICE_ID_TOPUP_ENTERPRISE
        }
    ];

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: user.name, email: user.email });
    const [isSaving, setIsSaving] = useState(false);
    // Kontakt-Modal State
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

    // NEU: Password Change State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [isChangingPw, setIsChangingPw] = useState(false);

    useEffect(() => { setFormData({ name: user.name, email: user.email }); }, [user]);
    
    const handleSave = async () => { setIsSaving(true); try { await api.updateUser(formData); await refreshUser(); setIsEditing(false); } catch (error) { console.error("Failed to update profile", error); } finally { setIsSaving(false); } };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');
        
        if (newPassword !== confirmPassword) {
            setPwError("New passwords do not match.");
            return;
        }
        
        if (newPassword.length < 6) {
            setPwError("Password must be at least 6 characters.");
            return;
        }

        setIsChangingPw(true);
        try {
            await api.changePassword(oldPassword, newPassword);
            setPwSuccess("Password successfully updated.");
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            setPwError(e.message || "Failed to update password.");
        } finally {
            setIsChangingPw(false);
        }
    };

    const handlePlanAction = async (plan: any) => {
        if (plan.id === 'enterprise') {
             setIsContactOpen(true);
             return;
        }

        let priceId;
        if (billingCycle === 'topup') {
             priceId = plan.priceId;
        } else {
             priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
        }

        if (!priceId) return;

        setIsLoadingCheckout(true);
        try {
             const { url } = await api.createCheckoutSession(priceId);
             window.location.href = url;
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Checkout could not be started. Please try again.");
        } finally {
            setIsLoadingCheckout(false);
        }
    };

    return (
        <div className="w-full">
             <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900">Settings</h1><p className="text-gray-500 mt-1">Manage your account and subscription.</p></div>
             <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button onClick={() => setSearchParams({ tab: 'profile' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>My Profile</button>
                <button onClick={() => setSearchParams({ tab: 'billing' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'billing' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Billing & Plans</button>
                <button onClick={() => setSearchParams({ tab: 'privacy' })} className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'privacy' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Legal & Privacy</button>
             </div>
             
             {activeTab === 'profile' && (<div className="space-y-6 animate-in fade-in duration-300">
                 {/* Personal Info Box */}
                 <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-base font-medium text-gray-900">Personal Information</h3></div>
                     <div className="p-6">
                         <div className="flex items-start space-x-6">
                             <div className="h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold border border-brand-100">{formData.name.charAt(0)}</div>
                             <div className="flex-1 space-y-4 max-w-lg">
                                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" disabled={!isEditing} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} /></div>
                                 <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" disabled={!isEditing} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm ${!isEditing ? 'bg-gray-50 text-gray-500' : 'bg-white'}`} /></div>
                             </div>
                         </div>
                     </div>
                     <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">{isEditing ? <><button onClick={() => setIsEditing(false)} className="text-sm font-medium text-gray-700 mr-3 border border-gray-300 px-3 py-1.5 rounded-md">Cancel</button><button onClick={handleSave} className="text-sm font-medium text-white bg-brand-600 px-3 py-1.5 rounded-md">{isSaving ? 'Saving...' : 'Save Changes'}</button></> : <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-md">Edit Profile</button>}</div>
                 </div>

                 {/* Security / Password Change Box */}
                 <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                         <Lock className="w-4 h-4 text-gray-500"/>
                         <h3 className="text-base font-medium text-gray-900">Security & Password</h3>
                     </div>
                     <div className="p-6">
                         <form onSubmit={handlePasswordChange} className="max-w-lg space-y-4">
                             {pwError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{pwError}</div>}
                             {pwSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">{pwSuccess}</div>}
                             
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                 <div className="relative">
                                     <KeyRound className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                     <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="block w-full pl-10 border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm focus:ring-brand-500 focus:border-brand-500" placeholder="••••••••" />
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                 <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm focus:ring-brand-500 focus:border-brand-500" placeholder="New strong password" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                 <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="block w-full border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm focus:ring-brand-500 focus:border-brand-500" placeholder="Confirm new password" />
                             </div>
                             <div className="pt-2 text-right">
                                 <button type="submit" disabled={isChangingPw} className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-md shadow-sm transition-colors disabled:opacity-70">
                                     {isChangingPw ? "Updating..." : "Update Password"}
                                 </button>
                             </div>
                         </form>
                     </div>
                 </div>
             
                 {/* Contact Us Section */}
                 <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="text-base font-medium text-gray-900">Contact Us</h3></div>
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-50 rounded-lg text-brand-600"><Mail className="w-5 h-5" /></div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Email Support</p>
                                <button 
                                    onClick={() => setIsContactOpen(true)} 
                                    className="text-sm text-brand-600 hover:text-brand-700 font-semibold hover:underline"
                                >
                                    info@stellaads.io
                                </button>
                            </div>
                        </div>
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
                                    <div className="p-6 bg-gray-25/50 flex-1"><ul className="space-y-4">{billingCycle === 'topup' ? plan.features.map((feature: string) => (<li key={feature} className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 text-brand-600 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">{feature}</span></li>)) : <><li className="flex items-center text-sm"><Sparkles className="w-4 h-4 text-brand-600 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">{plan.credits}</span></li><li className="flex items-center text-sm"><Search className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" /><span className="text-gray-600">{plan.scans}</span></li></>}</ul></div>
                                    <div className="p-6 bg-white rounded-b-2xl">
                                        <button 
                                            onClick={() => handlePlanAction(plan)}
                                            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md ${user.plan === plan.id && billingCycle !== 'topup' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                                            disabled={(user.plan === plan.id && billingCycle !== 'topup') || isLoadingCheckout}
                                        >
                                            {isLoadingCheckout ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : (billingCycle === 'topup' ? plan.buttonText : (user.plan === plan.id ? 'Your Plan' : 'Buy Now'))}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
             )}
             
             {activeTab === 'privacy' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Legal Documents</h2>
                        <div className="grid gap-4">
                            <a href="https://stellaads.io/legal-notice/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-500 hover:shadow-md transition-all group bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-brand-50 transition-colors">
                                        <FileText className="w-5 h-5 text-slate-600 group-hover:text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Legal Notice (Impressum)</h3>
                                        <p className="text-sm text-slate-500">Company information and legal details</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                            </a>

                            <a href="https://stellaads.io/privacy-policy/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-500 hover:shadow-md transition-all group bg-white">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-brand-50 transition-colors">
                                        <ShieldCheck className="w-5 h-5 text-slate-600 group-hover:text-brand-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Privacy Policy (Datenschutzerklärung)</h3>
                                        <p className="text-sm text-slate-500">How we handle your data</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
            
            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </div>
    )
}

// FIX 2: User Check Wrapper to prevent Layout Crash on Login
const ProtectedRoute = ({ user, children, onLogout }: { user: User | null, children: React.ReactElement, onLogout: () => void }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <Layout user={user} onLogout={onLogout}>{children}</Layout>;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // FIX: Modal State & Handlers moved to App Level
  const [selectedAdsGroup, setSelectedAdsGroup] = useState<{data: any[], type: 'meta' | 'tiktok'} | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean, onUndo?: () => void }>({ message: '', visible: false });
  
  const refreshUser = async () => { try { const userData = await api.getUser(); setUser(userData); } catch (error) { console.error("User fetch error", error); } };
  
  const showToast = (message: string, onUndo?: () => void) => { setToast({ message, visible: true, onUndo }); setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000); };
  
  const handleSaveAd = async (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => {
      try { await api.saveAd(ad, type); await refreshUser(); showToast("Ad saved!"); } catch (e) { console.error("Save failed", e); }
  };
  const handleRemoveAd = async (id: string) => {
      try { await api.removeSavedAd(id); await refreshUser(); showToast("Ad removed!"); } catch (e) { console.error("Remove failed", e); }
  };

  // --- NEU: Logout Handler ---
  const handleLogout = () => {
      // 1. Storage leeren
      localStorage.removeItem('adspy_token');
      localStorage.removeItem('adspy_user_id');
      localStorage.removeItem('adspy_user_email');
      
      // 2. State leeren (löst Re-Render aus -> ProtectedRoute redirectet zu Login)
      setUser(null);
  };
  
  useEffect(() => { const init = async () => { await refreshUser(); setLoading(false); }; init(); }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <ErrorBoundary>
        <Router>
            {/* Modal & Toast on Top Level */}
            <Toast message={toast.message} visible={toast.visible} onUndo={toast.onUndo} onClose={() => setToast(prev => ({ ...prev, visible: false }))} />
            <AdDetailModal 
                isOpen={!!selectedAdsGroup} 
                onClose={() => setSelectedAdsGroup(null)} 
                group={selectedAdsGroup?.data || []} 
                type={selectedAdsGroup?.type} 
                onSave={(ad) => handleSaveAd(ad, 'meta')} 
                onRemove={() => { 
                    const ad = selectedAdsGroup?.data[0];
                    const saved = user?.savedAds.find(s => s.data.id === ad.id);
                    if(saved) handleRemoveAd(saved.id);
                }}
                isSaved={!!selectedAdsGroup?.data[0] && !!user?.savedAds.find(s => s.data.id === selectedAdsGroup.data[0].id)}
            />
            
            {/* HIER DAS COOKIE BANNER EINFÜGEN (ganz oben oder unten im Router) */}
            <CookieConsent
                location="bottom"
                buttonText="Akzeptieren"
                cookieName="stellaads_cookie_consent"
                style={{ background: "#2B373B" }}
                buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
                expires={150}
            >
                Diese Webseite nutzt Cookies, um die Nutzererfahrung zu verbessern.{' '}
                <a href="https://stellaads.io/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: "#FFF", textDecoration: "underline" }}>
                    Datenschutzerklärung
                </a>
            </CookieConsent>

            <Routes>
                {/* WICHTIG: Hier ändern wir die Logik für Login-Redirect */}
                <Route path="/login" element={
                    user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={refreshUser} />
                } />
                
                <Route path="/register" element={<Register />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/email-confirmed" element={<EmailConfirmed />} />
                <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
                
                <Route element={<ProtectedRoute user={user} onLogout={handleLogout} children={<Outlet />} />}>
                    <Route path="/dashboard" element={<Dashboard user={user!} />} />
                    <Route path="/feed" element={<div className="w-full"><div className="mb-8"><h1 className="text-2xl font-semibold">Live Ad Feed</h1></div><AdFeed /></div>} />
                    {/* FIX: Passing onOpenModal correctly */}
                    <Route path="/search" element={<SearchLogicWrapper user={user!} refreshUser={refreshUser} onOpenModal={(data:any, type:any) => setSelectedAdsGroup({data, type})} />} />
                    <Route path="/results/:id" element={<SearchLogicWrapper user={user!} refreshUser={refreshUser} initialResultId={window.location.hash.split('/').pop()} onOpenModal={(data:any, type:any) => setSelectedAdsGroup({data, type})} />} />
                    {/* FIX: Passing onOpenModal and onRemove correctly for Saved Page */}
                    <Route path="/saved" element={<SavedPage user={user!} refreshUser={refreshUser} onOpenModal={(data:any, type:any) => setSelectedAdsGroup({data, type})} onRemove={handleRemoveAd} />} />
                    <Route path="/account" element={<Account user={user!} refreshUser={refreshUser} />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </ErrorBoundary>
  );
};

export default App;