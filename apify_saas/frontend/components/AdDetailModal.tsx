import React, { useState, useEffect } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { 
  X, ExternalLink, Play, Calendar, Globe, Monitor, Info, ChevronDown, ChevronUp, 
  Users, ShieldCheck, Download, Save, Facebook, CheckCircle2, Layers, LayoutGrid, 
  Eye, Building2, Sparkles, TrendingUp, Clock, ArrowUpDown, ArrowUp, ArrowDown, 
  FileText, User, Zap, BarChart3, MessageCircle, Target, ThumbsUp, AlertTriangle 
} from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  group: any[]; 
  type: 'meta' | 'tiktok' | undefined;
}

// --- Hilfsfunktionen & Komponenten ---

const formatFollowerCount = (num?: number) => {
    if (!num) return '';
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

const formatReach = (num?: number) => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
};

// Vollständige AI-Analyse
const AIAnalysisSection = ({ text }: { text?: string }) => {
    // Simulierte Analyse-Daten basierend auf dem Text (für Demo-Zwecke)
    const score = Math.floor(Math.random() * (98 - 75) + 75);
    const engagement = Math.floor(Math.random() * (95 - 70) + 70);
    const conversion = Math.floor(Math.random() * (90 - 60) + 60);

    return (
        <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-brand-100 text-brand-700 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">AI Performance Intelligence</h4>
            </div>
            
            <div className="p-5 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/50 to-white relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {/* Score Card 1 */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" /> Attention Score
                            </span>
                            <span className="text-xl font-bold text-gray-900">{score}/100</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${score}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-500">Based on visual contrast & hook strength.</p>
                    </div>

                    {/* Score Card 2 */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 text-blue-500" /> Copy Relevance
                            </span>
                            <span className="text-xl font-bold text-gray-900">{engagement}/100</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${engagement}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-500">Semantic match with target audience.</p>
                    </div>

                    {/* Score Card 3 */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                <Target className="w-3 h-3 text-green-500" /> Conv. Probability
                            </span>
                            <span className="text-xl font-bold text-gray-900">{conversion}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${conversion}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-500">Estimated CTR based on CTA placement.</p>
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-brand-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 className="text-xs font-bold text-green-700 flex items-center gap-1.5 mb-2">
                            <ThumbsUp className="w-3 h-3" /> Winning Factors
                        </h5>
                        <ul className="space-y-1.5">
                            <li className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                                Strong hook in the first 3 seconds (Visual).
                            </li>
                            <li className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                                Clear value proposition in primary text.
                            </li>
                            <li className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                                High contrast color scheme improves stopping power.
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-xs font-bold text-orange-700 flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-3 h-3" /> Potential Improvements
                        </h5>
                        <ul className="space-y-1.5">
                            <li className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></span>
                                Consider adding social proof elements earlier.
                            </li>
                            <li className="text-xs text-gray-600 flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></span>
                                Testing a shorter headline might increase mobile readability.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children?: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 shadow-sm bg-white">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-white text-brand-600 shadow-sm' : 'bg-transparent text-gray-500 group-hover:text-gray-700'}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="p-5 border-t border-gray-200 text-sm animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
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
    const mediaUrl = hasVideo ? snapshot?.videos[0].video_hd_url : (snapshot?.images.length > 0 ? snapshot?.images[0].resized_image_url : null);
    const platforms = ad.publisher_platform || [];
    const regions = transparency_regions || [];
    const hasMultipleRegions = regions.length > 0;
    const activeTargeting = hasMultipleRegions ? regions[activeRegionIndex] : targeting;

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
            {/* LEFT COLUMN: Creative Preview & Switcher */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-gray-50 border-r border-gray-200 p-6 custom-scrollbar">
                <div className="space-y-6 max-w-lg mx-auto">
                    {/* The Ad Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full ring-1 ring-black/5">
                        <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden shadow-inner">
                                {ad.avatar ? <img src={ad.avatar} alt="" className="w-full h-full object-cover" /> : ad.page_name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="font-semibold text-gray-900 text-sm leading-tight">{ad.page_name}</h4>
                                 <p className="text-xs text-gray-500 mt-0.5">Sponsored • ID: {ad.id.replace('meta_', '')}</p>
                             </div>
                        </div>

                        <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {snapshot.body.text}
                        </div>

                        <div className="w-full bg-black min-h-[300px] flex items-center justify-center relative">
                            {hasVideo ? (
                                <video src={mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                            ) : mediaUrl ? (
                                <img src={mediaUrl} alt="Ad" className="w-full h-auto object-cover" />
                            ) : (
                                <div className="text-gray-500 text-sm flex flex-col items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 opacity-50" />
                                    No Preview Available
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                             <div className="flex flex-col ml-1">
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Destination</span>
                                <span className="text-xs text-gray-600 font-medium truncate max-w-[200px]">
                                    {snapshot.link_url !== '#' ? new URL(snapshot.link_url || 'https://example.com').hostname : 'Unknown'}
                                </span>
                             </div>
                             <a href={snapshot.link_url} target="_blank" rel="noreferrer" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-5 py-2 rounded transition-colors shadow-sm">
                                 {snapshot.cta_text || 'Learn More'}
                             </a>
                        </div>
                    </div>
                    
                    {/* Variant Switcher */}
                    {group.length > 1 && (
                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Switch ({group.length} Versions)</h4>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Same creative text</span>
                            </div>
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
                                                ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300 shadow-sm' 
                                                : isOpened
                                                    ? 'bg-gray-50 border-gray-300' 
                                                    : 'bg-white border-gray-200 hover:border-brand-200 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded border overflow-hidden flex-shrink-0 relative ${isActive ? 'bg-white border-brand-200' : 'bg-gray-100 border-gray-200'}`}>
                                                {sibling.snapshot.images?.[0] ? (
                                                    <img src={sibling.snapshot.images[0].resized_image_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-gray-400" /></div>
                                                )}
                                                {isActive && <div className="absolute inset-0 bg-brand-500/10 flex items-center justify-center"><Eye className="w-4 h-4 text-brand-600" /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-bold font-mono ${isActive ? 'text-brand-700' : isOpened ? 'text-gray-700' : 'text-gray-500'}`}>
                                                        {sibling.id.replace('meta_', '')}
                                                    </span>
                                                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                                                    {!isActive && isOpened && <span className="text-[10px] font-medium text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded flex items-center gap-1">Open</span>}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(sibling.start_date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {sibling.efficiency_score || '-'} Score</span>
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

            {/* RIGHT COLUMN: Data & Insights */}
            <div className="w-full md:w-1/2 h-full overflow-y-auto bg-white p-8 custom-scrollbar">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Ad Details & Analytics</h2>
                        <p className="text-sm text-gray-500 mt-1">Deep dive into targeting, transparency, and AI insights.</p>
                    </div>
                    <div className="flex gap-2">
                        {isSaved ? (
                            <button onClick={onRemove} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200" title="Remove">
                                <X className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={() => onSave()} className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors border border-brand-200" title="Save">
                                <Save className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* RE-ADDED FULL AI SECTION */}
                <AIAnalysisSection text={snapshot.body.text} />

                {/* Status Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                         <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-blue-600">
                             <Info className="w-4 h-4" />
                         </div>
                         <div>
                             <h3 className="text-xs font-bold text-gray-500 uppercase">Status</h3>
                             <div className="flex items-center gap-2 mt-1">
                                 <span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></span>
                                 <span className="font-bold text-gray-900">{ad.isActive ? 'Active' : 'Inactive'}</span>
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1">Started {new Date(ad.start_date).toLocaleDateString()}</p>
                         </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                         <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-purple-600">
                             <Monitor className="w-4 h-4" />
                         </div>
                         <div>
                             <h3 className="text-xs font-bold text-gray-500 uppercase">Platforms</h3>
                             <div className="flex flex-wrap gap-1.5 mt-1.5">
                                 {platforms.map((p: string) => (
                                     <span key={p} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 capitalize bg-white border border-gray-200">
                                         {p.replace('_', ' ')}
                                     </span>
                                 ))}
                             </div>
                         </div>
                    </div>
                </div>

                {/* Transparency Info */}
                {(beneficiary_payer || about_disclaimer) && (
                     <CollapsibleSection title="Transparency & Beneficiary" icon={Building2} defaultOpen={false}>
                         <div className="space-y-3">
                             {beneficiary_payer?.beneficiary && (
                                 <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                     <span className="text-sm text-gray-500 font-medium">Beneficiary</span>
                                     <span className="text-sm font-bold text-gray-900">{beneficiary_payer.beneficiary}</span>
                                 </div>
                             )}
                             {beneficiary_payer?.payer && (
                                 <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                     <span className="text-sm text-gray-500 font-medium">Paid for by</span>
                                     <span className="text-sm font-bold text-gray-900">{beneficiary_payer.payer}</span>
                                 </div>
                             )}
                             {!beneficiary_payer && about_disclaimer?.payer && (
                                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                      <span className="text-sm text-gray-500 font-medium">Paid for by</span>
                                      <span className="text-sm font-bold text-gray-900">{about_disclaimer.payer}</span>
                                  </div>
                             )}
                             {beneficiary_payer?.text && (
                                 <p className="text-xs text-gray-500 italic mt-2 border-l-2 border-gray-300 pl-3 py-1">{beneficiary_payer.text}</p>
                             )}
                         </div>
                     </CollapsibleSection>
                )}

                {/* Targeting By Regions - Very Detailed */}
                <CollapsibleSection title="Targeting & Demographics" icon={Globe} defaultOpen={true}>
                     <div className="space-y-6">
                         {hasMultipleRegions && (
                             <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 no-scrollbar">
                                 {regions.map((regionData, idx) => (
                                     <button
                                        key={regionData.region}
                                        onClick={() => setActiveRegionIndex(idx)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border ${
                                            activeRegionIndex === idx 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                        }`}
                                     >
                                         {regionData.region}
                                     </button>
                                 ))}
                             </div>
                         )}

                         {(hasMultipleRegions ? regions[activeRegionIndex].description : null) && (
                             <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {regions[activeRegionIndex].description}
                                </p>
                             </div>
                         )}

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                 <div className="flex items-center gap-2 mb-2">
                                     <Users className="w-4 h-4 text-gray-400" />
                                     <h5 className="text-xs font-bold text-gray-500 uppercase">Age Range</h5>
                                 </div>
                                 <div className="text-xl font-bold text-gray-900">{activeTargeting?.ages?.join(', ') || '18-65+'}</div>
                             </div>

                             <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                 <div className="flex items-center gap-2 mb-2">
                                     <User className="w-4 h-4 text-gray-400" />
                                     <h5 className="text-xs font-bold text-gray-500 uppercase">Gender</h5>
                                 </div>
                                 <div className="text-xl font-bold text-gray-900 capitalize">{activeTargeting?.genders?.join(', ') || 'All'}</div>
                             </div>
                         </div>

                         <div>
                             <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                 <Globe className="w-4 h-4 text-gray-500" /> Location Targeting
                             </h4>
                             <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                 <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 text-xs uppercase">
                                            <tr>
                                                <th className="px-4 py-2.5">Location</th>
                                                <th className="px-4 py-2.5">Type</th>
                                                <th className="px-4 py-2.5">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(activeTargeting?.excluded_locations || []).map((loc, idx) => (
                                                <tr key={`ex-${idx}`} className="bg-red-50/30">
                                                    <td className="px-4 py-2.5 font-medium text-gray-900">{loc}</td>
                                                    <td className="px-4 py-2.5 text-gray-500 text-xs">Region</td>
                                                    <td className="px-4 py-2.5 text-red-600 text-xs font-bold">Excluded</td>
                                                </tr>
                                            ))}
                                            {(activeTargeting?.locations || ['Global']).map((loc, idx) => (
                                                <tr key={`in-${idx}`} className="bg-white">
                                                    <td className="px-4 py-2.5 font-medium text-gray-900">{loc}</td>
                                                    <td className="px-4 py-2.5 text-gray-500 text-xs">Region</td>
                                                    <td className="px-4 py-2.5 text-green-600 text-xs font-bold">Included</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                 </div>
                             </div>
                         </div>

                         <div className="h-px bg-gray-100"></div>

                         <div>
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-900">EU Reach Estimate</h4>
                                <span className="text-xs text-gray-500">Accounts Center Estimate</span>
                             </div>
                             
                             <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-white mb-6 flex items-center gap-4">
                                 <div className="p-3 bg-white rounded-full border border-gray-200 shadow-sm">
                                     <BarChart3 className="w-6 h-6 text-brand-600" />
                                 </div>
                                 <div>
                                     <div className="text-3xl font-bold text-gray-900 tracking-tight">{formatReach(activeTargeting?.reach_estimate)}</div>
                                     <div className="text-xs text-gray-500 font-medium">Unique accounts reached</div>
                                 </div>
                             </div>

                             {activeTargeting?.breakdown && activeTargeting.breakdown.length > 0 && (
                                 <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                     <div className="max-h-60 overflow-auto custom-scrollbar">
                                         <table className="w-full text-sm text-left relative">
                                             <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0 text-xs uppercase z-10">
                                                 <tr>
                                                     <th className="px-4 py-2.5 whitespace-nowrap">Location</th>
                                                     <th className="px-4 py-2.5 whitespace-nowrap">Age Range</th>
                                                     <th className="px-4 py-2.5 whitespace-nowrap">Gender</th>
                                                     <th className="px-4 py-2.5 text-right whitespace-nowrap">Reach</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {activeTargeting.breakdown.map((item, idx) => (
                                                     <tr key={`bd-${idx}`} className="bg-white hover:bg-gray-50 transition-colors">
                                                         <td className="px-4 py-2 text-gray-900 font-medium">{item.location}</td>
                                                         <td className="px-4 py-2 text-gray-500 text-xs">{item.age_range}</td>
                                                         <td className="px-4 py-2 text-gray-500 text-xs">{item.gender}</td>
                                                         <td className="px-4 py-2 text-gray-900 text-right font-mono text-xs">{formatReach(item.reach)}</td>
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
                        <p className="text-sm text-gray-600 leading-relaxed mb-6 bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-800">
                            {about_disclaimer.text}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {about_disclaimer.location && (
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div><div className="text-xs font-bold text-gray-900 uppercase">Location</div><div className="text-sm text-gray-600">{about_disclaimer.location}</div></div>
                                </div>
                            )}
                            {about_disclaimer.payer && (
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-100">
                                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <div><div className="text-xs font-bold text-gray-900 uppercase">Payer</div><div className="text-sm text-gray-600 uppercase">{about_disclaimer.payer}</div></div>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                <CollapsibleSection title="About the advertiser" icon={ShieldCheck} defaultOpen={false}>
                    <div className="flex items-center gap-4 mb-6">
                         <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-2xl border-4 border-white shadow-md flex-shrink-0 overflow-hidden">
                            {ad.avatar ? <img src={ad.avatar} alt="" className="w-full h-full object-cover" /> : ad.page_name.charAt(0)}
                         </div>
                         <div>
                             <div className="font-bold text-gray-900 text-lg">{ad.page_name}</div>
                             <div className="text-xs text-gray-500">Advertiser Account</div>
                         </div>
                    </div>
                    
                    <div className="space-y-4 mb-5">
                        {(advertiser_info?.facebook_handle || !advertiser_info) && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="bg-white p-1.5 rounded-full shadow-sm"><Facebook className="w-4 h-4 text-[#1877F2]" /></div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{advertiser_info?.facebook_handle || `@${ad.page_name.replace(/\s/g, '').toLowerCase()}`}</div>
                                    <div className="text-xs text-gray-500">{advertiser_info?.facebook_followers ? `${formatFollowerCount(advertiser_info.facebook_followers)} followers` : 'Official Page'}</div>
                                </div>
                            </div>
                        )}
                    </div>
                    {advertiser_info?.about_text && (
                        <>
                            <div className="h-px bg-gray-100 w-full my-4"></div>
                            <div className="mb-2 font-bold text-gray-900 text-xs uppercase tracking-wider">More info</div>
                            <div className="text-sm text-gray-600 leading-relaxed italic">"{advertiser_info.about_text}"</div>
                        </>
                    )}
                </CollapsibleSection>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg shadow-sm transition-all text-sm">
                        <Download className="w-4 h-4" />
                        Download Assets
                    </button>
                    {isSaved ? (
                        <button 
                            onClick={onRemove}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg shadow-sm transition-all text-sm shadow-red-200"
                        >
                            <X className="w-4 h-4" />
                            Remove from Library
                        </button>
                    ) : (
                        <button 
                            onClick={() => onSave()} 
                            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg shadow-sm transition-all text-sm shadow-brand-200"
                        >
                            <Save className="w-4 h-4" />
                            Save to Library
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

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
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[1400px] h-full max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={handleContentClick}>
                <div className="flex flex-col border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                             <div className="p-2.5 bg-brand-600 text-white rounded-lg shadow-brand-200 shadow-sm"><Layers className="w-5 h-5" /></div>
                             <div>
                                <h2 className="text-lg font-bold text-gray-900">{group.length > 1 ? `${group.length} Ad Versions Found` : 'Ad Details'}</h2>
                                <p className="text-xs text-gray-500">{group.length > 1 ? 'These ads share the same creative text but have different settings.' : 'Detailed Analysis & Targeting'}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {openTabs.length > 1 && (
                                <button onClick={handleClearOpenAds} className="text-xs font-medium text-gray-500 hover:text-gray-800 underline decoration-gray-300 hover:decoration-gray-600 underline-offset-2 transition-all mr-4">Close all tabs</button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    {showTabs && (
                        <div className="flex items-end px-6 gap-2 overflow-x-auto no-scrollbar pt-2">
                            {openTabs.map(tabId => (
                                <button 
                                    key={tabId}
                                    onClick={() => setActiveTabId(tabId)}
                                    className={`group flex items-center gap-2 px-5 py-3 rounded-t-lg text-sm font-medium transition-all border-t border-x border-b-0 relative flex-shrink-0 ${activeTabId === tabId ? 'bg-white border-gray-200 text-brand-600 shadow-[0_4px_0_0_#fff] z-10' : 'bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200'}`}
                                    style={{ marginBottom: -1 }}
                                >
                                    <div className="flex items-center gap-2">
                                        {tabId === 'overview' ? <><LayoutGrid className="w-4 h-4" /> Overview</> : <span className="font-bold font-mono">ID: {tabId.replace('meta_', '')}</span>}
                                    </div>
                                    {tabId !== 'overview' && <div onClick={(e) => handleCloseTab(e, tabId)} className="ml-2 p-0.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-h-0 relative bg-white overflow-hidden">
                    {activeTabId === 'overview' && (
                        <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-300 custom-scrollbar">
                             <div className="max-w-6xl mx-auto">
                                 <div className="flex items-center justify-between mb-6">
                                     <h3 className="text-xl font-bold text-gray-900">Version History & Performance</h3>
                                 </div>

                                 <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ring-1 ring-black/5">
                                     <div className="overflow-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 text-xs uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4 whitespace-nowrap">Ad Creative</th>
                                                    <th 
                                                        className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none group whitespace-nowrap"
                                                        onClick={() => handleSort('date')}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            Start Date
                                                            {renderSortIcon('date')}
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Targeting Locations</th>
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
                                                        className="hover:bg-blue-50/50 transition-colors group/row cursor-pointer"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 relative shadow-sm">
                                                                    {ad.snapshot.images?.[0] ? (
                                                                        <img src={ad.snapshot.images[0].resized_image_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-gray-300" /></div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900 font-mono text-xs">ID: {ad.id.replace('meta_', '')}</div>
                                                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                                        {ad.isActive ? 'Active' : 'Inactive'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap font-medium">
                                                            {new Date(ad.start_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {ad.targeting?.locations?.length 
                                                                ? (ad.targeting.locations.length > 3 
                                                                    ? <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold">{ad.targeting.locations.length} Countries</span> 
                                                                    : ad.targeting.locations.join(', '))
                                                                : <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Global</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-900 font-bold text-right whitespace-nowrap font-mono">
                                                            {ad.targeting?.reach_estimate ? formatReach(ad.targeting.reach_estimate) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                                            {ad.efficiency_score && (
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                                    ad.efficiency_score >= 80 ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                    ad.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                                    'bg-gray-100 text-gray-700 border border-gray-200'
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

  // --- TikTok Modal (Full Version & Fixed) ---
  const ad = group[0] as TikTokAd;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={handleContentClick}>
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"><X className="w-5 h-5" /></button>
            
            {/* TikTok: Left Video Column */}
            <div className="w-full md:w-[420px] bg-black flex items-center justify-center relative flex-shrink-0">
                 <div className="absolute inset-0 opacity-30 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${ad.videoMeta.coverUrl})` }}></div>
                 <div className="relative w-full h-full flex items-center justify-center p-6">
                     <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-h-full">
                         <img src={ad.videoMeta.coverUrl} className="max-w-full max-h-full object-contain" alt="" />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
                             <a href={ad.webVideoUrl} target="_blank" rel="noreferrer" className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border border-white/40 shadow-xl group">
                                 <Play className="w-6 h-6 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
                             </a>
                         </div>
                     </div>
                 </div>
                 {/* Video Stats Overlay */}
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 flex justify-between text-white text-center">
                     <div><div className="text-xl font-bold">{formatFollowerCount(ad.playCount)}</div><div className="text-xs opacity-70 uppercase tracking-wide">Views</div></div>
                     <div><div className="text-xl font-bold">{formatFollowerCount(ad.diggCount)}</div><div className="text-xs opacity-70 uppercase tracking-wide">Likes</div></div>
                     <div><div className="text-xl font-bold">{formatFollowerCount(ad.shareCount)}</div><div className="text-xs opacity-70 uppercase tracking-wide">Shares</div></div>
                 </div>
            </div>

            {/* TikTok: Right Content Column */}
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                     <div className="flex items-center gap-4 mb-6">
                         <img src={ad.authorMeta.avatarUrl} className="w-16 h-16 rounded-full border border-gray-100 bg-gray-50 shadow-sm" alt="" />
                         <div>
                             <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">{ad.authorMeta.nickName}</h2>
                             <a href={ad.authorMeta.profileUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                                 {/* Fix: use nickName here as fallback since 'name' property is missing on type */}
                                 @{ad.authorMeta.nickName} <ExternalLink className="w-3 h-3" />
                             </a>
                         </div>
                         <div className="ml-auto flex items-center gap-2">
                             <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">TikTok Ad</div>
                             <div className="bg-green-100 px-3 py-1 rounded-full text-xs font-bold text-green-700 flex items-center gap-1 border border-green-200">
                                 <TrendingUp className="w-3 h-3" /> High Performance
                             </div>
                         </div>
                     </div>
                     
                     <div className="text-gray-800 text-lg leading-relaxed mb-8 font-medium">{ad.text}</div>
                     
                     <AIAnalysisSection text={ad.text} />

                     <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="flex items-center gap-2 text-gray-500 mb-2">
                                 <Calendar className="w-4 h-4" /><span className="text-xs font-bold uppercase">Posted Date</span>
                             </div>
                             <div className="text-xl font-bold text-gray-900">{new Date(ad.createTimeISO).toLocaleDateString()}</div>
                         </div>
                         <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                             <div className="flex items-center gap-2 text-gray-500 mb-2">
                                 <Clock className="w-4 h-4" /><span className="text-xs font-bold uppercase">Duration</span>
                             </div>
                             <div className="text-xl font-bold text-gray-900">{ad.videoMeta.duration}s</div>
                         </div>
                     </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                    <a href={ad.webVideoUrl} target="_blank" rel="noreferrer" className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Open on TikTok
                    </a>
                    {isSaved ? (
                        <button onClick={onRemove} className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                            <X className="w-4 h-4" /> Remove Ad
                        </button>
                    ) : (
                        <button onClick={() => onSave?.(ad, 'tiktok')} className="flex-1 bg-brand-600 text-white font-bold py-3.5 rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Ad
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdDetailModal;