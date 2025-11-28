import React, { useState } from 'react';
import { MetaAd } from '../types';
import { ExternalLink, Facebook, Instagram, Calendar, Info, Globe, ArrowRight } from 'lucide-react';

interface MetaAdCardProps {
  ad: MetaAd;
}

const MetaAdCard: React.FC<MetaAdCardProps> = ({ ad }) => {
  const [expanded, setExpanded] = useState(false);
  const { snapshot } = ad;

  const hasVideo = snapshot.videos && snapshot.videos.length > 0;
  const mediaUrl = hasVideo ? snapshot.videos[0].video_hd_url : (snapshot.images.length > 0 ? snapshot.images[0].resized_image_url : null);
  const daysActive = Math.floor((new Date().getTime() - new Date(ad.start_date).getTime()) / (1000 * 3600 * 24));

  // Helper to safely extract hostname without crashing on invalid URLs
  const getDisplayDomain = (url: string) => {
    try {
        if (!url || url === '#' || url.trim() === '') return 'example.com';
        // Ensure protocol exists for parsing
        const urlToParse = url.startsWith('http') ? url : `https://${url}`;
        return new URL(urlToParse).hostname.replace('www.', '');
    } catch (e) {
        return 'example.com';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300">
      
      {/* Header */}
      <div className="p-5 flex justify-between items-start border-b border-gray-50">
        <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-lg">
                {ad.page_name.charAt(0)}
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight" title={ad.page_name}>{ad.page_name}</h3>
                <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                   {ad.publisher_platform.includes('facebook') && <Facebook className="w-3 h-3 text-[#1877F2]" />}
                   {ad.publisher_platform.includes('instagram') && <Instagram className="w-3 h-3 text-[#E4405F]" />}
                   <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                   <span>{daysActive > 0 ? `Active ${daysActive}d` : 'New'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Ad Copy */}
      <div className="px-5 py-4">
        <div className={`text-sm text-gray-600 leading-relaxed font-normal ${expanded ? '' : 'line-clamp-3'}`}>
            {snapshot.body.text || <span className="text-gray-400 italic">No text provided</span>}
        </div>
        {snapshot.body.text && snapshot.body.text.length > 120 && (
            <button 
                onClick={() => setExpanded(!expanded)} 
                className="text-brand-600 text-xs font-medium mt-2 hover:text-brand-700 transition-colors focus:outline-none"
            >
                {expanded ? 'Show less' : 'Read more'}
            </button>
        )}
      </div>

      {/* Media Content */}
      <div className="bg-gray-100 aspect-square relative group overflow-hidden border-t border-gray-100">
        {mediaUrl ? (
          hasVideo ? (
             <video 
                src={mediaUrl} 
                controls 
                className="w-full h-full object-contain bg-black"
                poster={snapshot.images[0]?.resized_image_url} 
             />
          ) : (
            <img src={mediaUrl} alt="Ad Creative" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm font-medium">No Preview</span>
          </div>
        )}
      </div>

      {/* Footer / CTA area */}
      <div className="p-5 bg-white mt-auto border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <Globe className="w-3 h-3 mr-1.5 text-gray-400" />
                <span className="truncate max-w-[150px]">
                    {getDisplayDomain(snapshot.link_url)}
                </span>
             </div>
             <a href={ad.ad_library_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Ad ID: {ad.id.split('_')[1]}
             </a>
        </div>

        <a 
            href={snapshot.link_url} 
            target="_blank" 
            rel="noreferrer"
            className="group flex items-center justify-center w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-all text-sm shadow-xs"
        >
            {snapshot.cta_text || 'Learn More'}
            <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </a>
      </div>
    </div>
  );
};

export default MetaAdCard;