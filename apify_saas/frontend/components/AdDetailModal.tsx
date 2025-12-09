import React, { useState, useEffect } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Globe, Info, ChevronDown, ChevronUp, Users, ShieldCheck, Download, Save, Facebook, Instagram, CheckCircle2, FileText, User, Layers, ExternalLink, Play, Monitor, Hash, LayoutGrid, Eye, ThumbsUp, BarChart3 } from 'lucide-react';

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
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && <div className="p-4 bg-white border-t border-gray-100">{children}</div>}
        </div>
    );
};

const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, group, type = 'meta', onSave, onRemove, isSaved }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Reset tab when group changes
  useEffect(() => {
    setActiveTab(0);
  }, [group]);

  if (!isOpen || !group || group.length === 0) return null;

  const ad = group[activeTab];
  
  // Safe Accessor für Meta vs TikTok
  const isMeta = type === 'meta';
  
  // Wir nutzen ad.reach (vom Adapter normalisiert) oder Fallback
  const reachValue = ad.reach || ad.reachEstimate || ad.impressions || 0;
  
  const platform = isMeta ? (ad.publisher_platform ? ad.publisher_platform.join(', ') : 'Meta') : 'TikTok';
  const pageName = isMeta ? ad.page_name : ad.authorMeta?.nickName;
  const bodyText = isMeta ? (ad.snapshot?.body?.text || ad.body) : ad.text;
  const ctaText = isMeta ? ad.snapshot?.cta_text : ad.ctaType;
  const linkUrl = isMeta ? (ad.snapshot?.link_url || ad.link_url) : ad.landingPageUrl;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={handleBackdropClick}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white md:hidden">
            <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Media Preview */}
        <div className="w-full md:w-5/12 bg-black flex flex-col relative">
            {/* Version Switcher (if multiple ads in group) */}
            {group.length > 1 && (
                <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md rounded-lg p-1 flex gap-2 overflow-x-auto max-w-[calc(100%-4rem)]">
                    {group.map((item, idx) => (
                        <button
                            key={item.id || idx}
                            onClick={() => setActiveTab(idx)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                                activeTab === idx 
                                ? 'bg-white text-black shadow-sm' 
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            Ver. {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-neutral-900">
                 {/* Media Rendering Logic */}
                 {isMeta ? (
                     ad.snapshot?.videos?.length > 0 ? (
                         <video 
                             src={ad.snapshot.videos[0].video_hd_url || ad.snapshot.videos[0].video_sd_url} 
                             poster={ad.snapshot.videos[0].video_preview_image_url}
                             controls 
                             className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
                         />
                     ) : (ad.snapshot?.images?.length > 0 || ad.snapshot?.cards?.length > 0) ? (
                         <img 
                             src={
                                 ad.snapshot?.images?.[0]?.original_image_url || 
                                 ad.snapshot?.images?.[0]?.resized_image_url ||
                                 ad.snapshot?.cards?.[0]?.original_image_url ||
                                 ad.snapshot?.cards?.[0]?.resized_image_url
                             } 
                             className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
                             alt="Ad Creative"
                         />
                     ) : (
                         <div className="text-white/50 flex flex-col items-center">
                             <FileText className="w-12 h-12 mb-2 opacity-50" />
                             <span>No Media Available</span>
                         </div>
                     )
                 ) : (
                     /* TikTok Media */
                     <div className="relative w-full h-full flex items-center justify-center">
                        <video 
                             src={ad.videoUrl || ad.videoMeta?.downloadAddr} 
                             poster={ad.coverUrl || ad.videoMeta?.coverUrl}
                             controls 
                             className="max-h-full max-w-full object-contain rounded-lg" 
                         />
                     </div>
                 )}
            </div>
            
            {/* Action Bar (Download/Link) */}
            <div className="p-4 bg-neutral-800 border-t border-white/10 flex justify-between items-center">
                <a 
                    href={linkUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-white/90 hover:text-blue-400 transition-colors text-sm font-medium"
                >
                    <ExternalLink className="w-4 h-4" />
                    Visit Landing Page
                </a>
                <button className="flex items-center gap-2 text-white/90 hover:text-green-400 transition-colors text-sm font-medium">
                    <Download className="w-4 h-4" />
                    Download Media
                </button>
            </div>
        </div>

        {/* RIGHT COLUMN: Details & Metadata */}
        <div className="w-full md:w-7/12 bg-white flex flex-col h-[60vh] md:h-auto">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                <div className="flex items-start gap-4">
                     {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                        {ad.avatar || ad.page_profile_picture_url || ad.authorMeta?.avatarUrl ? (
                            <img src={ad.avatar || ad.page_profile_picture_url || ad.authorMeta?.avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-6 h-6" /></div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{pageName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {isMeta ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    <Facebook className="w-3 h-3" /> Meta / {platform}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-black/5 text-black border border-black/10">
                                    <Play className="w-3 h-3" /> TikTok
                                </span>
                            )}
                            <span className="text-xs text-gray-500">ID: {ad.id}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     {onSave && (
                        <button 
                            onClick={() => isSaved ? onRemove?.() : onSave(ad, type)}
                            className={`p-2 rounded-lg border transition-all ${
                                isSaved 
                                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' 
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            title={isSaved ? "Remove from Saved" : "Save Ad"}
                        >
                            {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors hidden md:block">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Performance / Stats Section (Primary Value) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* REACH CARD */}
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Reach</span>
                        </div>
                        <div className="text-2xl font-bold text-indigo-900">
                            {reachValue > 0 ? reachValue.toLocaleString() : "N/A"}
                        </div>
                        <div className="text-xs text-indigo-600/70 mt-1">Est. Audience</div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Status</span>
                        </div>
                        <div className="text-lg font-bold text-emerald-900">
                            {ad.isActive ? "Active" : "Inactive"}
                        </div>
                        <div className="text-xs text-emerald-600/70 mt-1">Currently running</div>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <Layers className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Formats</span>
                        </div>
                        <div className="text-lg font-bold text-orange-900">
                            {group.length} Version{group.length > 1 && 's'}
                        </div>
                         <div className="text-xs text-orange-600/70 mt-1">In this group</div>
                    </div>

                    {isMeta ? (
                         <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Likes</span>
                            </div>
                            <div className="text-lg font-bold text-blue-900">
                                {ad.likes > 0 ? ad.likes.toLocaleString() : "Hidden"}
                            </div>
                             <div className="text-xs text-blue-600/70 mt-1">Page Likes</div>
                        </div>
                    ) : (
                         <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Views</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                                {ad.playCount?.toLocaleString() || "N/A"}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Ad Copy Section */}
                <CollapsibleSection title="Primary Ad Text" icon={FileText} defaultOpen={true}>
                    <div className="prose prose-sm max-w-none text-gray-600">
                        {bodyText ? (
                            <p className="whitespace-pre-wrap leading-relaxed">{bodyText}</p>
                        ) : (
                            <p className="italic text-gray-400">No primary text detected.</p>
                        )}
                    </div>
                     {ctaText && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                             <span className="text-xs font-semibold text-gray-400 uppercase">Call to Action</span>
                             <div className="mt-1 inline-block px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700 border border-gray-200">
                                {ctaText}
                             </div>
                        </div>
                    )}
                </CollapsibleSection>

                {/* 3. Targeting & Demographics (WICHTIG für EU Reach) */}
                <CollapsibleSection title="Targeting & Demographics" icon={Globe} defaultOpen={true}>
                    <div className="space-y-4">
                        {/* Locations */}
                        <div>
                             <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Target Locations</h4>
                             <div className="flex flex-wrap gap-2">
                                {ad.targeting?.locations?.length > 0 ? (
                                    ad.targeting.locations.map((loc: any, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 font-medium">
                                            {typeof loc === 'string' ? loc : loc.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-400 italic">No location data available</span>
                                )}
                             </div>
                        </div>

                         {/* EU Data Specifics */}
                         {ad.transparency_regions && (
                             <div className="pt-3 border-t border-gray-100">
                                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">EU Transparency Data</h4>
                                 <div className="text-sm text-gray-600">
                                    <p>EU Total Reach: <strong>{reachValue.toLocaleString()}</strong></p>
                                    {ad.transparency_regions?.beneficiary && <p>Beneficiary: {ad.transparency_regions.beneficiary}</p>}
                                    {ad.transparency_regions?.payer && <p>Payer: {ad.transparency_regions.payer}</p>}
                                 </div>
                             </div>
                         )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Gender</h4>
                                <p className="text-sm text-gray-700 font-medium">{ad.targeting?.genders?.join(', ') || "All"}</p>
                             </div>
                             <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Age</h4>
                                <p className="text-sm text-gray-700 font-medium">{ad.targeting?.ages?.join(', ') || "18-65+"}</p>
                             </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 4. Technical Details */}
                <CollapsibleSection title="Technical Details" icon={ShieldCheck}>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-500 text-xs">Started Date</span>
                            <span className="font-medium">{new Date(ad.start_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs">Ad ID</span>
                            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{ad.id}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs">Library URL</span>
                            <a href={ad.ad_library_url} target="_blank" className="text-blue-600 hover:underline truncate block">View in Library</a>
                        </div>
                     </div>
                </CollapsibleSection>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                 Data provided by AdSpy Pro Intelligence
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdDetailModal;