import React, { useState, useEffect, useMemo } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Globe, Info, ChevronDown, ChevronUp, Facebook, Instagram, CheckCircle2, FileText, User, Layers, Play, Monitor, LayoutGrid, Eye, Sparkles, Building2, BarChart3, MapPin, Zap, Download, Save, ShieldCheck, Clock, TrendingUp, Calendar, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  group: any[]; 
  type: 'meta' | 'tiktok' | undefined;
}

// --- Helper Components ---

const AIAnalysisSection = () => {
    return (
        <div className="mb-6 p-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 flex items-center gap-4">
            <div className="flex-shrink-0 p-2.5 bg-white rounded-lg shadow-sm text-brand-600 border border-brand-100">
                <Sparkles className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    AI Performance Insights
                    <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-brand-200">Coming Soon</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                    Advanced copy analysis and viral scoring models are currently in training.
                </p>
            </div>
        </div>
    );
};

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    // Auto-open if children exist effectively? logic handled by parent usually, but simple toggle here
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-900 text-sm">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-white border-t border-gray-200 text-sm">
                    {children}
                </div>
            )}
        </div>
    );
};

const formatReach = (num?: number | null) => {
    if (num === undefined || num === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
};

const formatFollowerCount = (num?: number) => {
    if (!num) return '';
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

// --- Helper: Data Normalization (The Fix) ---
// Diese Funktion extrahiert Daten egal ob sie "clean" oder "raw" sind
const normalizeAdData = (ad: any) => {
    // 1. Snapshot & Basics
    const snapshot = ad.snapshot || {};
    const pageName = ad.page_name || snapshot.page_name || "Unknown";
    
    // 2. Targeting & Demographics Extraction
    // Wir suchen in dieser Reihenfolge: ad.demographics (clean), aaa_info (raw), transparency (raw)
    let demographics = ad.demographics || [];
    let locations: string[] = ad.targeting?.locations || [];
    let reach = ad.reach || ad.eu_total_reach || 0;
    
    // Raw Data Sources
    const rawInfo = ad.aaa_info || ad.transparency_by_location?.eu_transparency;

    if (rawInfo) {
        // Wenn wir noch keine Demografie haben, holen wir sie aus den Rohdaten
        if (!demographics || demographics.length === 0) {
            demographics = rawInfo.age_country_gender_reach_breakdown || [];
        }
        
        // Wenn wir noch keine Locations haben
        if (locations.length === 0 && rawInfo.location_audience) {
            locations = rawInfo.location_audience.map((l: any) => l.name);
        }

        // Wenn wir noch keine Reichweite haben
        if (!reach) {
            reach = rawInfo.eu_total_reach || 0;
        }
    }

    // 3. Regionen für Tabs
    // Wir erstellen künstliche "Regionen" Daten wenn wir Rohdaten haben aber keine transparency_regions
    let regions = ad.transparency_regions || [];
    if (regions.length === 0 && rawInfo) {
        regions = [{
            region: "European Union",
            description: "Data from EU Transparency records.",
            breakdown: demographics.flatMap((d: any) => {
                 // Flatten the breakdown for the table view
                 return d.age_gender_breakdowns.map((b: any) => ({
                     location: d.country,
                     age_range: b.age_range,
                     gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'), // Simple heuristic
                     reach: (b.male || 0) + (b.female || 0) + (b.unknown || 0)
                 }));
            })
        }];
    }

    return {
        ...ad,
        page_name: pageName,
        snapshot,
        demographics,
        derived_locations: locations,
        derived_reach: reach,
        derived_regions: regions,
        // Fallback for genders/ages if not in targeting
        derived_ages: ad.targeting?.ages || (rawInfo?.age_audience ? [`${rawInfo.age_audience.min}-${rawInfo.age_audience.max}`] : ['18-65+']),
        derived_genders: ad.targeting?.genders || (rawInfo?.gender_audience ? [rawInfo.gender_audience] : ['All'])
    };
};

interface MetaAdDetailViewProps {
    ad: any; // Using any to handle raw + clean mix safely inside
    group: any[];
    isActiveView: boolean;
    openTabs: string[];
    activeTabId: string;
    onOpenAd: (id: string) => void;
    onSave: (ad: MetaAd) => void;
    onRemove: () => void;
    isSaved: boolean;
}

const MetaAdDetailView: React.FC<MetaAdDetailViewProps> = ({ 
    ad: rawAd, group, isActiveView, openTabs, activeTabId, onOpenAd, onSave, onRemove, isSaved 
}) => {
    // Normalize Data on the fly
    const ad = useMemo(() => normalizeAdData(rawAd), [rawAd]);
    
    const [activeRegionIndex, setActiveRegionIndex] = useState(0);

    // Sorted Siblings Logic
    const sortedSiblings = useMemo(() => {
        return [...group].sort((a, b) => {
            const aOpen = openTabs.includes(a.id);
            const bOpen = openTabs.includes(b.id);
            if (aOpen === bOpen) return 0;
            return aOpen ? -1 : 1;
        });
    }, [group, openTabs]);

    const { snapshot, advertiser_info, about_disclaimer, beneficiary_payer } = ad;
    const hasVideo = snapshot?.videos && snapshot.videos.length > 0;
    const mediaUrl = hasVideo ? snapshot?.videos[0].video_hd_url : (snapshot?.images?.length > 0 ? snapshot?.images[0].resized_image_url : null);
    const platforms = ad.publisher_platform || [];
    
    // Use derived data
    const regions = ad.derived_regions;
    const hasMultipleRegions = regions.length > 0;
    
    // Determine what to show in the targeting table
    const activeBreakdown = hasMultipleRegions && regions[activeRegionIndex]?.breakdown 
        ? regions[activeRegionIndex].breakdown 
        : [];

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
            {/* Left Column: Creative */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 p-6">
                <div className="space-y-6 max-w-lg mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                {ad.avatar ? <img src={ad.avatar} alt="" className="w-full h-full object-cover"/> : ad.page_name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-semibold text-gray-900 text-sm">{ad.page_name}</h4>
                                 <p className="text-xs text-gray-500">Sponsored</p>
                             </div>
                        </div>

                        <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap">{snapshot.body?.text}</div>

                        <div className="w-full bg-black flex justify-center items-center bg-gray-100 min-h-[200px]">
                            {mediaUrl ? (
                                hasVideo ? (
                                    <video src={mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                                ) : (
                                    <img src={mediaUrl} alt="Ad" className="w-full h-auto object-cover" />
                                )
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center"><Play className="w-8 h-8 mb-2"/><span className="text-xs">No Preview</span></div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                             <span className="text-xs text-gray-500 uppercase font-medium ml-2 truncate max-w-[150px]">{snapshot.link_url ? new URL(snapshot.link_url).hostname : ''}</span>
                             <a href={snapshot.link_url} target="_blank" rel="noreferrer" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded transition-colors">
                                 {snapshot.cta_text || 'Learn More'}
                             </a>
                        </div>
                    </div>

                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm flex items-center justify-between">
                        <span className="text-sm font-medium opacity-90">Library ID</span>
                        <span className="font-mono font-bold tracking-wide">{ad.id.split('_')[1] || ad.id}</span>
                    </div>

                    {group.length > 1 && (
                        <div className="pt-4 border-t border-gray-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Switch Version</h4>
                            <div className="space-y-3">
                                {sortedSiblings.map((sibling: any) => {
                                    const isActive = sibling.id === activeTabId;
                                    const isOpened = openTabs.includes(sibling.id);
                                    return (
                                        <div key={sibling.id} onClick={() => onOpenAd(sibling.id)} className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${isActive ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                            <div className="w-10 h-10 rounded border bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                                {sibling.snapshot?.images?.[0] ? <img src={sibling.snapshot.images[0].resized_image_url} className="w-full h-full object-cover rounded"/> : <Play className="w-4 h-4 text-gray-400"/>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between"><span className="text-xs font-bold">ID: {sibling.id.split('_')[1]}</span>{isActive && <CheckCircle2 className="w-3 h-3 text-brand-600"/>}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(sibling.start_date || sibling.start_date_formatted).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ad Details</h2>
                <AIAnalysisSection />

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1"><BarChart3 className="w-4 h-4" /><span className="text-xs font-bold uppercase">Reach</span></div>
                        <div className="text-2xl font-bold text-indigo-900">{formatReach(ad.derived_reach)}</div>
                    </div>
                     <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                        <div className="flex items-center gap-2 text-purple-600 mb-1"><Monitor className="w-4 h-4" /><span className="text-xs font-bold uppercase">Platforms</span></div>
                        <div className="flex flex-wrap gap-1 mt-1">
                             {platforms.map((p:string) => <span key={p} className="text-[10px] uppercase bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-800">{p.replace('IG','Instagram').replace('FB','Facebook')}</span>)}
                        </div>
                    </div>
                </div>

                {/* Targeting & Demographics Section - FIXED LOGIC */}
                <CollapsibleSection title="Targeting & Demographics" icon={Globe} defaultOpen={true}>
                     <div className="space-y-6">
                         
                         {/* Region Switcher */}
                         {hasMultipleRegions && (
                             <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mb-4">
                                 {regions.map((regionData: any, idx: number) => (
                                     <button key={idx} onClick={() => setActiveRegionIndex(idx)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${activeRegionIndex === idx ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                                         {regionData.region || `Region ${idx + 1}`}
                                     </button>
                                 ))}
                             </div>
                         )}

                         {/* Basic Targeting Info */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                 <div className="text-xs text-gray-500 font-medium mb-1">Ages</div>
                                 <div className="font-semibold text-gray-900">{ad.derived_ages.join(', ')}</div>
                             </div>
                             <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                 <div className="text-xs text-gray-500 font-medium mb-1">Gender</div>
                                 <div className="font-semibold text-gray-900">{ad.derived_genders.join(', ')}</div>
                             </div>
                         </div>

                         {/* Locations List */}
                         {ad.derived_locations.length > 0 && (
                             <div>
                                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Locations ({ad.derived_locations.length})</h4>
                                 <div className="flex flex-wrap gap-1.5">
                                     {ad.derived_locations.slice(0, 10).map((loc: string, i: number) => (
                                         <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">{loc}</span>
                                     ))}
                                     {ad.derived_locations.length > 10 && <span className="px-2 py-1 text-gray-500 text-xs">+{ad.derived_locations.length - 10} more</span>}
                                 </div>
                             </div>
                         )}

                         {/* Visual Demographics (Charts) */}
                         {ad.demographics.length > 0 && (
                             <div>
                                 <h4 className="text-sm font-bold text-gray-800 mb-3 mt-4">Audience Breakdown</h4>
                                 <div className="space-y-4">
                                     {ad.demographics.slice(0, 3).map((countryData: any, i: number) => (
                                        <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                            <p className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><MapPin className="w-3 h-3"/> {countryData.country}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {countryData.age_gender_breakdowns.slice(0, 4).map((d: any, j: number) => {
                                                    const total = (d.male || 0) + (d.female || 0) + (d.unknown || 0);
                                                    if (total === 0) return null;
                                                    const femalePct = Math.round(((d.female || 0) / total) * 100);
                                                    return (
                                                        <div key={j} className="flex flex-col text-xs bg-white p-1.5 rounded border border-gray-100 shadow-sm">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="text-gray-500 font-medium">{d.age_range}</span>
                                                                <span className="text-gray-900 font-bold">{total}</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                                                                <div style={{width: `${femalePct}%`}} className="bg-pink-400 h-full" />
                                                                <div style={{width: `${100-femalePct}%`}} className="bg-blue-400 h-full" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                         
                         {/* Detailed Reach Table (Fallback/Complement) */}
                         {activeBreakdown.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Detailed Reach Data</h4>
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2">Loc</th>
                                                <th className="px-3 py-2">Age</th>
                                                <th className="px-3 py-2">Gen</th>
                                                <th className="px-3 py-2 text-right">Reach</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {activeBreakdown.map((item: any, idx: number) => (
                                                <tr key={idx} className="bg-white hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-900">{item.location}</td>
                                                    <td className="px-3 py-2 text-gray-500">{item.age_range}</td>
                                                    <td className="px-3 py-2 text-gray-500">{item.gender}</td>
                                                    <td className="px-3 py-2 text-gray-900 text-right font-medium">{formatReach(item.reach)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                         )}
                     </div>
                </CollapsibleSection>

                {/* Advertiser & Disclaimer (Standard) */}
                <CollapsibleSection title="About the advertiser" icon={ShieldCheck} defaultOpen={false}>
                    <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg border border-gray-100 flex-shrink-0">
                            {ad.page_name.charAt(0)}
                         </div>
                         <div className="font-bold text-gray-900">{ad.page_name}</div>
                    </div>
                    {advertiser_info?.about_text && <div className="text-sm text-gray-600 leading-relaxed">{advertiser_info.about_text}</div>}
                </CollapsibleSection>

                {/* Footer */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm"><Download className="w-4 h-4" /> Download</button>
                    <button onClick={() => isSaved ? onRemove() : onSave(rawAd)} className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm ${isSaved ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}>
                        {isSaved ? <><X className="w-4 h-4" /> Remove</> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, onSave, onRemove, isSaved, group, type }) => {
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('overview');

  // Key to force re-render when group changes significantly
  const groupKey = group && group.length > 0 ? group[0].id || group[0].ad_archive_id : '';

  useEffect(() => {
      if (isOpen && group && group.length > 0) {
           // Direct logic: If 1 ad, open it. If >1, open overview.
           if (group.length > 1 && type === 'meta') {
               setOpenTabs(['overview']);
               setActiveTabId('overview');
           } else {
               // Safe ID access for raw or clean data
               const firstId = group[0].id || group[0].ad_archive_id;
               setOpenTabs([firstId]);
               setActiveTabId(firstId);
           }
      } else {
          setOpenTabs([]);
          setActiveTabId('overview');
      }
  }, [isOpen, groupKey, type]);

  if (!isOpen || !group || group.length === 0 || !type) return null;

  const handleOpenAd = (adId: string) => {
      if (!openTabs.includes(adId)) setOpenTabs(prev => [...prev, adId]);
      setActiveTabId(adId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      const newTabs = openTabs.filter(t => t !== tabId);
      setOpenTabs(newTabs);
      if (activeTabId === tabId) setActiveTabId(newTabs[newTabs.length - 1] || 'overview');
  };

  if (type === 'meta') {
    const showTabs = group.length > 1;
    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header & Tabs */}
                <div className="flex flex-col border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-brand-100 text-brand-700 rounded-lg"><Layers className="w-5 h-5" /></div>
                             <div>
                                <h2 className="text-lg font-bold text-gray-900">{group.length > 1 ? `${group.length} Ad Versions` : 'Ad Details'}</h2>
                                <p className="text-xs text-gray-500">Detailed Analysis</p>
                             </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    {showTabs && (
                        <div className="flex items-end px-6 gap-2 overflow-x-auto no-scrollbar">
                            {openTabs.map(tabId => (
                                <button key={tabId} onClick={() => setActiveTabId(tabId)} className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x border-b-0 flex-shrink-0 ${activeTabId === tabId ? 'bg-white border-gray-200 text-brand-600 shadow-[0_2px_0_0_#fff]' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`} style={{ marginBottom: -1 }}>
                                    {tabId === 'overview' ? <LayoutGrid className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                    {tabId === 'overview' ? 'Overview' : `ID: ${tabId.split('_')[1] || tabId}`}
                                    {tabId !== 'overview' && <span onClick={(e) => handleCloseTab(e, tabId)} className="ml-2 hover:text-red-500"><X className="w-3 h-3" /></span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-white relative">
                    <div className={activeTabId === 'overview' ? "h-full overflow-y-auto p-6 bg-gray-50/50" : "hidden h-full"}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                            {group.map((rawAd: any) => {
                                const ad = normalizeAdData(rawAd); // Normalize for Overview too
                                return (
                                <div key={ad.id} onClick={() => handleOpenAd(ad.id)} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer flex flex-col group relative overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                        <span className={`w-2 h-2 rounded-full ${ad.is_active !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        <span className="text-xs text-gray-500">{new Date(ad.start_date || ad.start_date_formatted).toLocaleDateString()}</span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="flex gap-3">
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                {ad.snapshot?.images?.[0] ? <img src={ad.snapshot.images[0].resized_image_url} className="w-full h-full object-cover" /> : (ad.snapshot?.videos?.[0] ? <video src={ad.snapshot.videos[0].video_preview_image_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs text-gray-400">No Img</div>)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-500 font-semibold uppercase">Reach</div>
                                                <div className="text-xl font-bold text-indigo-600 flex items-center gap-1"><BarChart3 className="w-4 h-4" /> {formatReach(ad.derived_reach)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    {openTabs.filter(id => id !== 'overview').map((tabId) => {
                         const rawAd = group.find((g: any) => (g.id || g.ad_archive_id) === tabId);
                         if (!rawAd) return null;
                         return <MetaAdDetailView key={rawAd.id || rawAd.ad_archive_id} ad={rawAd} group={group} isActiveView={activeTabId === tabId} openTabs={openTabs} activeTabId={activeTabId} onOpenAd={handleOpenAd} onSave={(ad) => onSave && onSave(ad, 'meta')} onRemove={() => onRemove && onRemove()} isSaved={!!isSaved} />;
                    })}
                </div>
            </div>
        </div>
    );
  }

  return null; 
};

export default AdDetailModal;