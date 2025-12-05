import React, { useState, useMemo } from 'react';
import { Play, ExternalLink, ThumbsUp, Eye, DollarSign } from 'lucide-react';
// Wir importieren den Typ zwar, aber nutzen intern eine "sichere" Version, 
// um Konflikte mit veralteten definitions in types.ts zu vermeiden.
import { MetaAd } from '../types';

// Definieren der Struktur, wie sie WIRKLICH aus dem Adapter kommt
interface SafeMetaAd {
    id: string;
    pageName?: string;
    avatar?: string | null;
    status?: string;
    date?: string;
    body?: string | null;
    media?: {
        type: 'video' | 'image' | 'carousel';
        url?: string | null;
        poster?: string | null;
    };
    ctaText?: string;
    linkUrl?: string;
    likes?: number | null;
    impressions?: number | null;
    spend?: number | null;
    [key: string]: any; // Erlaubt zusätzliche Felder ohne Fehler
}

interface MetaAdCardProps {
    ad: MetaAd; // Wir akzeptieren das Original...
    // FIX: viewMode ist jetzt optional, um Build-Fehler in App.tsx zu vermeiden
    viewMode?: 'condensed' | 'details';
    onClick: (ad: MetaAd) => void;
    platformContext?: 'facebook' | 'instagram';
}

const MetaAdCard: React.FC<MetaAdCardProps> = ({ ad, viewMode = 'condensed', onClick }) => {
    const [imageError, setImageError] = useState(false);

    // WICHTIG: Wir "casten" das ad Objekt auf unseren sicheren Typ.
    // Das bringt die roten Linien zum Schweigen, weil TS jetzt weiß, 
    // dass 'media', 'likes' etc. existieren dürfen.
    const safeAd = ad as unknown as SafeMetaAd;

    // Robuste Formatierung: Fängt null, undefined, -1 und falsche Typen ab
    const formatMetric = (val: any, prefix = '') => {
        // Strikte Prüfung auf null/undefined
        if (val === null || val === undefined || val === '') return 'N/A';
        
        const num = Number(val);

        // Prüfen auf ungültige Zahlen oder Fehlercodes (-1)
        if (isNaN(num) || num === -1 || num < 0) return 'N/A';

        try {
            return prefix + new Intl.NumberFormat('en-US', { 
                notation: "compact", 
                compactDisplay: "short",
                maximumFractionDigits: 1 
            }).format(num);
        } catch (e) {
            return 'N/A';
        }
    };

    // Helper: Bereinigt Text von Template-Platzhaltern wie {{product.brand}}
    const cleanText = (text: string | null | undefined) => {
        if (!text) return null;
        // Entfernt alles, was wie {{...}} aussieht, oder gibt null zurück, wenn nur das übrig bleibt
        const cleaned = text.replace(/\{\{.*?\}\}/g, '').trim();
        return cleaned.length > 0 ? cleaned : null;
    };

    const handleImageError = () => {
        setImageError(true);
    };

    // Prüfen, ob wir überhaupt EINE valide Metrik haben
    // Wenn nein, blenden wir die ganze Zeile aus, statt "N/A" anzuzeigen.
    const hasAnyMetrics = useMemo(() => {
        if (!safeAd) return false;
        const isValid = (val: any) => val !== null && val !== undefined && val !== -1 && val !== '';
        return isValid(safeAd.likes) || isValid(safeAd.impressions) || isValid(safeAd.spend);
    }, [safeAd]);

    // Sicherheits-Check
    if (!safeAd) return null;

    // Sichere Prüfung auf den Medientyp mit dem neuen safeAd Objekt
    const mediaType = safeAd.media?.type;
    const isVideo = mediaType === 'video';
    const mediaUrl = safeAd.media?.url;
    const mediaPoster = safeAd.media?.poster;

    // Fallback-Bild
    const displayImage = imageError || !mediaUrl 
        ? 'https://placehold.co/400x400?text=No+Preview' 
        : mediaUrl;

    // Text bereinigen (löst das "Ralph Christian Watches" Problem)
    const cleanedBody = cleanText(safeAd.body);

    return (
        <div 
            onClick={() => onClick(ad)}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
        >
            {/* Header: Avatar & Name */}
            <div className="p-3 flex items-center gap-3 border-b border-gray-100">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                    {safeAd.avatar ? (
                        <img 
                            src={safeAd.avatar} 
                            alt="" 
                            className="h-full w-full object-cover" 
                            onError={(e) => e.currentTarget.style.display = 'none'} 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs font-bold">
                            {(safeAd.pageName || '?').charAt(0)}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate" title={safeAd.pageName}>
                        {safeAd.pageName || 'Unknown Advertiser'}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 gap-2">
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${safeAd.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {safeAd.status || 'Inactive'}
                        </span>
                        <span>• {safeAd.date || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Media Bereich */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {isVideo ? (
                    <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                        <img 
                            src={mediaPoster || displayImage} 
                            alt="Video Thumbnail" 
                            className="w-full h-full object-cover opacity-90"
                            onError={handleImageError}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 text-brand-600 fill-brand-600 ml-0.5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <img 
                        src={displayImage} 
                        alt="Ad Creative" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={handleImageError}
                    />
                )}
            </div>

            {/* Content & Metriken */}
            <div className="p-3 flex flex-col flex-1 gap-3">
                {/* LOGIK-ÄNDERUNG: Wir zeigen diese Leiste NUR an, wenn wir tatsächlich Daten haben.
                   Wenn hasAnyMetrics false ist, wird dieser ganze Block übersprungen.
                */}
                {hasAnyMetrics && (
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
                        <div className="text-center" title="Likes (Estimated)">
                            <div className="flex items-center justify-center text-gray-400 mb-0.5">
                                <ThumbsUp className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                                {formatMetric(safeAd.likes)}
                            </span>
                        </div>
                        <div className="text-center border-l border-gray-100" title={isVideo ? "Video Views" : "Impressions"}>
                            <div className="flex items-center justify-center text-gray-400 mb-0.5">
                                <Eye className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                                {formatMetric(safeAd.impressions)}
                            </span>
                        </div>
                        <div className="text-center border-l border-gray-100" title="Ad Spend">
                            <div className="flex items-center justify-center text-gray-400 mb-0.5">
                                <DollarSign className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                                {formatMetric(safeAd.spend, '$')}
                            </span>
                        </div>
                    </div>
                )}

                {cleanedBody && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {cleanedBody}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded">
                        {safeAd.ctaText || 'Learn More'}
                    </span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (safeAd.linkUrl && safeAd.linkUrl !== '#') {
                                window.open(safeAd.linkUrl, '_blank');
                            }
                        }}
                        className="text-gray-400 hover:text-gray-900 transition-colors p-1"
                        title="Open Landing Page"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MetaAdCard;