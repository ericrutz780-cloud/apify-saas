import React from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Heart, Share2, Eye, DollarSign, Calendar, Hash, Globe, Download, Save, ExternalLink, Play, Trash2 } from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  data: MetaAd | TikTokAd | null;
  type: 'meta' | 'tiktok' | undefined;
}

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
};

const MetricBox = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</div>
        <div className="text-lg font-bold text-gray-900">{value}</div>
    </div>
);

const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, onSave, onRemove, isSaved, data, type }) => {
  if (!isOpen || !data || !type) return null;

  // Stop propagation when clicking modal content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSaveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onSave && data && type) {
          onSave(data, type);
      }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onRemove) {
          onRemove();
          onClose(); 
      }
  };

  // Extract Data based on type
  const isMeta = type === 'meta';
  const metaAd = data as MetaAd;
  const tikTokAd = data as TikTokAd;

  // Meta Data Mappings
  const metaMediaUrl = isMeta ? (metaAd.snapshot.videos.length > 0 ? metaAd.snapshot.videos[0].video_hd_url : metaAd.snapshot.images[0]?.resized_image_url) : null;
  const isMetaVideo = isMeta && metaAd.snapshot.videos.length > 0;
  
  // TikTok Data Mappings
  const tikTokMediaUrl = !isMeta ? tikTokAd.videoMeta.coverUrl : null; // Fallback to cover for now as webVideoUrl might not be direct mp4
  
  // Common Fields
  const id = isMeta ? metaAd.id : tikTokAd.id;
  const date = new Date(isMeta ? metaAd.start_date : tikTokAd.createTimeISO).toLocaleDateString();
  const avatar = isMeta 
    ? (
        <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
            {metaAd.page_name.charAt(0)}
        </div>
      )
    : <img src={tikTokAd.authorMeta.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />;
  
  const name = isMeta ? metaAd.page_name : tikTokAd.authorMeta.nickName;
  const handle = isMeta ? `@${metaAd.page_name.replace(/\s+/g, '').toLowerCase()}` : `@${tikTokAd.authorMeta.nickName}`;
  
  const headline = isMeta ? (metaAd.snapshot.body.text ? "Ad Copy" : "No Text") : "Ad Copy";
  const bodyText = isMeta ? metaAd.snapshot.body.text : tikTokAd.text;
  
  const ctaText = isMeta ? metaAd.snapshot.cta_text : "View on TikTok";
  const ctaLink = isMeta ? metaAd.snapshot.link_url : tikTokAd.webVideoUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
      
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 ring-1 ring-black/5"
        onClick={handleContentClick}
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-500 hover:text-gray-900 hover:bg-white transition-all shadow-sm border border-gray-200"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Left Side: Media */}
        <div className="w-full md:w-5/12 bg-black flex items-center justify-center relative overflow-hidden">
            {isMeta ? (
                isMetaVideo ? (
                    <video src={metaMediaUrl} controls className="w-full h-full object-contain max-h-[50vh] md:max-h-full" />
                ) : (
                    <img src={metaMediaUrl} alt="Ad Creative" className="w-full h-full object-contain" />
                )
            ) : (
                 // TikTok Video Representation
                 <div className="relative w-full h-full">
                     <img src={tikTokMediaUrl} alt="Cover" className="w-full h-full object-cover blur-sm opacity-50 absolute" />
                     <img src={tikTokMediaUrl} alt="Cover" className="w-full h-full object-contain relative z-10" />
                     <a href={ctaLink} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center z-20 group">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                     </a>
                 </div>
            )}
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-7/12 flex flex-col h-full bg-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                {avatar}
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-500">{handle}</p>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Metrics Grid */}
                <div className={`grid gap-3 ${isMeta ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    
                    {/* Conditional Metrics */}
                    {isMeta ? (
                        <>
                            <MetricBox 
                                label="Likes" 
                                value={formatNumber(metaAd.likes)} 
                            />
                            <MetricBox 
                                label="Spend" 
                                value={formatCurrency(metaAd.spend)} 
                            />
                            <MetricBox 
                                label="Impr." 
                                value={formatNumber(metaAd.impressions)} 
                            />
                        </>
                    ) : (
                        <>
                            <MetricBox 
                                label="Views" 
                                value={formatNumber(tikTokAd.playCount)} 
                            />
                            <MetricBox 
                                label="Likes" 
                                value={formatNumber(tikTokAd.diggCount)} 
                            />
                            <MetricBox 
                                label="Shares" 
                                value={formatNumber(tikTokAd.shareCount)} 
                            />
                            <MetricBox 
                                label="Saves" 
                                value={formatNumber(tikTokAd.collectCount)} 
                            />
                        </>
                    )}
                </div>

                {/* Ad Copy */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded">
                           {isMeta ? "Headline" : "Caption"}
                        </span>
                        <h4 className="font-semibold text-gray-900 text-sm">
                            {headline === "Ad Copy" ? "Primary Text" : headline}
                        </h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-gray-100">
                        {bodyText || <span className="text-gray-400 italic">No text provided.</span>}
                    </div>
                </div>

                {/* Call To Action */}
                <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-sm">Call To Action</h4>
                    <a 
                        href={ctaLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-center font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {ctaText || "Learn More"}
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Metadata */}
                <div className="space-y-3 text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" /> 
                        <span>First seen: <span className="text-gray-900 font-medium">{date}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-gray-400" /> 
                        <span className="truncate">ID: <span className="text-gray-900 font-medium">{id}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" /> 
                        <span>Region: <span className="text-gray-900 font-medium">Global</span></span>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm">
                    <Download className="w-4 h-4" />
                    Download Media
                </button>
                
                {isSaved ? (
                    <button 
                        onClick={handleRemoveClick}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Remove Creative
                    </button>
                ) : (
                    <button 
                        onClick={handleSaveClick}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm"
                    >
                        <Save className="w-4 h-4" />
                        Save Creative
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetailModal;