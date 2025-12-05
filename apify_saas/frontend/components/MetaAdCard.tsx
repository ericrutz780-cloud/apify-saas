import React, { useState } from 'react';
import { Play, Image, FileWarning, ExternalLink, AlertCircle, ThumbsUp, Eye, DollarSign } from 'lucide-react';

interface AdProps {
  ad: any;
  viewMode?: 'condensed' | 'details';
  platformContext?: string;
  onClick?: (data: any) => void;
}

const formatNumber = (num: number) => {
  if (!num || num < 0) return '-';
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

const MetaAdCard: React.FC<AdProps> = ({ ad, onClick }) => {
  const [imgError, setImgError] = useState(false);

  if (!ad) return null;

  // Daten aus dem Adapter
  const { 
    pageName, 
    avatar, 
    status, 
    id, 
    body, 
    media, 
    ctaText,
    linkUrl,
    likes,       // Hier sind die Likes!
    spend,       // Hier ist der Spend (oft 0)
    impressions  // Hier sind die Impressions (oft 0)
  } = ad;

  // Body-Text sicher abrufen
  const bodyText = (ad.snapshot?.body && ad.snapshot.body.text) ? ad.snapshot.body.text : null;
  const displayFormat = ad.snapshot?.display_format || "N/A";

  const handleProfileError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    e.currentTarget.nextElementSibling?.classList.remove('hidden');
  };

  return (
    <div 
      onClick={() => onClick && onClick(ad)}
      className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      
      {/* HEADER */}
      <div className="flex items-center p-3 gap-3 border-b border-gray-50 bg-white">
        <div className="relative w-10 h-10 flex-shrink-0">
          {avatar ? (
            <img 
              src={avatar} 
              alt={pageName} 
              className="w-full h-full rounded-full object-cover border border-gray-100"
              onError={handleProfileError}
            />
          ) : null}
          <div className={`w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 ${avatar ? 'hidden' : ''}`}>
             <span className="font-bold text-sm uppercase">{(pageName || "?").charAt(0)}</span>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm truncate text-gray-900" title={pageName}>
            {pageName}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-green-500' : 'bg-red-400'}`}></span>
            <span className="text-[10px] text-gray-400 font-mono">ID: {id}</span>
          </div>
        </div>
      </div>

      {/* MEDIA AREA */}
      <div className="relative w-full aspect-[16/9] bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
        {media?.url && !imgError ? (
          <>
            {media.type === 'video' ? (
               <div className="relative w-full h-full">
                 <img 
                    src={media.poster || media.url} 
                    alt="Video Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                 />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm">
                      <Play className="w-5 h-5 text-gray-900 fill-gray-900 ml-0.5" />
                    </div>
                 </div>
               </div>
            ) : (
                <img 
                  src={media.url} 
                  alt="Creative" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImgError(true)}
                  loading="lazy"
                />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center h-full w-full bg-gray-100">
            <div className="p-2 bg-white rounded-full mb-2 border border-gray-200">
                {imgError ? <AlertCircle className="w-5 h-5 text-red-300" /> : <Image className="w-5 h-5 text-gray-300" />}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {imgError ? "Image Expired" : "No Media Found"}
            </span>
          </div>
        )}
      </div>

      {/* NEU: METRICS BAR (Hier werden die Daten angezeigt!) */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
          <div className="py-2 px-1 text-center flex flex-col items-center justify-center">
              <div className="flex items-center text-gray-900 font-semibold text-xs">
                  <ThumbsUp className="w-3 h-3 mr-1 text-gray-400" /> 
                  {formatNumber(likes)}
              </div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Likes</span>
          </div>
          <div className="py-2 px-1 text-center flex flex-col items-center justify-center">
              <div className="flex items-center text-gray-900 font-semibold text-xs">
                  <Eye className="w-3 h-3 mr-1 text-gray-400" /> 
                  {formatNumber(impressions)}
              </div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Views</span>
          </div>
          <div className="py-2 px-1 text-center flex flex-col items-center justify-center">
              <div className="flex items-center text-gray-900 font-semibold text-xs">
                  <DollarSign className="w-3 h-3 mr-0.5 text-gray-400" /> 
                  {formatNumber(spend)}
              </div>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Spend</span>
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="p-4 flex-grow flex flex-col">
        {bodyText ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3 leading-relaxed">
            {bodyText}
          </p>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100 text-orange-600/80 italic text-xs mt-1">
            <FileWarning className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>No text content available</span>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 bg-white border-t border-gray-100 mt-auto flex justify-between items-center">
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider px-2 py-1 bg-gray-50 border border-gray-200 rounded">
          {displayFormat}
        </span>
        <a 
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow hover:border-brand-200"
        >
          {ctaText} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

    </div>
  );
};

export default MetaAdCard;