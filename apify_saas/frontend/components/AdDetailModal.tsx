import React, { useState, useEffect } from 'react';
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

const formatReach = (num?: number) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
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
    ad, group, isActiveView, openTabs, activeTabId, onOpenAd, onSave, onRemove, isSaved 
}) => {
    const [activeRegionIndex, setActiveRegionIndex] = useState(0);
    const { snapshot, targeting, advertiser_info, transparency_regions, about_disclaimer } = ad;
    const hasVideo = snapshot?.videos && snapshot.videos.length > 0;
    const mediaUrl = hasVideo ? snapshot?.videos[0].video_hd_url : (snapshot?.images.length > 0 ? snapshot?.images[0].resized_image_url : null);
    const platforms = ad.publisher_platform || [];
    const regions = transparency_regions || [];
    const hasMultipleRegions = regions.length > 0;
    const activeTargeting = hasMultipleRegions ? regions[activeRegionIndex] : targeting;

    // NEU: Viralitätsdaten
    const score = ad.efficiency_score || 0;
    const demoData = ad.demographics || [];

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
            {/* Left Column: Creative */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 p-6">
                <div className="space-y-6 max-w-lg mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                {ad.page_name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-semibold text-gray-900 text-sm">{ad.page_name}</h4>
                                 <p className="text-xs text-gray-500">Sponsored</p>
                             </div>
                        </div>

                        <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap">{snapshot.body.text}</div>

                        <div className="w-full bg-black">
                            {hasVideo ? (
                                <video src={mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                            ) : (
                                <img src={mediaUrl} alt="Ad" className="w-full h-auto object-cover" />
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                             <span className="text-xs text-gray-500 uppercase font-medium ml-2">{new URL(snapshot.link_url || 'https://example.com').hostname}</span>
                             <a href={snapshot.link_url} target="_blank" rel="noreferrer" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded transition-colors">{snapshot.cta_text || 'Learn More'}</a>
                        </div>
                    </div>

                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm flex items-center justify-between">
                        <span className="text-sm font-medium opacity-90">Library ID</span>
                        <span className="font-mono font-bold tracking-wide">{ad.id.split('_')[1] || '12345'}</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ad Details</h2>
                
                {/* Stats Grid - HIER KOMMT DER NEUE SCORE HIN */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1"><BarChart3 className="w-4 h-4" /><span className="text-xs font-bold uppercase">Reach</span></div>
                        <div className="text-2xl font-bold text-indigo-900">{formatReach(ad.reach)}</div>
                    </div>

                    {/* VIRAL SCORE CARD */}
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
                         {/* DEMOGRAFIE VISUALISIERUNG */}
                         {demoData.length > 0 && (
                             <div>
                                 <h4 className="text-sm font-bold text-gray-800 mb-3">Audience Breakdown</h4>
                                 <div className="space-y-4">
                                     {/* @ts-ignore */}
                                     {demoData.slice(0, 3).map((countryData: any, i: number) => (
                                        <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                            <p className="text-xs font-bold text-gray-700 mb-2 uppercase flex items-center gap-2"><MapPin className="w-3 h-3"/> {countryData.country}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* @ts-ignore */}
                                                {countryData.age_gender_breakdowns.slice(0, 4).map((d: any, j: number) => (
                                                    <div key={j} className="flex justify-between text-xs bg-white p-1.5 rounded border border-gray-100 shadow-sm">
                                                        <span className="text-gray-500">{d.age_range}</span>
                                                        <span className="font-medium">
                                                            {((d.female || 0) > (d.male || 0)) ? `👩 ${(d.female || 0)}` : `👨 ${(d.male || 0)}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                         
                         {/* ... Existing Location Code ... */}
                     </div>
                </CollapsibleSection>

                {/* ... Other Sections (Disclaimer, About Advertiser) remain unchanged ... */}
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
                                    {tabId === 'overview' ? 'Overview' : `ID: ${tabId.split('_')[1]}`}
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
                            {group.map((ad: MetaAd) => (
                                <div key={ad.id} onClick={() => handleOpenAd(ad.id)} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer flex flex-col group relative overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                        <span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        <span className="text-xs text-gray-500">{new Date(ad.start_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="flex gap-3">
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                <img src={ad.snapshot.images[0]?.resized_image_url} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] text-gray-500 font-semibold uppercase">Viral Score</div>
                                                <div className="text-xl font-bold text-amber-600 flex items-center gap-1"><Zap className="w-4 h-4" /> {ad.efficiency_score}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {openTabs.filter(id => id !== 'overview').map((tabId) => {
                         const ad = group.find(g => g.id === tabId);
                         if (!ad) return null;
                         return <MetaAdDetailView key={ad.id} ad={ad} group={group} isActiveView={activeTabId === ad.id} openTabs={openTabs} activeTabId={activeTabId} onOpenAd={handleOpenAd} onSave={(ad) => onSave && onSave(ad, 'meta')} onRemove={() => onRemove && onRemove()} isSaved={!!isSaved} />;
                    })}
                </div>
            </div>
        </div>
    );
  }

  return null; 
};

export default AdDetailModal;