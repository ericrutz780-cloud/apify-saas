import React, { useState, useEffect } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Globe, Info, ChevronDown, ChevronUp, Users, ShieldCheck, Download, Save, Facebook, Instagram, CheckCircle2, FileText, User, Layers, ExternalLink, Play, Monitor, Hash, LayoutGrid, Eye, ThumbsUp } from 'lucide-react';

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

const formatMetric = (num?: number) => {
    if (!num && num !== 0) return 'N/A';
    return new Intl.NumberFormat('de-DE').format(num);
};

const formatFollowerCount = (num?: number) => {
    if (!num) return '';
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

interface MetaAdDetailViewProps {
    ad: MetaAd;
    group: MetaAd[];
    isActiveView: boolean;
    openTabs: string[];
    activeTabId: string;
    onOpenAd: (id: string) => void;
    onSave: (ad: MetaAd) => void;
    onRemove: () => void;
    isSaved: boolean;
}

const MetaAdDetailView: React.FC<MetaAdDetailViewProps> = ({ 
    ad, 
    group, 
    isActiveView, 
    openTabs, 
    activeTabId, 
    onOpenAd, 
    onSave, 
    onRemove, 
    isSaved 
}) => {
    const { snapshot, targeting, advertiser_info, transparency_regions, about_disclaimer } = ad;
    const hasVideo = snapshot?.videos && snapshot.videos.length > 0;
    const mediaUrl = hasVideo ? snapshot?.videos[0].video_hd_url : (snapshot?.images.length > 0 ? snapshot?.images[0].resized_image_url : null);
    const platforms = ad.publisher_platform || [];
    
    // Nimm die erste verfügbare Region oder das generische Targeting
    const activeTargeting = (transparency_regions && transparency_regions.length > 0) ? transparency_regions[0] : targeting;
    
    // Prüfen, ob wir Daten für die EU-Box haben
    const hasTargetingData = (activeTargeting?.locations && activeTargeting.locations.length > 0) || 
                             (activeTargeting?.ages && activeTargeting.ages.length > 0) ||
                             activeTargeting?.reach_estimate || 
                             (activeTargeting?.breakdown && activeTargeting.breakdown.length > 0);

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
            {/* Left Column: Creative */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 p-6">
                <div className="space-y-6 max-w-lg mx-auto">
                    {/* Main Creative Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                {/* @ts-ignore */}
                                {ad.avatar ? <img src={ad.avatar} className="w-full h-full object-cover"/> : ad.page_name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-semibold text-gray-900 text-sm">{ad.page_name}</h4>
                                 <p className="text-xs text-gray-500">Gesponsert • ID: {ad.id.split('_')[1] || ad.id}</p>
                             </div>
                        </div>

                        <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap">
                            {snapshot.body.text}
                        </div>

                        <div className="w-full bg-black">
                            {hasVideo ? (
                                <video src={mediaUrl || ''} controls className="w-full max-h-[500px] object-contain" />
                            ) : (
                                <img src={mediaUrl || ''} alt="Ad" className="w-full h-auto object-cover" />
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                             <span className="text-xs text-gray-500 uppercase font-medium ml-2">{new URL(snapshot.link_url || 'https://example.com').hostname}</span>
                             <a href={snapshot.link_url} target="_blank" rel="noreferrer" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded transition-colors">
                                 {snapshot.cta_text || 'Mehr dazu'}
                             </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Details zur Werbeanzeige</h2>
                
                <div className="mb-6 space-y-4">
                    <div className="flex items-start gap-4">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                             <Info className="w-5 h-5" />
                         </div>
                         <div>
                             <h3 className="font-medium text-gray-900">Status</h3>
                             <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                 <span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                 {ad.isActive ? 'Aktiv' : 'Inaktiv'}
                             </p>
                             <p className="text-xs text-gray-500 mt-1">Start: {new Date(ad.start_date).toLocaleDateString()}</p>
                         </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                         <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                             <Monitor className="w-5 h-5" />
                         </div>
                         <div>
                             <h3 className="font-medium text-gray-900">Plattformen</h3>
                             <div className="flex flex-wrap gap-2 mt-2">
                                 {platforms.map((p: string) => (
                                     <span key={p} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700 capitalize border border-gray-200">
                                         {p.replace('_', ' ')}
                                     </span>
                                 ))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* --- EU TRANSPARENCY SECTION --- */}
                {hasTargetingData && (
                    <CollapsibleSection title="EU-Transparenz & Zielgruppe" icon={Globe} defaultOpen={true}>
                         <div className="space-y-6">
                             {/* Reichweite Zahl */}
                             <div className="p-4 border border-gray-200 rounded-lg bg-slate-50">
                                 <div className="mb-1"><h5 className="text-sm font-bold text-gray-900">Geschätzte Reichweite</h5></div>
                                 <div className="text-3xl font-bold text-gray-900">{formatMetric(activeTargeting?.reach_estimate)}</div>
                                 <div className="text-xs text-gray-500 mt-1">Nutzer in der EU, die diese Anzeige gesehen haben.</div>
                             </div>

                             {/* Breakdown Table */}
                             {activeTargeting?.breakdown && activeTargeting.breakdown.length > 0 && (
                                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                                     <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                         <h5 className="text-xs font-bold text-gray-500 uppercase">Aufschlüsselung</h5>
                                     </div>
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-white text-gray-500 font-medium border-b border-gray-100">
                                             <tr>
                                                 <th className="px-4 py-2">Standort</th>
                                                 <th className="px-4 py-2">Alter</th>
                                                 <th className="px-4 py-2">Geschlecht</th>
                                                 <th className="px-4 py-2 text-right">Reichweite</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-50">
                                             {activeTargeting.breakdown.map((item: any, idx: number) => (
                                                 <tr key={idx} className="bg-white">
                                                     <td className="px-4 py-2 text-gray-900">{item.location || 'N/A'}</td>
                                                     <td className="px-4 py-2 text-gray-500">{item.age_range || 'Alle'}</td>
                                                     <td className="px-4 py-2 text-gray-500">{item.gender || 'Alle'}</td>
                                                     <td className="px-4 py-2 text-gray-900 text-right font-medium">{formatMetric(item.reach)}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 </div>
                             )}

                             {/* Fallback Liste wenn keine Tabelle da ist */}
                             {(!activeTargeting?.breakdown || activeTargeting.breakdown.length === 0) && (
                                 <div className="space-y-3">
                                     <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                         <span className="text-gray-500">Standorte</span>
                                         <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                                             {activeTargeting?.locations?.join(', ') || 'Nicht verfügbar'}
                                         </span>
                                     </div>
                                     <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                         <span className="text-gray-500">Alter</span>
                                         <span className="font-medium text-gray-900">{activeTargeting?.ages?.join(', ') || 'Alle'}</span>
                                     </div>
                                     <div className="flex justify-between text-sm">
                                         <span className="text-gray-500">Geschlecht</span>
                                         <span className="font-medium text-gray-900">{activeTargeting?.genders?.join(', ') || 'Alle'}</span>
                                     </div>
                                 </div>
                             )}
                         </div>
                    </CollapsibleSection>
                )}

                <CollapsibleSection title="Infos zum Werbetreibenden" icon={ShieldCheck} defaultOpen={!hasTargetingData}>
                    <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg border border-gray-200 overflow-hidden">
                            {/* @ts-ignore */}
                            {ad.avatar ? <img src={ad.avatar} className="w-full h-full object-cover"/> : ad.page_name.charAt(0)}
                         </div>
                         <div className="font-bold text-gray-900 text-base">{ad.page_name}</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                       {ad.disclaimer && (
                           <div className="text-gray-600">
                               <span className="font-semibold text-gray-900">Disclaimer:</span> {ad.disclaimer}
                           </div>
                       )}
                       {ad.page_categories && ad.page_categories.length > 0 && (
                           <div className="text-gray-600">
                               <span className="font-semibold text-gray-900">Kategorie:</span> {ad.page_categories.join(', ')}
                           </div>
                       )}
                       <div className="text-gray-500 text-xs mt-2">ID: {ad.id}</div>
                    </div>
                </CollapsibleSection>

                <div className="pt-6 mt-6 border-t border-gray-100">
                    {isSaved ? (
                        <button onClick={onRemove} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors">
                            <X className="w-4 h-4" /> Entfernen
                        </button>
                    ) : (
                        // FIX: Hier übergeben wir jetzt nur noch EIN Argument (ad).
                        // Das behebt den Fehler "Expected 1 arguments, but got 2"
                        <button onClick={() => onSave && onSave(ad)} className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all">
                            <Save className="w-4 h-4" /> In Bibliothek speichern
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Modal Component
const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, onSave, onRemove, isSaved, group, type }) => {
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('overview');

  useEffect(() => {
      if (isOpen && group && group.length > 0) {
           if (group.length > 1 && type === 'meta') {
               setOpenTabs(['overview']);
               setActiveTabId('overview');
           } else {
               const firstId = group[0].id;
               setOpenTabs([firstId]);
               setActiveTabId(firstId);
           }
      } else {
          setOpenTabs([]);
          setActiveTabId('overview');
      }
  }, [isOpen, group, type]);

  if (!isOpen || !group || group.length === 0 || !type) return null;

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleOpenAd = (adId: string) => {
      if (!openTabs.includes(adId)) {
          setOpenTabs(prev => [...prev, adId]);
      }
      setActiveTabId(adId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      const newTabs = openTabs.filter(t => t !== tabId);
      setOpenTabs(newTabs);
      if (activeTabId === tabId) {
          setActiveTabId(newTabs[newTabs.length - 1] || 'overview');
      }
  };

  if (type === 'meta') {
    const showTabs = group.length > 1; 
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
            
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={handleContentClick}
            >
                {/* Header */}
                <div className="flex flex-col border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
                                <Layers className="w-5 h-5" />
                             </div>
                             <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {group.length > 1 ? `${group.length} Ad Versionen` : 'Anzeigendetails'}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {group.length > 1 ? 'Gleicher Text • Unterschiedliches Targeting/Datum' : 'Detaillierte Analyse'}
                                </p>
                             </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {showTabs && (
                        <div className="flex items-end px-6 gap-2 overflow-x-auto no-scrollbar">
                            {openTabs.map(tabId => {
                                if (tabId === 'overview') {
                                    return (
                                        <button 
                                            key="overview"
                                            onClick={() => setActiveTabId('overview')}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x border-b-0 flex-shrink-0 ${
                                                activeTabId === 'overview' 
                                                ? 'bg-white border-gray-200 text-brand-600 shadow-[0_2px_0_0_#fff]' 
                                                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                            }`}
                                            style={{ marginBottom: -1 }}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                            Übersicht
                                        </button>
                                    );
                                }
                                
                                const isTabActive = activeTabId === tabId;
                                return (
                                    <button 
                                        key={tabId}
                                        onClick={() => setActiveTabId(tabId)}
                                        className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x border-b-0 relative pr-9 flex-shrink-0 ${
                                            isTabActive
                                            ? 'bg-white border-gray-200 text-brand-600 shadow-[0_2px_0_0_#fff]' 
                                            : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
                                        }`}
                                        style={{ marginBottom: -1 }}
                                    >
                                        <Hash className="w-4 h-4" />
                                        ID: {tabId.split('_')[1] || tabId}
                                        <span onClick={(e) => handleCloseTab(e, tabId)} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-300 text-gray-400 hover:text-gray-700">
                                            <X className="w-3 h-3" />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-white relative">
                    <div className={activeTabId === 'overview' ? "h-full overflow-y-auto p-6 bg-gray-50/50" : "hidden h-full"}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                            {group.map((ad: MetaAd) => {
                                const estReach = ad.targeting?.reach_estimate;
                                
                                return (
                                    <div 
                                        key={ad.id} 
                                        onClick={() => handleOpenAd(ad.id)}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <span className="text-xs font-semibold text-gray-700">{ad.isActive ? 'Aktiv' : 'Inaktiv'}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{new Date(ad.start_date).toLocaleDateString()}</span>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block mb-0.5">Library ID</span>
                                                    <span className="font-mono font-bold text-brand-600 text-sm flex items-center gap-1">
                                                        <Hash className="w-3 h-3" />
                                                        {ad.id.split('_')[1] || ad.id}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                    {ad.snapshot.videos?.length > 0 ? (
                                                        <div className="w-full h-full bg-black flex items-center justify-center"><Play className="w-6 h-6 text-white" /></div>
                                                    ) : (
                                                        <img src={ad.snapshot.images[0]?.resized_image_url} className="w-full h-full object-cover" alt="" />
                                                    )}
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center gap-1">
                                                        <div className="text-[10px] text-gray-500 font-semibold uppercase">Reichweite</div>
                                                        <div className="text-xl font-bold text-gray-900 flex items-center gap-1">
                                                            {estReach ? formatMetric(estReach) : 'N/A'}
                                                            <Users className="w-3 h-3 text-gray-400" />
                                                        </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 border-t border-gray-100">
                                            <button className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:border-brand-200 transition-colors flex items-center justify-center gap-2">
                                                Details ansehen <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {openTabs.filter(id => id !== 'overview').map((tabId) => {
                         const ad = group.find(g => g.id === tabId);
                         if (!ad) return null;
                         return (
                            <MetaAdDetailView
                                key={ad.id}
                                ad={ad}
                                group={group}
                                isActiveView={activeTabId === ad.id}
                                openTabs={openTabs}
                                activeTabId={activeTabId}
                                onOpenAd={handleOpenAd}
                                // FIX: Der zweite Parameter 'meta' wurde entfernt
                                onSave={(ad) => onSave && onSave(ad, 'meta')}
                                onRemove={() => onRemove && onRemove()}
                                isSaved={!!isSaved}
                            />
                         );
                    })}
                </div>
            </div>
        </div>
    );
  }

  // Fallback for TikTok
  const currentAd = group.find(ad => ad.id === activeTabId) || group[0];
  if (!currentAd) return null;
  const tikTokAd = currentAd as TikTokAd;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={handleContentClick}>
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full text-gray-500 hover:text-gray-900 shadow-sm border border-gray-200"><X className="w-5 h-5" /></button>
            <div className="w-full md:w-5/12 bg-black flex items-center justify-center relative overflow-hidden">
                 <div className="relative w-full h-full">
                     <img src={tikTokAd.videoMeta.coverUrl} className="w-full h-full object-cover blur-sm opacity-50 absolute" />
                     <img src={tikTokAd.videoMeta.coverUrl} className="w-full h-full object-contain relative z-10" />
                 </div>
            </div>
            <div className="w-full md:w-7/12 bg-white p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{tikTokAd.authorMeta.nickName}</h2>
                <p className="text-sm text-gray-600 mb-4">{tikTokAd.text}</p>
                <a href={tikTokAd.webVideoUrl} target="_blank" rel="noreferrer" className="block w-full bg-black text-white text-center py-3 rounded-lg font-bold">Auf TikTok ansehen</a>
            </div>
        </div>
    </div>
  );
};

export default AdDetailModal;