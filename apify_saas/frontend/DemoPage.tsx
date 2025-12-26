import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, ArrowRight, Filter, LayoutGrid, ChevronDown, RefreshCw, CheckCircle2 } from 'lucide-react';
import MetaAdCard from './components/MetaAdCard';
import CountrySelector from './components/CountrySelector';
import { LeadCaptureModal } from './components/LeadCaptureModal';

// --- CONFIG ---
// Wir nutzen hier direkt die API URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const CLEAN_BASE_URL = BASE_URL.replace(/\/$/, '');
// WICHTIG: Neuer Pfad für Demo
const DEMO_API_URL = `${CLEAN_BASE_URL}/api/v1/demo`;

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' }
];

type SortOption = 'viral_score' | 'reach' | 'recency';

// Englische Phasen für den Balken
const LOADING_PHASES = [
    { progress: 10, text: "Connecting to Ad Library..." },
    { progress: 30, text: "Scraping active creatives..." },
    { progress: 60, text: "Analyzing engagement metrics..." },
    { progress: 85, text: "Calculating viral scores..." },
    { progress: 95, text: "Finalizing report..." }
];

export const DemoPage = () => {
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('DE');
    
    // Loading States
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [phaseText, setPhaseText] = useState("");
    
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('viral_score');
    const [errorMsg, setErrorMsg] = useState('');

    // --- PROGRESS BAR LOGIC ---
    useEffect(() => {
        let interval: any;
        if (loading) {
            setProgress(5);
            setPhaseText(LOADING_PHASES[0].text);
            
            interval = setInterval(() => {
                setPhaseText(prev => {
                    const currentPhase = LOADING_PHASES.find(p => p.progress >= (progress + 5));
                    return currentPhase ? currentPhase.text : prev;
                });

                setProgress(old => {
                    // Verlangsamen gegen Ende
                    const increment = old < 50 ? 4 : old < 80 ? 2 : 0.2;
                    return old >= 98 ? 98 : old + increment;
                });
            }, 500);
        } else {
            setProgress(0);
        }
        return () => clearInterval(interval);
    }, [loading, progress]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        setErrorMsg('');
        setResults([]);

        // Payload für den NEUEN Demo-Router
        const payload = {
            keyword: query,
            country: country,
            limit: 30 // <--- Dies wird jetzt vom Backend respektiert!
        };

        try {
            // Fetch an den neuen Demo-Endpunkt
            const response = await fetch(`${DEMO_API_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server Error: ${response.status}`);
            }

            const responseBody = await response.json();
            const rawAds = responseBody.data || [];
            
            // 100% Progress setzen
            setProgress(100);
            setPhaseText("Done!");
            
            // Kurze Verzögerung für UX
            setTimeout(() => {
                setResults(rawAds);
                setLoading(false);
            }, 400);

        } catch (error: any) {
            console.error("Demo Search Error:", error);
            setErrorMsg("Search failed. Please try again later.");
            setLoading(false);
        }
    };

    const sortedResults = useMemo(() => {
        if (!results.length) return [];
        const sorted = [...results];
        return sorted.sort((a, b) => {
            const getScore = (item: any) => item.efficiency_score || 0;
            const getReach = (item: any) => item.targeting?.reach_estimate || 0;
            const getDate = (item: any) => new Date(item.start_date).getTime();

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
            
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            StellaAds <span className="text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 text-xs font-bold uppercase tracking-wider">Demo</span>
                        </h1>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 w-full">
                        {/* Search Input */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                                type="text" 
                                value={query} 
                                onChange={(e) => setQuery(e.target.value)} 
                                placeholder="Brand or Niche (e.g. Huel, Skincare)" 
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-xl outline-none transition-all shadow-inner sm:shadow-none text-base" 
                            />
                        </div>
                        
                        {/* Controls Group */}
                        <div className="flex flex-row gap-2 shrink-0">
                            <div className="w-[140px] shrink-0">
                                <CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading || !query} 
                                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20 active:scale-95 transition-all flex-1 md:flex-none md:w-auto"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            </button>
                        </div>
                    </form>

                    {/* PROGRESS BAR */}
                    {loading && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {phaseText}
                                </span>
                                <span className="text-xs font-medium text-gray-500">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-brand-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMsg && !loading && (
                        <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> {errorMsg}
                        </div>
                    )}

                    {/* Filters & Sorting */}
                    {hasSearched && !errorMsg && !loading && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap no-scrollbar pb-1">
                                <span className="flex items-center bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium">
                                    <LayoutGrid className="w-3 h-3 mr-1.5 text-gray-400" /> Meta Only
                                </span>
                                <span className="flex items-center bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium">
                                    <Filter className="w-3 h-3 mr-1.5 text-gray-400" /> Last 30 Days
                                </span>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
                                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Sort by:</span>
                                <div className="relative group w-full sm:w-auto">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="w-full sm:w-auto appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium py-1.5 pl-3 pr-8 rounded-lg cursor-pointer hover:border-brand-300 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
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
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-gray-100 shadow-sm p-4 space-y-4">
                                <div className="h-48 bg-gray-100 rounded-lg"></div>
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : sortedResults.length === 0 && !errorMsg ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="font-medium">No active ads found.</p>
                        <p className="text-sm mt-1">Try searching for a bigger brand (e.g. "Huel", "Gymshark").</p>
                    </div>
                ) : (
                    <>
                         {!errorMsg && (
                             <div className="mb-4 text-sm text-gray-500 font-medium px-1 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Found <span className="text-gray-900 font-bold">{sortedResults.length}</span> active ads
                            </div>
                         )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {sortedResults.map((item: any, idx) => (
                                <div key={idx} className="relative group transition-transform hover:-translate-y-1 duration-300" onClick={() => setShowModal(true)}>
                                    <div className="absolute inset-0 z-20 cursor-pointer bg-transparent" />
                                    <div className="pointer-events-none">
                                        <MetaAdCard ad={item} onClick={() => {}} viewMode="details" />
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