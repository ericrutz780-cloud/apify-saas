
import React from 'react';
import { MetaAd } from '../types';
import { ExternalLink, Facebook, Instagram, Info, Globe, Heart, Eye, DollarSign, Clock } from 'lucide-react';

interface MetaAdCardProps {
  ad: MetaAd;
  viewMode?: 'condensed' | 'details';
  onClick: (ad: MetaAd) => void;
  platformContext?: 'facebook' | 'instagram';
}

const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
};

const MetaAdCard: React.FC<MetaAdCardProps> = ({ ad, viewMode = 'details', onClick, platformContext }) => {
  const { snapshot } = ad;

  const hasVideo = snapshot.videos && snapshot.videos.length > 0;
  const mediaUrl = hasVideo ? snapshot.videos[0].video_hd_url : (snapshot.images.length > 0 ? snapshot.images[0].resized_image_url : null);
  const daysActive = Math.floor((new Date().getTime() - new Date(ad.start_date).getTime()) / (1000 * 3600 * 24));

  // Helper to safely extract hostname without crashing on invalid URLs
  const getDisplayDomain = (url: string) => {
    try {
        if (!url || url === '#' || url.trim() === '') return 'example.com';
        const urlToParse = url.startsWith('http') ? url : `https://${url}`;
        return new URL(urlToParse).hostname.replace('www.', '');
    } catch (e) {
        return 'example.com';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
      // Prevent click if clicking on CTA button or other interactive elements
      if ((e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('button')) {
          return;
      }
      onClick(ad);
  };

  // Split text into body and hashtags
  const fullText = snapshot.body.text || "";
  // Regex to find hashtags
  const hashtagsMatch = fullText.match(/#[a-z0-9_]+/gi);
  const hashtags = hashtagsMatch ? hashtagsMatch.join(' ') : "";
  // Remove hashtags from body text for cleaner separation
  const bodyText = fullText.replace(/#[a-z0-9_]+/gi, '').trim();

  // Determine which icon to show
  // If platformContext is provided, show that icon. 
  // Otherwise, fallback to: if has instagram -> instagram, else facebook.
  const showInstagram = platformContext === 'instagram' || (!platformContext && ad.publisher_platform.includes('instagram'));
  const showFacebook = platformContext === 'facebook' || (!platformContext && !showInstagram);

  return (
    <div 
        onClick={handleCardClick}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      
      {/* 1. Media Content - Always visible */}
      <div className="bg-gray-100 aspect-video relative overflow-hidden border-b border-gray-100">
        {mediaUrl ? (
          hasVideo ? (
             <video 
                src={mediaUrl} 
                controls 
                onClick={(e) => e.stopPropagation()} // Allow controls to work without opening modal
                className="w-full h-full object-contain bg-black"
                poster={snapshot.images[0]?.resized_image_url} 
             />
          ) : (
            <img src={mediaUrl} alt="Ad Creative" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm font-medium">No Preview</span>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
             <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-700 shadow-sm flex items-center">
                <Clock className="w-3 h-3 mr-1 text-gray-500" />
                {daysActive > 0 ? `${daysActive}d` : 'New'}
             </div>
        </div>
        
        <div className="absolute top-3 right-3">
             <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                 {showInstagram ? (
                     <Instagram className="w-4 h-4 text-[#E4405F]" />
                 ) : (
                     <Facebook className="w-4 h-4 text-[#1877F2]" />
                 )}
             </div>
        </div>
      </div>

      {/* 2. Metrics Row - Always visible */}
      <div className="grid grid-cols-3 border-b border-gray-100 divide-x divide-gray-100 bg-gray-50/50">
          <div className="p-3 text-center">
              <div className="flex items-center justify-center text-gray-900 font-semibold text-sm gap-1">
                  <Heart className="w-3.5 h-3.5 text-gray-400" />
                  {formatNumber(ad.likes)}
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">Likes</div>
          </div>
          <div className="p-3 text-center">
              <div className="flex items-center justify-center text-gray-900 font-semibold text-sm gap-1">
                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                  {formatNumber(ad.impressions)}
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">Impr.</div>
          </div>
          <div className="p-3 text-center">
              <div className="flex items-center justify-center text-gray-900 font-semibold text-sm gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                  {formatCurrency(ad.spend)}
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">Spend</div>
          </div>
      </div>

      {/* DETAILS VIEW ONLY - Header & Ad Copy */}
      {viewMode === 'details' && (
        <div className="flex-1 flex flex-col">
            {/* Identity Header */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm">
                    {ad.page_name.charAt(0)}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight group-hover:text-brand-600 transition-colors" title={ad.page_name}>
                    {ad.page_name}
                </h3>
            </div>

            {/* Ad Copy - Fixed Height Layout */}
            <div className="px-5 pb-4 flex flex-col gap-1">
                {/* Body Text: Fixed height for 2 lines */}
                <div className="text-sm text-gray-600 leading-snug font-normal line-clamp-2 h-10">
                    {bodyText || <span className="text-gray-300 italic">No description</span>}
                </div>
                
                {/* Hashtags: Fixed height for 1 line */}
                <div className="text-sm text-brand-600 leading-snug font-medium line-clamp-1 h-5">
                    {hashtags}
                </div>
            </div>
        </div>
      )}

      {/* 4. Footer / CTA area */}
      <div className={`bg-white mt-auto border-t border-gray-100 ${viewMode === 'condensed' ? 'p-3' : 'p-5'}`}>
        {viewMode === 'details' && (
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    <Globe className="w-3 h-3 mr-1.5 text-gray-400" />
                    <span className="truncate max-w-[150px]">
                        {getDisplayDomain(snapshot.link_url)}
                    </span>
                </div>
                <a href={ad.ad_library_url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    Ad ID: {ad.id.split('_')[1]}
                </a>
            </div>
        )}

        <a 
            href={snapshot.link_url} 
            onClick={(e) => e.stopPropagation()}
            target="_blank" 
            rel="noreferrer"
            className={`group/btn flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 font-semibold rounded-lg transition-all text-sm shadow-xs ${viewMode === 'condensed' ? 'py-2 text-xs' : 'py-2.5'}`}
        >
            {snapshot.cta_text || 'Learn More'}
            <ExternalLink className={`ml-2 text-gray-400 group-hover/btn:text-gray-600 transition-colors ${viewMode === 'condensed' ? 'w-3 h-3' : 'w-4 h-4'}`} />
        </a>
      </div>
    </div>
  );
};

export default MetaAdCard;
