import React, { useState, useMemo } from 'react';
import { Search, Loader2, ArrowRight, Filter, LayoutGrid, ChevronDown, ArrowUpDown } from 'lucide-react';
import MetaAdCard from './components/MetaAdCard';
import CountrySelector from './components/CountrySelector';
import { LeadCaptureModal } from './components/LeadCaptureModal';
// @ts-ignore
import { cleanAndTransformData } from './adAdapter';

// --- CONFIG ---
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, '');
const API_URL = `${CLEAN_BASE_URL}/api/v1`;

// --- FULL COUNTRY LIST (RESTORED) ---
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

type SortOption = 'viral_score' | 'reach' | 'recency';

export const DemoPage = () => {
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('DE');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('viral_score');

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        setResults([]);

        // Calculate Last 30 Days
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // API Payload
        const payload = {
            keyword: query,
            platform: 'meta', // Force Meta
            limit: 30,        // Force Limit
            country: country,
            start_date_min: thirtyDaysAgo.toISOString().split('T')[0],
            start_date_max: today.toISOString().split('T')[0],
            sort_by: 'newest',
            active_status: 'active'
        };

        try {
            // DIRECT FETCH to bypass 'api.ts' user check
            // We use 'demo-user' as ID to satisfy backend requirements if needed
            const response = await fetch(`${API_URL}/search/?user_id=demo-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Search failed");
            }

            const responseBody = await response.json();
            const rawAds = responseBody.data || [];

            // Clean data (pass empty map for benchmarks as we skip fetching them for speed in demo)
            const rowsToTransform = rawAds.map((item: any) => ({ data: item }));
            const cleaned = cleanAndTransformData(rowsToTransform, {});
            
            setResults(cleaned);

        } catch (error) {
            console.error("Demo Search Error", error);
        } finally {
            setLoading(false);
        }
    };

    // Client-Side Sorting
    const sortedResults = useMemo(() => {
        if (!results.length) return [];
        const sorted = [...results];
        
        return sorted.sort((a, b) => {
            const getScore = (item: any) => item.data?.efficiency_score || item.efficiency_score || 0;
            const getReach = (item: any) => item.data?.targeting?.reach_estimate || item.targeting?.reach_estimate || 0;
            const getDate = (item: any) => new Date(item.data?.start_date || item.start_date).getTime();

            switch (sortBy) {
                case 'viral_score': return getScore(b) - getScore(a);
                case 'reach': return getReach(b) - getReach(a);
                case 'recency': return getDate(b) - getDate(a);
                default: return 0;
            }
        });
    }, [results, sortBy]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <LeadCaptureModal isOpen={showModal} onClose={() => setShowModal(false)} />
            
            {/* Header / Search */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            StellaAds <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 text-xs font-bold uppercase tracking-wider">Demo</span>
                        </h1>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={query} 
                                onChange={(e) => setQuery(e.target.value)} 
                                placeholder="Brand or Niche (e.g. Nike, Skincare)" 
                                className="w-full pl-11 pr-4 py-3 bg-gray-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-xl outline-none transition-all shadow-inner sm:shadow-none text-base" 
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="w-full sm:w-[160px] flex-shrink-0">
                                <CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !query} 
                                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center min-w-[60px] shadow-lg shadow-brand-600/20 active:scale-95 transition-all flex-shrink-0"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>

                    {/* Filters & Sorting Bar */}
                    {hasSearched && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap no-scrollbar pb-1">
                                <span className="flex items-center bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium">
                                    <LayoutGrid className="w-3 h-3 mr-1.5 text-gray-400" /> Meta Only
                                </span>
                                <span className="flex items-center bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium">
                                    <Filter className="w-3 h-3 mr-1.5 text-gray-400" /> Last 30 Days
                                </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <span className="text-xs font-medium text-gray-500">Sort by:</span>
                                <div className="relative group">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium py-1.5 pl-3 pr-8 rounded-lg cursor-pointer hover:border-brand-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
                                    >
                                        <option value="viral_score">🔥 Viral Score</option>
                                        <option value="reach">👀 Reach</option>
                                        <option value="recency">🕒 Newest</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <div className="max-w-5xl mx-auto px-4 mt-6">
                {!hasSearched ? (
                    <div className="text-center py-20 opacity-60">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                        <h3 className="text-lg font-medium text-gray-400">Enter a brand name to start spying.</h3>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-gray-100 shadow-sm p-4 space-y-4">
                                <div className="h-48 bg-gray-100 rounded-lg"></div>
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : sortedResults.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="font-medium">No active ads found.</p>
                        <p className="text-sm mt-1">Try searching for a bigger brand (e.g. "Huel", "Gymshark").</p>
                    </div>
                ) : (
                    <>
                         <div className="mb-4 text-sm text-gray-500 font-medium">
                            Found <span className="text-gray-900 font-bold">{sortedResults.length}</span> active ads
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {sortedResults.map((item: any, idx) => (
                                <div key={idx} className="relative group transition-transform hover:-translate-y-1 duration-300" onClick={() => setShowModal(true)}>
                                    {/* Overlay traps click */}
                                    <div className="absolute inset-0 z-20 cursor-pointer bg-transparent" />
                                    <div className="pointer-events-none">
                                        <MetaAdCard ad={item.data || item} onClick={() => {}} viewMode="details" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};