import React, { useState } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import MetaAdCard from './components/MetaAdCard';
import CountrySelector from './components/CountrySelector';
import { api } from './services/api';
import { LeadCaptureModal } from './components/LeadCaptureModal';

// Kopie deiner Länderliste (oder importiere sie, wenn du sie exportiert hast)
const COUNTRIES = [
    { code: 'DE', name: 'Germany' }, { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' }, { code: 'FR', name: 'France' },
    { code: 'AT', name: 'Austria' }, { code: 'CH', name: 'Switzerland' }
];

export const DemoPage = () => {
    const [query, setQuery] = useState('');
    const [country, setCountry] = useState('DE');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        setResults([]);

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        try {
            const response = await api.runSearch({
                query: query,
                platform: 'meta',
                country: country,
                limit: 30,
                startDateMin: thirtyDaysAgo.toISOString().split('T')[0],
                startDateMax: today.toISOString().split('T')[0]
            });
            // Falls deine API Struktur 'metaAds' zurückgibt:
            setResults(response.metaAds || []);
        } catch (error) {
            console.error("Demo Search Error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <LeadCaptureModal isOpen={showModal} onClose={() => setShowModal(false)} />
            
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
                    <h1 className="text-xl font-bold text-gray-900 mb-4">AdSpyre <span className="text-brand-600 bg-brand-50 px-2 rounded border border-brand-100 text-sm align-middle">DEMO</span></h1>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Marke (z.B. Nike, Adidas)" className="w-full pl-11 pr-4 py-3 bg-gray-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-xl outline-none transition-all" />
                        </div>
                        <div className="flex gap-2">
                            <div className="w-[140px] flex-shrink-0"><CountrySelector value={country} onChange={setCountry} countries={COUNTRIES} /></div>
                            <button type="submit" disabled={loading || !query} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center min-w-[60px] shadow-lg shadow-brand-600/20">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}</button>
                        </div>
                    </form>
                    {hasSearched && <div className="flex items-center gap-3 mt-3 text-xs text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded border">Meta Only</span><span className="bg-gray-100 px-2 py-1 rounded border">Letzte 30 Tage</span></div>}
                </div>
            </div>

            {/* Results Grid */}
            <div className="max-w-5xl mx-auto px-4 mt-6">
                {!hasSearched ? (
                    <div className="text-center py-20 opacity-60"><div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div><h3 className="text-lg font-medium text-gray-400">Gib einen Brand-Namen ein, um zu starten.</h3></div>
                ) : loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-gray-100"></div>)}</div>
                ) : results.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">Keine Ads gefunden.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {results.map((item: any, idx) => (
                            <div key={idx} className="relative group" onClick={() => setShowModal(true)}>
                                {/* Das Overlay hier blockiert jeden Klick auf die Karte und öffnet das Modal */}
                                <div className="absolute inset-0 z-20 cursor-pointer bg-transparent" />
                                <div className="pointer-events-none">
                                    {/* Wir nutzen deine existierende MetaAdCard, aber deaktiviert */}
                                    <MetaAdCard ad={item.data || item} onClick={() => {}} viewMode="details" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};