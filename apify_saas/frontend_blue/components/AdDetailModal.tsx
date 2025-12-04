import React, { useState, useEffect } from 'react';
import { MetaAd, TikTokAd } from '../types';
import { X, Save, ExternalLink, Play, ChevronLeft, ChevronRight, Layers, Download } from 'lucide-react';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (ad: MetaAd | TikTokAd, type: 'meta' | 'tiktok') => void;
  onRemove?: () => void;
  isSaved?: boolean;
  data: MetaAd | TikTokAd | null;
  type: 'meta' | 'tiktok' | undefined;
}

const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, onSave, onRemove, isSaved, data, type }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
      if (isOpen) setCurrentCardIndex(0);
  }, [isOpen, data]);

  if (!isOpen || !data || !type) return null;

  const isMeta = type === 'meta';
  const metaAd = data as MetaAd;
  const tikTokAd = data as TikTokAd;

  // --- Meta Carousel Logic ---
  const cards = isMeta ? (metaAd.snapshot.cards || []) : [];
  const isCarousel = cards.length > 0;
  
  let currentMediaUrl = null;
  let currentVideoUrl = null;
  let currentBody = "";
  let currentLink = "";
  let currentCta = "";

  if (isMeta) {
      if (isCarousel) {
          const card = cards[currentCardIndex];
          currentMediaUrl = card.resized_image_url || card.original_image_url || card.video_preview_image_url;
          currentVideoUrl = card.video_hd_url || card.video_sd_url;
          currentBody = card.body || metaAd.snapshot.body?.text || "";
          currentLink = card.link_url || metaAd.snapshot.link_url;
          currentCta = card.cta_text || metaAd.snapshot.cta_text;
      } else {
          const videos = metaAd.snapshot.videos || [];
          const images = metaAd.snapshot.images || [];
          if (videos.length > 0) {
              currentVideoUrl = videos[0].video_hd_url;
              currentMediaUrl = videos[0].video_preview_image_url; 
          } else if (images.length > 0) {
              currentMediaUrl = images[0].resized_image_url;
          }
          currentBody = metaAd.snapshot.body?.text || "";
          currentLink = metaAd.snapshot.link_url;
          currentCta = metaAd.snapshot.cta_text;
      }
  } else {
      currentMediaUrl = tikTokAd.videoMeta.coverUrl;
      currentLink = tikTokAd.webVideoUrl;
      currentBody = tikTokAd.text;
      currentCta = "View on TikTok";
  }

  const handleNextCard = () => {
      if (currentCardIndex < cards.length - 1) setCurrentCardIndex(curr => curr + 1);
  };

  const handlePrevCard = () => {
      if (currentCardIndex > 0) setCurrentCardIndex(curr => curr - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-gray-500 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"><X className="w-5 h-5" /></button>

        {/* --- LEFT: MEDIA --- */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative overflow-hidden group">
            {currentVideoUrl ? (
                <video src={currentVideoUrl} controls className="w-full h-full object-contain max-h-[50vh] md:max-h-full" poster={currentMediaUrl || undefined} />
            ) : (
                <img src={currentMediaUrl || 'https://placehold.co/600x400?text=No+Media'} alt="Creative" className="w-full h-full object-contain" />
            )}

            {isCarousel && (
                <>
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                        {cards.map((_, idx) => (
                            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentCardIndex ? 'bg-white scale-125' : 'bg-white/40'}`} />
                        ))}
                    </div>
                    {currentCardIndex > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); handlePrevCard(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"><ChevronLeft className="w-6 h-6" /></button>
                    )}
                    {currentCardIndex < cards.length - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); handleNextCard(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"><ChevronRight className="w-6 h-6" /></button>
                    )}
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Card {currentCardIndex + 1} / {cards.length}
                    </div>
                </>
            )}
        </div>

        {/* --- RIGHT: DETAILS --- */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-white border-l border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                {isMeta ? (
                    <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg border border-brand-100">
                        {metaAd.page_name?.charAt(0)}
                    </div>
                ) : (
                    <img src={tikTokAd.authorMeta.avatarUrl} className="w-12 h-12 rounded-full border border-gray-200" />
                )}
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{isMeta ? metaAd.page_name : tikTokAd.authorMeta.nickName}</h3>
                    <p className="text-sm text-gray-500">
                        {isMeta ? (isCarousel ? 'Carousel Ad' : 'Single Ad') : 'TikTok Ad'} • {new Date(isMeta ? metaAd.start_date : tikTokAd.createTimeISO).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Likes</div>
                        <div className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(isMeta ? metaAd.likes : tikTokAd.diggCount)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{isMeta ? 'Impressions' : 'Views'}</div>
                        <div className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(isMeta ? metaAd.impressions : tikTokAd.playCount)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{isMeta ? 'Spend' : 'Shares'}</div>
                        <div className="text-lg font-bold text-gray-900">{isMeta ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metaAd.spend) : new Intl.NumberFormat('en-US', { notation: "compact" }).format(tikTokAd.shareCount)}</div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Primary Text</h4>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {currentBody || <span className="italic text-gray-400">No text provided for this card.</span>}
                    </div>
                </div>

                <div>
                    <a href={currentLink} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-3 bg-blue-50 text-blue-600 font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                        {currentCta || 'Learn More'} <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                    <Download className="w-4 h-4" /> Download Media
                </button>
                {isSaved ? (
                    <button onClick={onRemove} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-all shadow-sm shadow-red-200">
                        <X className="w-4 h-4" /> Remove
                    </button>
                ) : (
                    <button onClick={() => onSave && data && type && onSave(data, type)} className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition-all shadow-sm shadow-brand-200">
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