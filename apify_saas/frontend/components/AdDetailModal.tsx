import React, { useState, useEffect, useMemo } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Globe, Info, ChevronDown, ChevronUp, Users, ShieldCheck, Download, Save, Facebook, Instagram, CheckCircle2, FileText, User, Layers, ExternalLink, Play, Monitor, Hash, LayoutGrid, Eye, ThumbsUp, BarChart3, MapPin, Zap } from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  group: any[]; 
  type: 'meta' | 'tiktok' | undefined;
}

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
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

// --- HELPER: DATEN NORMALISIERUNG (NEU EINGEFÜGT) ---
// Diese Funktion repariert die Daten im Hintergrund, ohne das Design zu ändern
const normalizeAdData = (ad: any) => {
    const snapshot = ad.snapshot || {};
    const pageName = ad.page_name || snapshot.page_name || "Unknown";
    
    // Datenquellen prüfen
    let demographics = ad.demographics || [];
    let locations: string[] = ad.targeting?.locations || [];
    let reach = ad.reach || ad.eu_total_reach || 0;
    
    // Rohdatenquellen (aaa_info oder transparency)
    const rawInfo = ad.aaa_info || ad.transparency_by_location?.eu_transparency;

    if (rawInfo) {
        if (!demographics || demographics.length === 0) {
            demographics = rawInfo.age_country_gender_reach_breakdown || [];
        }
        if (locations.length === 0 && rawInfo.location_audience) {
            locations = rawInfo.location_audience.map((l: any) => l.name);
        }
        if (!reach) {
            reach = rawInfo.eu_total_reach || 0;
        }
    }

    // Regionen für das Dropdown bauen (falls nötig)
    let regions = ad.transparency_regions || [];
    if (regions.length === 0 && rawInfo && demographics.length > 0) {
        regions = [{
            region: "European Union",
            description: "Data from EU Transparency records.",
            breakdown: demographics.flatMap((d: any) => {
                 return d.age_gender_breakdowns.map((b: any) => ({
                     location: d.country,
                     age_range: b.age_range,
                     gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'),
                     reach: (b.male || 0) + (b.female || 0) + (b.unknown || 0)
                 }));
            })
        }];
    }

    return {
        ...ad,
        page_name: pageName,
        snapshot,
        demographics,     // Jetzt korrekt gefüllt
        targeting: {      // Targeting Objekt reparieren
            ...ad.targeting,
            locations: locations
        },
        reach: reach,     // Jetzt korrekt gefüllt
        transparency_regions: regions
    };
};

interface MetaAdDetailViewProps {
    ad: any;
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
    // HIER WIRD DIE MAGIE ANGEWENDET: Daten werden "on the fly" repariert
    const ad = useMemo(() => normalizeAdData(rawAd), [rawAd]);

    const [activeRegionIndex, setActiveRegionIndex] = useState(0);
    const { snapshot, targeting, advertiser_info, transparency_regions, about_disclaimer } = ad;
    const hasVideo = snapshot?.videos && snapshot.videos.length > 0;
    const mediaUrl = hasVideo ? snapshot?.videos[0].video_hd_url : (snapshot?.images?.length > 0 ? snapshot?.images[0].resized_image_url : null);
    const platforms = ad.publisher_platform || [];
    
    const regions = transparency_regions || [];
    const hasMultipleRegions = regions.length > 0;
    
    // Fallback: Nutze Regions-Breakdown wenn keine Targeting-Daten da sind
    const activeTargeting = hasMultipleRegions ? regions[activeRegionIndex] : targeting;

    // Viralitätsdaten
    const score = ad.efficiency_score || 0;
    const demoData = ad.demographics || [];

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
            {/* Left Column: Creative */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 p-6">
                <div className="space-y-6 max-w-lg mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                {ad.avatar ? <img src={ad.avatar} className="w-full h-full object-cover" alt="" /> : ad.page_name.charAt(0)}
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
                </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ad Details</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1"><BarChart3 className="w-4 h-4" /><span className="text-xs font-bold uppercase">Reach</span></div>
                        <div className="text-2xl font-bold text-indigo-900">{formatReach(ad.reach)}</div>
                    </div>

                    <div className={`p-4 border rounded-xl ${score > 1 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${score > 1 ? 'text-amber-600' : 'text-gray-500'}`}>
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Viral Score</span>
                        </div>
                        <div className={`text-2xl font-bold ${score > 1 ? 'text-amber-900' : 'text-gray-700'}`}>{score}</div>
                        <div className="text-[10px] text-gray-500 mt-1">Relative Reach</div>
                    </div>
                </div>

                {/* Detail Sections */}
                <CollapsibleSection title="Targeting & Demographics" icon={Globe} defaultOpen={true}>
                     <div className="space-y-6">
                         {/* Region Switcher */}
                         {hasMultipleRegions && (
                             <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mb-4">
                                 {regions.map((regionData: any, idx: number) => (
                                     <button
                                        key={idx}
                                        onClick={() => setActiveRegionIndex(idx)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                            activeRegionIndex === idx 
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                        }`}
                                     >
                                         {regionData.region || `Region ${idx + 1}`}
                                     </button>
                                 ))}
                             </div>
                         )}

                         {/* DEMOGRAFIE VISUALISIERUNG */}
                         {demoData.length > 0 ? (
                             <div>
                                 <h4 className="text-sm font-bold text-gray-800 mb-3">Audience Breakdown</h4>
                                 <div className="space-y-4">
                                     {/* @ts-ignore */}
                                     {demoData.slice(0, 3).map((countryData: any, i: number) => (
                                        <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                            <p className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><MapPin className="w-3 h-3"/> {countryData.country}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* @ts-ignore */}
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
                                                            {/* Simple Bar Chart */}
                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                                                                <div style={{width: `${femalePct}%`}} className="bg-pink-400 h-full" />
                                                                <div style={{width: `${100-femalePct}%`}} className="bg-blue-400 h-full" />
                                                            </div>
                                                            <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                                                                <span>{femalePct}% F</span>
                                                                <span>{100-femalePct}% M</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                     ))}
                                 </div>
                             </div>
                         ) : (
                            <div className="text-sm text-gray-500 italic">No detailed demographics available for this ad.</div>
                         )}
                         
                          {/* Locations List (Fallback) */}
                          {targeting?.locations?.length > 0 && (
                             <div className="mt-4">
                                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Targeted Locations</h4>
                                 <div className="flex flex-wrap gap-1.5">
                                     {targeting.locations.slice(0, 10).map((loc: string, i: number) => (
                                         <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">{loc}</span>
                                     ))}
                                     {targeting.locations.length > 10 && <span className="px-2 py-1 text-gray-500 text-xs">+{targeting.locations.length - 10} more</span>}
                                 </div>
                             </div>
                         )}

                     </div>
                </CollapsibleSection>

                {about_disclaimer && (
                    <CollapsibleSection title="About the disclaimer" icon={FileText} defaultOpen={false}>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{about_disclaimer.text}</p>
                        <div className="space-y-3">
                            {about_disclaimer.location && (
                                <div className="flex items-start gap-3">
                                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div><div className="text-xs font-bold text-gray-900 uppercase">Location</div><div className="text-sm text-gray-600">{about_disclaimer.location}</div></div>
                                </div>
                            )}
                            {about_disclaimer.payer && (
                                <div className="flex items-start gap-3">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div><div className="text-xs font-bold text-gray-900 uppercase">Payer</div><div className="text-sm text-gray-600 uppercase">{about_disclaimer.payer}</div></div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                <CollapsibleSection title="About the advertiser" icon={ShieldCheck} defaultOpen={false}>
                    <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-lg border border-gray-100 flex-shrink-0">
                            {ad.page_name.charAt(0)}
                         </div>
                         <div className="font-bold text-gray-900">{ad.page_name}</div>
                    </div>
                    {advertiser_info?.about_text && (
                        <div className="text-sm text-gray-600 leading-relaxed">{advertiser_info.about_text}</div>
                    )}
                </CollapsibleSection>
                
                {/* Footer Actions */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                        <Download className="w-4 h-4" /> Download
                    </button>
                    {isSaved ? (
                        <button onClick={onRemove} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                            <X className="w-4 h-4" /> Remove
                        </button>
                    ) : (
                        <button onClick={() => onSave && onSave(ad)} className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                            <Save className="w-4 h-4" /> Save
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, onSave, onRemove, isSaved, group, type }) => {
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('overview');

  useEffect(() => {
      if (isOpen && group.length > 0) {
           if (group.length > 1 && type === 'meta') {
               setOpenTabs(['overview']);
               setActiveTabId('overview');
           } else {
               const firstId = group[0].id || group[0].ad_archive_id;
               setOpenTabs([firstId]);
               setActiveTabId(firstId);
           }
      } else {
          setOpenTabs([]);
          setActiveTabId('overview');
      }
  }, [isOpen, group, type]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
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
                                const ad = normalizeAdData(rawAd);
                                return (
                                <div key={ad.id} onClick={() => handleOpenAd(ad.id)} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer flex flex-col group relative overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                        <span className={`w-2 h-2 rounded-full ${ad.isActive !== false ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        <span className="text-xs text-gray-500">{new Date(ad.start_date || ad.start_date_formatted).toLocaleDateString()}</span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="flex gap-3">
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                {ad.snapshot?.images?.[0] ? <img src={ad.snapshot.images[0].resized_image_url} className="w-full h-full object-cover" /> : (ad.snapshot?.videos?.[0] ? <div className="flex items-center justify-center h-full bg-black"><Play className="w-6 h-6 text-white" /></div> : null)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-500 font-semibold uppercase">Viral Score</div>
                                                <div className="text-xl font-bold text-amber-600 flex items-center gap-1"><Zap className="w-4 h-4" /> {ad.efficiency_score}</div>
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

  // --- TIKTOK AD RENDER LOGIC (Minimal angepasst) ---
  const ad = group[0] as TikTokAd;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white backdrop-blur-md transition-colors"><X className="w-5 h-5" /></button>
            <div className="w-full md:w-[400px] bg-black flex items-center justify-center relative flex-shrink-0">
                 <div className="relative w-full h-full max-h-full flex items-center justify-center p-4">
                     <img src={ad.videoMeta.coverUrl} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="" />
                     <div className="absolute inset-0 flex items-center justify-center"><a href={ad.webVideoUrl} target="_blank" rel="noreferrer" className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-white/40"><Play className="w-6 h-6 text-white fill-white ml-1" /></a></div>
                 </div>
            </div>
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                     <div className="flex items-center gap-4 mb-6">
                         <img src={ad.authorMeta.avatarUrl} className="w-14 h-14 rounded-full border border-gray-100 bg-gray-50" alt="" />
                         <div><h2 className="text-xl font-bold text-gray-900">{ad.authorMeta.nickName}</h2><a href={ad.authorMeta.profileUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">View Profile <ExternalLink className="w-3 h-3" /></a></div>
                     </div>
                     <div className="text-gray-800 text-lg leading-relaxed mb-8">{ad.text}</div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdDetailModal;