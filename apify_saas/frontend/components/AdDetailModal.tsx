import React, { useState, useEffect, useMemo } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { 
    X, Globe, Info, ChevronDown, ChevronUp, Users, ShieldCheck, Download, Save, 
    Facebook, Instagram, CheckCircle2, FileText, User, Layers, ExternalLink, Play, 
    Monitor, Hash, LayoutGrid, Eye, Building2, Sparkles, TrendingUp, Clock, 
    ArrowUpDown, ArrowUp, ArrowDown, Calendar, BarChart3, MapPin, Zap, 
    ChevronLeft, ChevronRight, Image as ImageIcon, MessageCircle 
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

// --- HELPER: DATEN-BRÜCKE & FIX FÜR REICHWEITE ---
const normalizeAdData = (ad: any) => {
    const snapshot = ad.snapshot || {};
    const pageName = ad.page_name || snapshot.page_name || "Unknown";
    
    // Daten aus dem Adapter holen
    let demographics = ad.demographics || [];
    let locations: string[] = ad.targeting?.locations || [];
    let reach = ad.reach || ad.eu_total_reach || 0;
    
    const rawInfo = ad.aaa_info || ad.transparency_by_location?.eu_transparency;
    let breakdown = ad.targeting?.breakdown || [];

    // Fallback: Daten aus rawInfo extrahieren, falls noch nicht vorhanden
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

    // WICHTIG: Breakdown aus Demographics generieren, falls noch nicht vorhanden
    if (breakdown.length === 0 && demographics.length > 0) {
        breakdown = demographics.flatMap((d: any) => {
             if (d.age_gender_breakdowns) {
                 return d.age_gender_breakdowns.map((b: any) => ({
                     location: d.country,
                     age_range: b.age_range,
                     gender: b.unknown ? 'Mixed' : (b.female ? 'Female' : 'Male'),
                     reach: (b.male || 0) + (b.female || 0) + (b.unknown || 0)
                 }));
             }
             return [];
        });
    }

    // Fallback: Wenn Adapter keine Regionen gebaut hat, bauen wir sie hier für die Anzeige
    let regions = ad.transparency_regions || [];
    if (regions.length === 0 && breakdown.length > 0) {
        regions = [{
            region: "European Union",
            description: "Data from Transparency records.",
            breakdown: breakdown,
            locations: locations
        }];
    }

    return {
        ...ad,
        page_name: pageName,
        snapshot,
        demographics,
        reach: Number(reach),
        targeting: {
            ...ad.targeting,
            locations,
            breakdown // Hier stellen wir sicher, dass Breakdown verfügbar ist
        },
        transparency_regions: regions
    };
};

const AIAnalysisSection = () => {
    // Statische Demo-Werte wie im Screenshot (image_8e208b.png)
    return (
        <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-100 text-brand-700 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">AI Performance Intelligence</h4>
            </div>
            
            <div className="p-5 rounded-xl border border-brand-200 bg-white shadow-sm ring-1 ring-black/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Attention Score */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> Attention Score</span>
                            <span className="text-xl font-bold text-gray-900">77/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: '77%' }}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Based on visual contrast & hook strength.</p>
                    </div>
                    {/* Copy Relevance */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-500" /> Copy Relevance</span>
                            <span className="text-xl font-bold text-gray-900">93/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '93%' }}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Semantic match with target audience.</p>
                    </div>
                    {/* Conv Probability */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> Conv. Probability</span>
                            <span className="text-xl font-bold text-gray-900">79%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '79%' }}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Estimated CTR based on CTA placement.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                    <div>
                        <h5 className="text-xs font-bold text-green-700 flex items-center gap-1.5 mb-3"><CheckCircle2 className="w-3.5 h-3.5" /> Winning Factors</h5>
                        <ul className="space-y-2">
                            <li className="text-xs text-gray-600 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>Strong hook in the first 3 seconds (Visual).</li>
                            <li className="text-xs text-gray-600 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>Clear value proposition in primary text.</li>
                            <li className="text-xs text-gray-600 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>High contrast color scheme improves stopping power.</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-xs font-bold text-orange-700 flex items-center gap-1.5 mb-3"><Info className="w-3.5 h-3.5" /> Potential Improvements</h5>
                        <ul className="space-y-2">
                            <li className="text-xs text-gray-600 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></span>Consider adding social proof elements earlier.</li>
                            <li className="text-xs text-gray-600 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></span>Testing a shorter headline might increase mobile readability.</li>
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

const getDisplayId = (id: string) => {
    if (!id) return '';
    if (id.includes('_')) return id.split('_')[1];
    return id;
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
    const ad = useMemo(() => normalizeAdData(rawAd), [rawAd]);
    
    // --- CAROUSEL STATE ---
    const [activeRegionIndex, setActiveRegionIndex] = useState(0);
    const [cardIndex, setCardIndex] = useState(0);

    useEffect(() => {
        setCardIndex(0);
    }, [ad.id]);

    const sortedSiblings = React.useMemo(() => {
        return [...group].sort((a, b) => {
            const aOpen = openTabs.includes(a.id);
            const bOpen = openTabs.includes(b.id);
            if (aOpen === bOpen) return 0;
            return aOpen ? -1 : 1;
        });
    }, [group, openTabs]);

    const { snapshot, targeting, advertiser_info, transparency_regions, about_disclaimer, beneficiary_payer } = ad;
    
    // --- MEDIA LOGIK (CAROUSEL AWARE) ---
    const cards = snapshot?.cards || [];
    const isCarousel = cards.length > 0;
    
    let mediaUrl = null;
    let isVideo = false;
    let currentTitle = snapshot.title;
    let currentBody = snapshot.body?.text;
    let currentLink = snapshot.link_url;
    let currentCTA = snapshot.cta_text;

    if (isCarousel) {
        const card = cards[cardIndex] || cards[0];
        mediaUrl = card.original_image_url || card.resized_image_url;
        if (card.video_hd_url || card.video_sd_url) {
            mediaUrl = card.video_hd_url || card.video_sd_url;
            isVideo = true;
        }
        if (card.title) currentTitle = card.title;
        if (card.body) currentBody = card.body;
        if (card.link_url) currentLink = card.link_url;
        if (card.cta_text) currentCTA = card.cta_text;
    } else {
        const hasVideo = snapshot?.videos && snapshot.videos.length > 0;
        if (hasVideo) {
            mediaUrl = snapshot?.videos[0].video_hd_url;
            isVideo = true;
        } else if (snapshot?.images?.length > 0) {
            mediaUrl = snapshot?.images[0].resized_image_url || snapshot?.images[0].original_image_url;
        }
    }

    const platforms = ad.publisher_platform || [];
    const regions = transparency_regions || [];
    const hasMultipleRegions = regions.length > 0;
    
    // FIX: Priorisiere Regionen-Daten für die Aufschlüsselung
    const activeTargeting = hasMultipleRegions ? regions[activeRegionIndex] : targeting;
    const breakdownData = activeTargeting?.breakdown || [];
    const demoData = ad.demographics || [];

    const nextCard = () => setCardIndex((prev) => (prev + 1) % cards.length);
    const prevCard = () => setCardIndex((prev) => (prev - 1 + cards.length) % cards.length);

    return (
        <div className={isActiveView ? "flex flex-col md:flex-row h-full" : "hidden h-full"}>
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

                        <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap">{currentBody}</div>

                        <div className="w-full bg-black relative group/media min-h-[300px] flex items-center justify-center">
                            {mediaUrl ? (
                                isVideo ? (
                                    <video src={mediaUrl} controls className="w-full max-h-[500px] object-contain" />
                                ) : (
                                    <img src={mediaUrl} alt="Ad" className="w-full h-auto max-h-[500px] object-contain" />
                                )
                            ) : (
                                <div className="text-white/50 flex flex-col items-center p-10">
                                    <Info className="w-8 h-8 mb-2"/>
                                    <span>No Media Available</span>
                                </div>
                            )}

                            {isCarousel && cards.length > 1 && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); prevCard(); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-opacity opacity-0 group-hover/media:opacity-100">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-opacity opacity-0 group-hover/media:opacity-100">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm flex items-center gap-1.5">
                                        <ImageIcon className="w-3 h-3" />
                                        <span>{cardIndex + 1} / {cards.length}</span>
                                    </div>
                                    {currentTitle && currentTitle !== ad.page_name && (
                                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-3 text-white text-xs font-medium">
                                            {currentTitle}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t border-gray-100">
                             <span className="text-xs text-gray-500 uppercase font-medium ml-2">{new URL(currentLink || 'https://example.com').hostname.replace('www.','')}</span>
                             <a href={currentLink} target="_blank" rel="noreferrer" className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold px-4 py-2 rounded transition-colors">{currentCTA || 'Learn More'}</a>
                        </div>
                    </div>

                    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-sm flex items-center justify-between">
                        <span className="text-sm font-medium opacity-90">Library ID</span>
                        <span className="font-mono font-bold tracking-wide">{getDisplayId(ad.id)}</span>
                    </div>

                    {group.length > 1 && (
                        <div className="pt-4 border-t border-gray-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Switch Version</h4>
                            <div className="space-y-3">
                                {sortedSiblings.map((sibling: any) => {
                                    const isActive = sibling.id === activeTabId;
                                    let thumb = null;
                                    if (sibling.snapshot?.images?.length > 0) thumb = sibling.snapshot.images[0].resized_image_url;
                                    else if (sibling.snapshot?.cards?.length > 0) thumb = sibling.snapshot.cards[0].resized_image_url || sibling.snapshot.cards[0].original_image_url;
                                    else if (sibling.snapshot?.videos?.length > 0) thumb = sibling.snapshot.videos[0].video_preview_image_url;

                                    return (
                                        <div key={sibling.id} onClick={() => onOpenAd(sibling.id)} className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${isActive ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-300' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                            <div className="w-10 h-10 rounded border bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {thumb ? <img src={thumb} className="w-full h-full object-cover" /> : <Play className="w-4 h-4 text-gray-400"/>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between"><span className="text-xs font-bold">ID: {getDisplayId(sibling.id)}</span>{isActive && <CheckCircle2 className="w-3 h-3 text-brand-600"/>}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(sibling.start_date).toLocaleDateString()}</div>
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
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Info className="w-5 h-5" /></div>
                         <div>
                             <h3 className="font-medium text-gray-900">Status</h3>
                             <p className="text-sm text-gray-600 mt-1 flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>{ad.isActive ? 'Active' : 'Inactive'}</p>
                             <p className="text-xs text-gray-500 mt-1">Started running on {new Date(ad.start_date).toLocaleDateString()}</p>
                         </div>
                    </div>
                    <div className="flex items-start gap-4">
                         <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Monitor className="w-5 h-5" /></div>
                         <div>
                             <h3 className="font-medium text-gray-900">Platforms</h3>
                             <div className="flex flex-wrap gap-2 mt-2">
                                 {platforms.map((p: string) => <span key={p} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700 capitalize border border-gray-200">{p.replace('_', ' ')}</span>)}
                             </div>
                         </div>
                    </div>
                </div>

                {(beneficiary_payer || about_disclaimer) && (
                     <CollapsibleSection title="Transparency & Beneficiary" icon={Building2} defaultOpen={false}>
                         <div className="space-y-4">
                             {beneficiary_payer?.beneficiary && (<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"><span className="text-sm text-gray-500 font-medium">Beneficiary</span><span className="text-sm font-bold text-gray-900">{beneficiary_payer.beneficiary}</span></div>)}
                             {beneficiary_payer?.payer && (<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"><span className="text-sm text-gray-500 font-medium">Paid for by</span><span className="text-sm font-bold text-gray-900">{beneficiary_payer.payer}</span></div>)}
                         </div>
                     </CollapsibleSection>
                )}

                <CollapsibleSection title="Transparency by regions" icon={Globe} defaultOpen={true}>
                     <div className="space-y-6">
                         {hasMultipleRegions && (
                             <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
                                 {regions.map((regionData: any, idx: number) => (
                                     <button key={idx} onClick={() => setActiveRegionIndex(idx)} className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${activeRegionIndex === idx ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>{regionData.region || `Region ${idx + 1}`}</button>
                                 ))}
                             </div>
                         )}

                         <div>
                             <h4 className="text-sm font-bold text-gray-800 mb-4">EU ad delivery</h4>
                             <div className="p-4 border border-gray-200 rounded-lg mb-6">
                                 <div className="mb-2"><h5 className="text-sm font-bold text-gray-900">Reach</h5></div>
                                 <div className="text-3xl font-normal text-gray-900 mb-2">{formatReach(ad.reach)}</div>
                                 <div className="text-xs text-gray-500">Accounts Center accounts in the EU that saw this ad at least once.</div>
                             </div>

                             {demoData.length > 0 && (
                                 <div className="mb-6">
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
                                                            <span className="font-medium text-[10px]">
                                                                {((d.female || 0) > (d.male || 0)) ? `FEMALE ${formatReach(d.female || 0)}` : `MALE ${formatReach(d.male || 0)}`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {breakdownData.length > 0 ? (
                                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                                     <div className="max-h-60 overflow-y-auto">
                                         <table className="w-full text-sm text-left relative">
                                             <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0">
                                                 <tr>
                                                     <th className="px-4 py-3">Location</th>
                                                     <th className="px-4 py-3">Age Range</th>
                                                     <th className="px-4 py-3">Gender</th>
                                                     <th className="px-4 py-3 text-right">Reach</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {breakdownData.map((item: any, idx: number) => (
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
                             ) : (
                                <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded border border-gray-100 text-center">
                                    No detailed breakdown available for this region.
                                </div>
                             )}
                         </div>
                     </div>
                </CollapsibleSection>

                <CollapsibleSection title="About the advertiser" icon={ShieldCheck} defaultOpen={false}>
                    <div className="flex items-center gap-4 mb-5">
                         <div className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xl border border-gray-100 flex-shrink-0 overflow-hidden">
                            {ad.avatar ? <img src={ad.avatar} className="w-full h-full object-cover"/> : ad.page_name.charAt(0)}
                         </div>
                         <div className="font-bold text-gray-900 text-lg">{ad.page_name}</div>
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
                        <Download className="w-4 h-4" /> Download Media
                    </button>
                    {isSaved ? (
                        <button onClick={onRemove} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                            <X className="w-4 h-4" /> Remove Creative
                        </button>
                    ) : (
                        <button onClick={() => onSave(ad)} className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                            <Save className="w-4 h-4" /> Save Creative
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
      if (!sortConfig.key && lastOpenedIds.length > 0) {
         ads.sort((a, b) => {
             const idxA = lastOpenedIds.indexOf(a.id);
             const idxB = lastOpenedIds.indexOf(b.id);
             if (idxA !== -1 && idxB !== -1) return idxA - idxB;
             if (idxA !== -1) return -1;
             if (idxB !== -1) return 1;
             return 0;
         });
         return ads;
      }
      if (!sortConfig.key) return ads;
      return ads.sort((a, b) => {
          let aValue = 0;
          let bValue = 0;
          if (sortConfig.key === 'reach') {
              aValue = a.targeting?.reach_estimate || 0;
              bValue = b.targeting?.reach_estimate || 0;
          } else if (sortConfig.key === 'score') {
              aValue = a.efficiency_score || 0;
              bValue = b.efficiency_score || 0;
          } else if (sortConfig.key === 'date') {
              aValue = new Date(a.start_date).getTime();
              bValue = new Date(b.start_date).getTime();
          }
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
                {/* Header & Tabs */}
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
                            {openTabs.length > 1 && (<button onClick={handleClearOpenAds} className="text-xs font-medium text-gray-500 hover:text-gray-800 underline decoration-gray-300 hover:decoration-gray-600 underline-offset-2 transition-all mr-2">Clear open ads</button>)}
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    {showTabs && (
                        <div className="flex items-end px-6 gap-2 overflow-x-auto no-scrollbar">
                            {openTabs.map(tabId => {
                                if (tabId === 'overview') {
                                    return (<button key="overview" onClick={() => setActiveTabId('overview')} className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x border-b-0 flex-shrink-0 ${activeTabId === 'overview' ? 'bg-white border-gray-200 text-brand-600 shadow-[0_2px_0_0_#fff]' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`} style={{ marginBottom: -1 }}><LayoutGrid className="w-4 h-4" />Overview</button>);
                                }
                                const isTabActive = activeTabId === tabId;
                                return (<button key={tabId} onClick={() => setActiveTabId(tabId)} className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-t border-x border-b-0 relative pr-9 flex-shrink-0 ${isTabActive ? 'bg-white border-gray-200 text-brand-600 shadow-[0_2px_0_0_#fff]' : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'}`}><div className="flex items-center gap-2"><span className="font-bold">ID: {getDisplayId(tabId)}</span></div><div onClick={(e) => handleCloseTab(e, tabId)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></div></button>);
                            })}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden relative bg-white">
                    {activeTabId === 'overview' && (
                        <div className="h-full overflow-y-auto p-6 animate-in fade-in duration-300">
                             <div className="max-w-5xl mx-auto">
                                 <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-gray-900">Version History & Performance</h3><div className="flex gap-2"><button className="text-sm text-gray-600 bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-50">Export CSV</button></div></div>
                                 <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                     <table className="w-full text-sm text-left">
                                         <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                             <tr>
                                                 <th className="px-6 py-4">Ad Version</th>
                                                 <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none group" onClick={() => handleSort('date')}><div className="flex items-center gap-1">Start Date{renderSortIcon('date')}</div></th>
                                                 <th className="px-6 py-4">Targeting</th>
                                                 <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors select-none group" onClick={() => handleSort('reach')}><div className="flex items-center justify-end gap-1">Reach Est.{renderSortIcon('reach')}</div></th>
                                                 <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 transition-colors select-none group" onClick={() => handleSort('score')}><div className="flex items-center justify-end gap-1">Viral Score{renderSortIcon('score')}</div></th>
                                                 <th className="px-6 py-4 text-right">Action</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-100">
                                             {sortedGroup.map((rawAd: any) => {
                                                 const ad = normalizeAdData(rawAd);
                                                 let thumbUrl = null;
                                                 if (ad.snapshot?.images?.length > 0) thumbUrl = ad.snapshot.images[0].resized_image_url;
                                                 else if (ad.snapshot?.cards?.length > 0) thumbUrl = ad.snapshot.cards[0].resized_image_url || ad.snapshot.cards[0].original_image_url;
                                                 else if (ad.snapshot?.videos?.length > 0) thumbUrl = ad.snapshot.videos[0].video_preview_image_url;

                                                 return (
                                                 <tr key={ad.id} onClick={() => handleOpenAd(ad.id)} className="hover:bg-gray-50 transition-colors group/row cursor-pointer">
                                                     <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden flex-shrink-0">{thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-gray-300" /></div>}</div><div><div className="font-bold text-gray-900">ID: {getDisplayId(ad.id)}</div><div className="text-xs text-gray-500">{ad.isActive ? 'Active' : 'Inactive'}</div></div></div></td>
                                                     <td className="px-6 py-4 text-gray-600">{new Date(ad.start_date).toLocaleDateString()}</td>
                                                     <td className="px-6 py-4 text-gray-600">{ad.targeting?.locations?.length ? (ad.targeting.locations.length > 3 ? `${ad.targeting.locations.length} Countries` : ad.targeting.locations.join(', ')) : 'Global'}</td>
                                                     <td className="px-6 py-4 text-gray-900 font-medium text-right">{formatReach(ad.reach)}</td>
                                                     <td className="px-6 py-4 text-right">{ad.efficiency_score && <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ad.efficiency_score >= 80 ? 'bg-green-100 text-green-800' : ad.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{ad.efficiency_score}</span>}</td>
                                                     <td className="px-6 py-4 text-right"><button onClick={(e) => { e.stopPropagation(); handleOpenAd(ad.id); }} className="text-brand-600 hover:text-brand-700 font-semibold text-sm hover:underline">Analyze</button></td>
                                                 </tr>
                                             )})}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                        </div>
                    )}

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

  // --- TIKTOK AD RENDER LOGIC ---
  const ad = group[0] as TikTokAd;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
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
                         {/* FIX: name -> nickName */}
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