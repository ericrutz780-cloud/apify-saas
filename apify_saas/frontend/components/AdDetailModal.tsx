import React, { useState, useEffect } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Globe, ChevronDown, ChevronUp, Download, Save, Facebook, Instagram, CheckCircle2, FileText, User, ExternalLink, Play, Eye, ThumbsUp, BarChart3, MapPin } from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  group: any[]; 
  type: 'meta' | 'tiktok' | undefined;
}

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <div className="flex items-center gap-3"><Icon className="w-5 h-5 text-gray-500" /><span className="font-semibold text-gray-900 text-sm">{title}</span></div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && <div className="p-4 bg-white border-t border-gray-100">{children}</div>}
        </div>
    );
};

const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, group, type = 'meta', onSave, onRemove, isSaved }) => {
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => { setActiveTab(0); }, [group]);
  if (!isOpen || !group || group.length === 0) return null;

  const ad = group[activeTab];
  const isMeta = type === 'meta';
  const reachValue = ad.reach || 0;
  
  // Demografie Daten vorbereiten
  const demoData = ad.demographics || [];
  const locations = ad.target_locations || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        {/* LEFT COLUMN: Media (Original) */}
        <div className="w-full md:w-5/12 bg-black flex flex-col relative bg-neutral-900 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center p-4">
                 {isMeta ? (
                     ad.snapshot?.videos?.length > 0 ? (
                         <video src={ad.snapshot.videos[0].video_hd_url} controls className="max-h-full max-w-full rounded-lg shadow-2xl" />
                     ) : <img src={ad.snapshot?.images?.[0]?.resized_image_url || ad.snapshot?.cards?.[0]?.resized_image_url} className="max-h-full max-w-full rounded-lg" />
                 ) : (
                    <video src={ad.videoUrl} controls className="max-h-full max-w-full rounded-lg" />
                 )}
            </div>
            <div className="absolute bottom-0 w-full p-4 bg-neutral-800 border-t border-white/10 flex justify-between">
                <a href={isMeta ? ad.snapshot?.link_url : ad.landingPageUrl} target="_blank" className="text-white text-sm flex gap-2 items-center hover:text-blue-400"><ExternalLink className="w-4 h-4"/> Landing Page</a>
                <button className="text-white text-sm flex gap-2 items-center hover:text-green-400"><Download className="w-4 h-4"/> Download</button>
            </div>
        </div>

        {/* RIGHT COLUMN: Details */}
        <div className="w-full md:w-7/12 bg-white flex flex-col h-[60vh] md:h-auto overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                        {ad.avatar ? <img src={ad.avatar} className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-3 text-gray-400" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{isMeta ? ad.page_name : ad.authorMeta?.nickName}</h2>
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                            {isMeta ? <span className="flex items-center gap-1"><Facebook className="w-3 h-3" /> Meta</span> : <span>TikTok</span>}
                            <span>ID: {ad.id}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-black" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1"><BarChart3 className="w-4 h-4" /><span className="text-xs font-bold uppercase">Reach</span></div>
                        <div className="text-2xl font-bold text-indigo-900">{reachValue.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1"><CheckCircle2 className="w-4 h-4" /><span className="text-xs font-bold uppercase">Status</span></div>
                        <div className="text-lg font-bold text-emerald-900">{ad.isActive ? "Active" : "Inactive"}</div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-600 mb-1"><ThumbsUp className="w-4 h-4" /><span className="text-xs font-bold uppercase">Likes</span></div>
                        <div className="text-lg font-bold text-blue-900">{ad.likes?.toLocaleString()}</div>
                    </div>
                </div>

                <CollapsibleSection title="Ad Text" icon={FileText} defaultOpen={true}>
                    <p className="text-gray-600 whitespace-pre-wrap text-sm">{isMeta ? ad.snapshot?.body?.text : ad.text}</p>
                </CollapsibleSection>

                {/* NEU: Targeting & Demographics */}
                <CollapsibleSection title="Targeting & Demographics" icon={Globe} defaultOpen={true}>
                    <div className="space-y-4">
                        {/* Locations */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Active Locations</h4>
                            <div className="flex flex-wrap gap-2">
                                {locations.length > 0 ? locations.map((loc: any, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {loc.name || loc}
                                    </span>
                                )) : <span className="text-sm text-gray-400 italic">No specific location data</span>}
                            </div>
                        </div>

                        {/* Demographics Chart (Simple List) */}
                        {demoData.length > 0 && (
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Audience Breakdown (Top)</h4>
                                <div className="space-y-3">
                                    {demoData.slice(0, 3).map((countryData: any, i: number) => (
                                        <div key={i}>
                                            <p className="text-xs font-semibold text-gray-800 mb-1">Country: {countryData.country}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {countryData.age_gender_breakdowns.slice(0, 4).map((d: any, j: number) => (
                                                    <div key={j} className="flex justify-between text-xs bg-gray-50 p-1.5 rounded">
                                                        <span className="text-gray-500">{d.age_range}</span>
                                                        <span className="font-medium">
                                                            {((d.female || 0) > (d.male || 0)) ? '👩 ' + (d.female || 0) : '👨 ' + (d.male || 0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetailModal;