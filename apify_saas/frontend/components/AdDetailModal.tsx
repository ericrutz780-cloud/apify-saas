import React, { useState, useEffect } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, ExternalLink, Play, Calendar, Globe, Monitor, Info, ChevronDown, ChevronUp, Users, ShieldCheck, Download, Save, Facebook, CheckCircle2, Layers, LayoutGrid, Eye, Building2, Sparkles, TrendingUp, Clock, ArrowUpDown, ArrowUp, ArrowDown, FileText, User } from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  group: any[]; 
  type: 'meta' | 'tiktok' | undefined;
}

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

const formatFollowerCount = (num?: number) => {
    if (!num) return '';
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

const formatReach = (num?: number) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
};

interface MetaAdDetailViewProps {
    ad: MetaAd;
    group: MetaAd[];
    isActiveView: boolean;
    openTabs: string[];
    activeTabId: string;
    onOpenAd: (id: string) => void;
    onSave: () => void; 
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
    const [activeRegionIndex, setActiveRegionIndex] = useState(0);

    const sortedSiblings = React.useMemo(() => {
        return [...group].sort((a, b) => {
            const aOpen = openTabs.includes(a.id);
            const bOpen = openTabs.includes(b.id);
            if (aOpen === bOpen) return 0;
            return aOpen ? -1 : 1;
        });
    }, [group, openTabs]);

    const { snapshot, targeting, advertiser_info, transparency_regions, about_disclaimer, beneficiary_payer } = ad;
    const hasVideo = snapshot?.videos && snapshot.videos.length > 0;
    // FIX: Nutze das erste Bild, das auch aus Carousel Cards stammen kann (dank adAdapter Fix)
    const mediaUrl = hasVideo ? snapshot?.videos[0].video_hd_url : (snapshot?.images.length > 0 ? snapshot?.images[0].resized_image_url : null);
    const platforms = ad.publisher_platform || [];
    const regions = transparency_regions || [];
    const hasMultipleRegions = regions.length > 0;
    // FIX: Fallback auf allgemeines Targeting, falls Region-spezifisches fehlt
    const activeTargeting = hasMultipleRegions ? regions[activeRegionIndex] : targeting;

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 p-6">
                <div className="space-y-6 max-w-lg mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                {ad.avatar ? <img src={ad.avatar} alt="" className="w-full h-full object-cover" /> : ad.page_name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-semibold text-gray-900 text-sm">{ad.page_name}</h4>
                                 <p className="text-xs text-gray-500">Sponsored</p>
                             </div>
                        </div>

                        <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap">
                            {snapshot.body.text}
                        </div>

                        <div className="w-full bg-black min-h-[200px] flex items-center justify-center">
                            {hasVideo ? (
                                <video src={mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                            ) : mediaUrl ? (
                                <img src={mediaUrl} alt="Ad" className="w-full h-auto object-cover" />
                            ) : (
                                <div className="text-gray-500 text-sm">No Preview Available</div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                             <span className="text-xs text-gray-500 uppercase font-medium ml-2">{snapshot.link_url !== '#' ? new URL(snapshot.link_url || 'https://example.com').hostname : ''}</span>
                             <a href={snapshot.link_url} target="_blank" rel="noreferrer" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded transition-colors">
                                 {snapshot.cta_text || 'Learn More'}
                             </a>
                        </div>
                    </div>

                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm flex items-center justify-between">
                        <span className="text-sm font-medium opacity-90">Library ID</span>
                        {/* FIX: Echte ID verwenden, "12345" entfernt */}
                        <span className="font-mono font-bold tracking-wide">{ad.id.replace('meta_', '')}</span>
                    </div>
                    
                    {group.length > 1 && (
                        <div className="pt-4 border-t border-gray-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Switch Version</h4>
                            <div className="space-y-3">
                                {sortedSiblings.map((sibling) => {
                                    const isActive = sibling.id === activeTabId;
                                    const isOpened = openTabs.includes(sibling.id);
                                    
                                    return (
                                        <div 
                                            key={sibling.id} 
                                            onClick={() => onOpenAd(sibling.id)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 group relative ${
                                                isActive 
                                                ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' 
                                                : isOpened
                                                    ? 'bg-gray-50 border-gray-300' 
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded border overflow-hidden flex-shrink-0 ${isActive ? 'bg-white border-brand-200' : 'bg-gray-100 border-gray-200'}`}>
                                                {sibling.snapshot.images?.[0] ? (
                                                    <img src={sibling.snapshot.images[0].resized_image_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><Play className="w-3 h-3 text-gray-400" /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className={`text-xs font-bold ${isActive ? 'text-brand-700' : isOpened ? 'text-gray-700' : 'text-gray-500'}`}>ID: {sibling.id.replace('meta_', '')}</span>
                                                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                                                    {!isActive && isOpened && <span className="text-[10px] font-medium text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Open</span>}
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    Started {new Date(sibling.start_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Ad Details</h2>
                
                <AIAnalysisSection />

                <div className="mb-6 space-y-4">
                    <div className="flex items-start gap-4">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                             <Info className="w-5 h-5" />
                         </div>
                         <div>
                             <h3 className="font-medium text-gray-900">Status</h3>
                             <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                 <span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                 {ad.isActive ? 'Active' : 'Inactive'}
                             </p>
                             <p className="text-xs text-gray-500 mt-1">Started running on {new Date(ad.start_date).toLocaleDateString()}</p>
                         </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                         <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                             <Monitor className="w-5 h-5" />
                         </div>
                         <div>
                             <h3 className="font-medium text-gray-900">Platforms</h3>
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

                {(beneficiary_payer || about_disclaimer) && (
                     <CollapsibleSection title="Transparency & Beneficiary" icon={Building2} defaultOpen={false}>
                         <div className="space-y-4">
                             {beneficiary_payer?.beneficiary && (
                                 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                     <span className="text-sm text-gray-500 font-medium">Beneficiary</span>
                                     <span className="text-sm font-bold text-gray-900">{beneficiary_payer.beneficiary}</span>
                                 </div>
                             )}
                             {beneficiary_payer?.payer && (
                                 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                     <span className="text-sm text-gray-500 font-medium">Paid for by</span>
                                     <span className="text-sm font-bold text-gray-900">{beneficiary_payer.payer}</span>
                                 </div>
                             )}
                             {!beneficiary_payer && about_disclaimer?.payer && (
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <span className="text-sm text-gray-500 font-medium">Paid for by</span>
                                      <span className="text-sm font-bold text-gray-900">{about_disclaimer.payer}</span>
                                  </div>
                             )}
                             {beneficiary_payer?.text && (
                                 <p className="text-xs text-gray-500 italic mt-2">{beneficiary_payer.text}</p>
                             )}
                         </div>
                     </CollapsibleSection>
                )}

                <CollapsibleSection title="Transparency by regions" icon={Globe} defaultOpen={true}>
                     <div className="space-y-6">
                         {hasMultipleRegions && (
                             <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
                                 {regions.map((regionData, idx) => (
                                     <button
                                        key={regionData.region}
                                        onClick={() => setActiveRegionIndex(idx)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                            activeRegionIndex === idx 
                                            ? 'bg-blue-50 text-blue-700' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                     >
                                         {regionData.region}
                                     </button>
                                 ))}
                             </div>
                         )}

                         {(hasMultipleRegions ? regions[activeRegionIndex].description : null) && (
                             <p className="text-sm text-gray-600 leading-relaxed">
                                 {regions[activeRegionIndex].description}
                             </p>
                         )}

                         <div>
                             <h4 className="text-sm font-bold text-gray-800 mb-4">EU ad audience</h4>
                             <div className="mb-6">
                                 <div className="flex items-center gap-2 mb-2">
                                     <h5 className="text-sm font-bold text-gray-900">Location</h5>
                                     <Info className="w-3.5 h-3.5 text-gray-400" />
                                 </div>
                                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                                     <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Location</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Type</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(activeTargeting?.excluded_locations || []).map((loc, idx) => (
                                                    <tr key={`ex-${idx}`} className="bg-white hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{loc}</td>
                                                        <td className="px-4 py-3 text-gray-500">Region</td>
                                                        <td className="px-4 py-3 text-gray-500">Excluded</td>
                                                    </tr>
                                                ))}
                                                {(activeTargeting?.locations || ['Global']).map((loc, idx) => (
                                                    <tr key={`in-${idx}`} className="bg-white hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{loc}</td>
                                                        <td className="px-4 py-3 text-gray-500">Region</td>
                                                        <td className="px-4 py-3 text-gray-500">Included</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                 <div className="p-4 border border-gray-200 rounded-lg">
                                     <div className="flex items-center gap-2 mb-1">
                                         <h5 className="text-sm font-bold text-gray-900">Age</h5>
                                     </div>
                                     <div className="text-2xl font-normal text-gray-900 mb-1">{activeTargeting?.ages?.join(', ') || '18-65+'}</div>
                                 </div>

                                 <div className="p-4 border border-gray-200 rounded-lg">
                                     <div className="flex items-center gap-2 mb-1">
                                         <h5 className="text-sm font-bold text-gray-900">Gender</h5>
                                     </div>
                                     <div className="text-2xl font-normal text-gray-900 mb-1">{activeTargeting?.genders?.join(', ') || 'All'}</div>
                                 </div>
                             </div>
                         </div>

                         <div className="h-px bg-gray-200"></div>

                         <div>
                             <h4 className="text-sm font-bold text-gray-800 mb-4">EU ad delivery</h4>
                             <div className="p-4 border border-gray-200 rounded-lg mb-6">
                                 <div className="mb-2"><h5 className="text-sm font-bold text-gray-900">Reach</h5></div>
                                 <div className="text-3xl font-normal text-gray-900 mb-2">{formatReach(activeTargeting?.reach_estimate)}</div>
                                 <div className="text-xs text-gray-500">Accounts Center accounts in the EU that saw this ad at least once.</div>
                             </div>

                             {activeTargeting?.breakdown && activeTargeting.breakdown.length > 0 && (
                                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                                     <div className="max-h-60 overflow-auto">
                                         <table className="w-full text-sm text-left relative">
                                             <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
                                                 <tr>
                                                     <th className="px-4 py-3 whitespace-nowrap">Location</th>
                                                     <th className="px-4 py-3 whitespace-nowrap">Age Range</th>
                                                     <th className="px-4 py-3 whitespace-nowrap">Gender</th>
                                                     <th className="px-4 py-3 text-right whitespace-nowrap">Reach</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {activeTargeting.breakdown.map((item, idx) => (
                                                     <tr key={`bd-${idx}`} className="bg-white hover:bg-gray-50">
                                                         <td className="px-4 py-3 text-gray-900">{item.location}</td>
                                                         <td className="px-4 py-3 text-gray-500">{item.age_range}</td>
                                                         <td className="px-4 py-3 text-gray-500">{item.gender}</td>
                                                         <td className="px-4 py-3 text-gray-900 text-right font-medium">{formatReach(item.reach)}</td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                </CollapsibleSection>

                {about_disclaimer && (
                    <CollapsibleSection title="About the disclaimer" icon={FileText} defaultOpen={false}>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">{about_disclaimer.text}</p>
                        <div className="space-y-4">
                            {about_disclaimer.location && (
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div><div className="text-sm font-bold text-gray-900">Location</div><div className="text-sm text-gray-600">{about_disclaimer.location}</div></div>
                                </div>
                            )}
                            {about_disclaimer.payer && (
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div><div className="text-sm font-bold text-gray-900">Payer</div><div className="text-sm text-gray-600 uppercase">{about_disclaimer.payer}</div></div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                <CollapsibleSection title="About the advertiser" icon={ShieldCheck} defaultOpen={false}>
                    <div className="flex items-center gap-4 mb-5">
                         <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xl border border-gray-100 flex-shrink-0 overflow-hidden">
                            {ad.avatar ? <img src={ad.avatar} alt="" className="w-full h-full object-cover" /> : ad.page_name.charAt(0)}
                         </div>
                         <div className="font-bold text-gray-900 text-lg">{ad.page_name}</div>
                    </div>
                    
                    <div className="space-y-4 mb-5">
                        {(advertiser_info?.facebook_handle || !advertiser_info) && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5"><Facebook className="w-5 h-5 text-[#1877F2]" /></div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{advertiser_info?.facebook_handle || `@${ad.page_name.replace(/\s/g, '').toLowerCase()}`}</div>
                                    <div className="text-sm text-gray-500">{advertiser_info?.facebook_followers && <span>{formatFollowerCount(advertiser_info.facebook_followers)} followers</span>}</div>
                                </div>
                            </div>
                        )}
                    </div>
                    {advertiser_info?.about_text && (
                        <>
                            <div className="h-px bg-gray-100 w-full my-4"></div>
                            <div className="mb-2 font-bold text-gray-900 text-sm">More info</div>
                            <div className="text-sm text-gray-600 leading-relaxed">{advertiser_info.about_text}</div>
                        </>
                    )}
                </CollapsibleSection>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                        <Download className="w-4 h-4" />
                        Download Media
                    </button>
                    {isSaved ? (
                        <button 
                            onClick={onRemove}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm"
                        >
                            <X className="w-4 h-4" />
                            Remove Creative
                        </button>
                    ) : (
                        <button 
                            // FIX: onSave needs no arguments now as they are curried in parent
                            onClick={() => onSave()} 
                            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm"
                        >
                            <Save className="w-4 h-4" />
                            Save Creative
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
  const [lastOpenedIds, setLastOpenedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: 'reach' | 'score' | 'date' | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'desc' });

  const groupKey = group && group.length > 0 ? group[0].id : '';

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
          setLastOpenedIds([]);
      }
  }, [isOpen, groupKey, type]);

  const sortedGroup = React.useMemo(() => {
      if (!group) return [];
      let ads = [...group];
      if (!sortConfig.key) return ads;
      return ads.sort((a, b) => {
          let aValue = 0, bValue = 0;
          if (sortConfig.key === 'reach') { aValue = a.targeting?.reach_estimate || 0; bValue = b.targeting?.reach_estimate || 0; }
          else if (sortConfig.key === 'score') { aValue = a.efficiency_score || 0; bValue = b.efficiency_score || 0; }
          else if (sortConfig.key === 'date') { aValue = new Date(a.start_date).getTime(); bValue = new Date(b.start_date).getTime(); }
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [group, sortConfig, lastOpenedIds]);

  if (!isOpen || !group || group.length === 0 || !type) return null;

  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  const handleOpenAd = (adId: string) => {
      if (!openTabs.includes(adId)) setOpenTabs(prev => [...prev, adId]);
      setLastOpenedIds(prev => [adId, ...prev.filter(id => id !== adId)]);
      setActiveTabId(adId);
  };

  const handleClearOpenAds = () => { setOpenTabs(['overview']); setActiveTabId('overview'); };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      const newTabs = openTabs.filter(t => t !== tabId);
      setOpenTabs(newTabs);
      if (activeTabId === tabId) setActiveTabId(newTabs[newTabs.length - 1] || 'overview');
  };

  const handleSort = (key: 'reach' | 'score' | 'date') => {
      setSortConfig(current => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const renderSortIcon = (key: 'reach' | 'score' | 'date') => {
      if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1" />;
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-600 ml-1" /> : <ArrowDown className="w-3 h-3 text-brand-600 ml-1" />;
  };

  if (type === 'meta') {
    const showTabs = group.length > 1;
    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={handleContentClick}>
                <div className="flex flex-col border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-brand-100 text-brand-700 rounded-lg"><Layers className="w-5 h-5" /></div>
                             <div>
                                <h2 className="text-lg font-bold text-gray-900">{group.length > 1 ? `${group.length} Ad Versions` : 'Ad Details'}</h2>
                                <p className="text-xs text-gray-500">{group.length > 1 ? 'Shared creative text • Different targeting/dates' : 'Detailed Analysis'}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {openTabs.length > 1 && (
                                <button onClick={handleClearOpenAds} className="text-xs font-medium text-gray-500 hover:text-gray-800 underline decoration-gray-300 hover:decoration-gray-600 underline-offset-2 transition-all mr-2">Clear open ads</button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    {showTabs && (
                        <div className="flex items-end px-6 gap-2 overflow-x-auto no-scrollbar">
                            {openTabs.map(tabId => (
                                <button 
                                    key={tabId}
                                    onClick={() => setActiveTabId(tabId)}
                                    className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x border-b-0 relative flex-shrink-0 ${activeTabId === tabId ? 'bg-white border-gray-200 text-brand-600 shadow-[0_2px_0_0_#fff]' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}
                                    style={{ marginBottom: -1 }}
                                >
                                    <div className="flex items-center gap-2">
                                        {tabId === 'overview' ? <><LayoutGrid className="w-4 h-4" /> Overview</> : <span className="font-bold">ID: {tabId.replace('meta_', '')}</span>}
                                    </div>
                                    {tabId !== 'overview' && <div onClick={(e) => handleCloseTab(e, tabId)} className="ml-2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-h-0 relative bg-white overflow-hidden">
                    {activeTabId === 'overview' && (
                        <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 animate-in fade-in duration-300">
                             <div className="max-w-5xl mx-auto">
                                 <div className="flex items-center justify-between mb-6">
                                     <h3 className="text-lg font-bold text-gray-900">Version History & Performance</h3>
                                 </div>

                                 <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                     <div className="overflow-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-4 whitespace-nowrap">Ad Version</th>
                                                    <th 
                                                        className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none group whitespace-nowrap"
                                                        onClick={() => handleSort('date')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Start Date
                                                            {renderSortIcon('date')}
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Targeting</th>
                                                    <th 
                                                        className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors select-none group whitespace-nowrap"
                                                        onClick={() => handleSort('reach')}
                                                    >
                                                        <div className="flex items-center justify-end gap-1">
                                                            Reach Est.
                                                            {renderSortIcon('reach')}
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors select-none group whitespace-nowrap"
                                                        onClick={() => handleSort('score')}
                                                    >
                                                        <div className="flex items-center justify-end gap-1">
                                                            Viral Score
                                                            {renderSortIcon('score')}
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {sortedGroup.map((ad: MetaAd) => (
                                                    <tr 
                                                        key={ad.id} 
                                                        onClick={() => handleOpenAd(ad.id)}
                                                        className="hover:bg-gray-50 transition-colors group/row cursor-pointer"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                                                                    {ad.snapshot.images?.[0] ? (
                                                                        <img src={ad.snapshot.images[0].resized_image_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-gray-300" /></div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900">ID: {ad.id.replace('meta_', '')}</div>
                                                                    <div className="text-xs text-gray-500">{ad.isActive ? 'Active' : 'Inactive'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                            {new Date(ad.start_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {ad.targeting?.locations?.length 
                                                                ? (ad.targeting.locations.length > 3 ? `${ad.targeting.locations.length} Countries` : ad.targeting.locations.join(', '))
                                                                : 'Global'}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-900 font-medium text-right whitespace-nowrap">
                                                            {ad.targeting?.reach_estimate ? formatReach(ad.targeting.reach_estimate) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                            {ad.efficiency_score && (
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    ad.efficiency_score >= 80 ? 'bg-green-100 text-green-800' :
                                                                    ad.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {ad.efficiency_score}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                    {group.map((ad: MetaAd) => (
                        <MetaAdDetailView 
                            key={ad.id} 
                            ad={ad} 
                            group={sortedGroup} 
                            isActiveView={activeTabId === ad.id} 
                            openTabs={openTabs} 
                            activeTabId={activeTabId} 
                            onOpenAd={handleOpenAd} 
                            onSave={() => onSave?.(ad, 'meta')} 
                            onRemove={() => onRemove?.()} 
                            isSaved={isSaved || false} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
  }

  // Fallback for saved TikTok ads (even if removed from search)
  const ad = group[0] as TikTokAd;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={handleContentClick}>
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white backdrop-blur-md transition-colors"><X className="w-5 h-5" /></button>
            <div className="w-full md:w-[400px] bg-black flex items-center justify-center relative flex-shrink-0">
                 <div className="absolute inset-0 opacity-20 bg-cover bg-center blur-xl" style={{ backgroundImage: `url(${ad.videoMeta.coverUrl})` }}></div>
                 <div className="relative w-full h-full max-h-full flex items-center justify-center p-4">
                     <img src={ad.videoMeta.coverUrl} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="" />
                     <div className="absolute inset-0 flex items-center justify-center"><a href={ad.webVideoUrl} target="_blank" rel="noreferrer" className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-white/40"><Play className="w-6 h-6 text-white fill-white ml-1" /></a></div>
                 </div>
                 <div className="absolute bottom-6 left-6 right-6 flex justify-between text-white text-center">
                     <div><div className="text-lg font-bold">{formatFollowerCount(ad.playCount)}</div><div className="text-xs opacity-70">Views</div></div>
                     <div><div className="text-lg font-bold">{formatFollowerCount(ad.diggCount)}</div><div className="text-xs opacity-70">Likes</div></div>
                     <div><div className="text-lg font-bold">{formatFollowerCount(ad.shareCount)}</div><div className="text-xs opacity-70">Shares</div></div>
                 </div>
            </div>
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8">
                     <div className="flex items-center gap-4 mb-6">
                         <img src={ad.authorMeta.avatarUrl} className="w-14 h-14 rounded-full border border-gray-100 bg-gray-50" alt="" />
                         <div><h2 className="text-xl font-bold text-gray-900">{ad.authorMeta.nickName}</h2><a href={ad.authorMeta.profileUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">View Profile <ExternalLink className="w-3 h-3" /></a></div>
                         <div className="ml-auto flex items-center gap-2"><div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-600">TikTok Ad</div><div className="bg-green-100 px-3 py-1 rounded-full text-xs font-semibold text-green-700 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Viral</div></div>
                     </div>
                     <div className="text-gray-800 text-lg leading-relaxed mb-8">{ad.text}</div>
                     <AIAnalysisSection />
                     <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><div className="flex items-center gap-2 text-gray-500 mb-1"><Calendar className="w-4 h-4" /><span className="text-xs font-medium uppercase">Posted Date</span></div><div className="text-lg font-semibold text-gray-900">{new Date(ad.createTimeISO).toLocaleDateString()}</div></div>
                         <div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><div className="flex items-center gap-2 text-gray-500 mb-1"><Clock className="w-4 h-4" /><span className="text-xs font-medium uppercase">Duration</span></div><div className="text-lg font-semibold text-gray-900">{ad.videoMeta.duration}s</div></div>
                     </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                    <a href={ad.webVideoUrl} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Open on TikTok</a>
                    {isSaved ? <button onClick={onRemove} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"><X className="w-4 h-4" /> Remove Ad</button> : <button onClick={() => onSave?.(ad, 'tiktok')} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Ad</button>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdDetailModal;