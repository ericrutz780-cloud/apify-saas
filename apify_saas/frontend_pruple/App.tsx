import React, { useState, useMemo } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AdCard } from './components/AdCard';
import { DetailModal } from './components/DetailModal';
import { searchAdsWithGemini } from './services/adService';
import { Ad, Platform, SortOption, FilterState } from './types';
import { Search, LayoutGrid, Bookmark, Filter, ArrowUpDown, Loader2, Facebook, Smartphone } from 'lucide-react';

// --- Sub-components defined here for single-file integration ease where appropriate ---

const FilterBadge = ({ label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1 rounded-md text-xs font-semibold border transition ${
      active 
        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

// --- Main App Component ---

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'SAVED'>('SEARCH');
  const [searchPlatform, setSearchPlatform] = useState<Platform>('META');
  
  // Search State
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('US');
  const [limit, setLimit] = useState(6);
  const [results, setResults] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter State
  const [filterState, setFilterState] = useState<FilterState>({ sortBy: 'RECENCY', format: 'ALL' });
  const [showFilters, setShowFilters] = useState(false);

  // Saved Ads State
  const [savedAds, setSavedAds] = useState<Ad[]>([]);

  // Modal State
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setHasSearched(true);
    // Reset filters on new search
    setFilterState({ sortBy: 'RECENCY', format: 'ALL' });
    
    // Call Service
    const ads = await searchAdsWithGemini(keyword, searchPlatform, limit);
    setResults(ads);
    setLoading(false);
  };

  const toggleSaved = (ad: Ad) => {
    const exists = savedAds.find(a => a.id === ad.id);
    if (exists) {
      setSavedAds(savedAds.filter(a => a.id !== ad.id));
    } else {
      setSavedAds([...savedAds, ad]);
    }
  };

  const openAdDetail = (ad: Ad) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
  };

  // --- Filtering & Sorting Logic ---
  const displayedAds = useMemo(() => {
    let list = activeTab === 'SEARCH' ? results : savedAds;

    // Filter by Format
    if (filterState.format !== 'ALL') {
      list = list.filter(ad => ad.format === filterState.format);
    }

    // Sort
    return [...list].sort((a, b) => {
      switch (filterState.sortBy) {
        case 'RECENCY': return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'LIKES': return b.likes - a.likes;
        case 'SHARES': return b.shares - a.shares;
        case 'VIEWS': return b.views - a.views;
        case 'IMPRESSIONS': return b.impressions - a.impressions;
        case 'SPEND': return b.spend - a.spend;
        default: return 0;
      }
    });
  }, [results, savedAds, activeTab, filterState]);

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
               <LayoutGrid className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">AdSpy Pro</span>
          </div>
          
          <nav className="flex items-center bg-gray-100 p-1 rounded-full">
            <button 
              onClick={() => setActiveTab('SEARCH')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'SEARCH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Search
            </button>
            <button 
              onClick={() => setActiveTab('SAVED')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'SAVED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Saved Assets ({savedAds.length})
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-sm" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'SEARCH' ? (
          <div className="space-y-8">
            {/* Platform Selector (Unified Segmented Control) */}
            <div className="flex justify-center">
              <div className="bg-gray-100 p-1.5 rounded-xl flex w-full max-w-md shadow-inner">
                <button 
                  onClick={() => setSearchPlatform('META')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                    searchPlatform === 'META' 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Facebook className="w-4 h-4" />
                  Meta Ads
                </button>
                <button 
                  onClick={() => setSearchPlatform('TIKTOK')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                    searchPlatform === 'TIKTOK' 
                      ? 'bg-white text-pink-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  TikTok Ads
                </button>
              </div>
            </div>

            {/* Search Input Area */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                   <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Keyword</label>
                   <input 
                    type="text" 
                    placeholder="e.g. Skin care, Crypto, Gaming" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                   />
                </div>
                
                {searchPlatform === 'META' && (
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Country</label>
                    <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-2">
                   <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Limit</label>
                   <select 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                   >
                      <option value={6}>6 Ads</option>
                      <option value={12}>12 Ads</option>
                      <option value={24}>24 Ads</option>
                   </select>
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button 
                    onClick={handleSearch}
                    disabled={loading || !keyword}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Search className="w-5 h-5"/>}
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Results Area */}
            {hasSearched && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-20 z-20">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Filters:</span>
                    <FilterBadge 
                      label="All Formats" 
                      active={filterState.format === 'ALL'} 
                      onClick={() => setFilterState(s => ({...s, format: 'ALL'}))} 
                    />
                    <FilterBadge 
                      label="Video" 
                      active={filterState.format === 'VIDEO'} 
                      onClick={() => setFilterState(s => ({...s, format: 'VIDEO'}))} 
                    />
                    <FilterBadge 
                      label="Image" 
                      active={filterState.format === 'IMAGE'} 
                      onClick={() => setFilterState(s => ({...s, format: 'IMAGE'}))} 
                    />
                  </div>

                  <div className="flex items-center gap-2 text-gray-700">
                    <ArrowUpDown className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Sort:</span>
                    <select 
                      className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={filterState.sortBy}
                      onChange={(e) => setFilterState(s => ({...s, sortBy: e.target.value as SortOption}))}
                    >
                      <option value="RECENCY">Newest First</option>
                      <option value="LIKES">Most Likes</option>
                      {searchPlatform === 'TIKTOK' && <option value="SHARES">Most Shares</option>}
                      {searchPlatform === 'TIKTOK' && <option value="VIEWS">Most Views</option>}
                      {searchPlatform === 'META' && <option value="IMPRESSIONS">Estimated Reach</option>}
                      {searchPlatform === 'META' && <option value="SPEND">Estimated Spend</option>}
                    </select>
                  </div>
                </div>

                {/* Grid */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                     <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                     <p className="text-gray-500 font-medium">Analyzing ad libraries...</p>
                  </div>
                ) : displayedAds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedAds.map((ad) => (
                      <AdCard 
                        key={ad.id} 
                        ad={ad} 
                        onClick={openAdDetail} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                    No ads found matching your criteria. Try adjusting your filters.
                  </div>
                )}
              </div>
            )}
            
            {!hasSearched && (
              <div className="text-center py-20">
                <div className="inline-block p-6 rounded-full bg-indigo-50 mb-4">
                  <Search className="w-12 h-12 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Spy?</h3>
                <p className="text-gray-500 max-w-md mx-auto">Select a platform and enter a keyword above to uncover high-performing ad creatives.</p>
              </div>
            )}
          </div>
        ) : (
          /* Saved Assets Tab */
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bookmark className="fill-indigo-600 text-indigo-600 w-6 h-6" />
              Saved Library
            </h2>
             {displayedAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedAds.map((ad) => (
                    <AdCard 
                      key={ad.id} 
                      ad={ad} 
                      onClick={openAdDetail} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm">
                   <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-lg font-bold text-gray-800">No saved creatives yet</h3>
                   <p className="text-gray-500">Save ads from your searches to build your swipe file.</p>
                   <button 
                    onClick={() => setActiveTab('SEARCH')}
                    className="mt-6 text-indigo-600 font-medium hover:underline"
                   >
                     Go to Search
                   </button>
                </div>
              )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <DetailModal 
        ad={selectedAd} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(ad) => { toggleSaved(ad); setIsModalOpen(false); }}
        isSaved={!!selectedAd && savedAds.some(a => a.id === selectedAd.id)}
      />

    </div>
  );
};

export default App;