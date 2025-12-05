import React, { useState, useMemo } from 'react';
import { 
    Play, 
    ExternalLink, 
    ThumbsUp, 
    Eye, 
    DollarSign, 
    MapPin, 
    Users, 
    Globe, 
    Info, 
    ChevronDown, 
    ChevronUp,
    ShieldCheck
} from 'lucide-react';
import { MetaAd } from '../types';

// Erweiterte Struktur, die auch die Ad Library spezifischen Felder abdeckt
interface SafeMetaAd {
    id: string;
    pageName?: string;
    avatar?: string | null;
    status?: string;
    date?: string; // z.B. Startdatum
    endDate?: string;
    body?: string | null;
    media?: {
        type: 'video' | 'image' | 'carousel';
        url?: string | null;
        poster?: string | null;
    };
    ctaText?: string;
    linkUrl?: string;
    
    // Bestehende Metriken
    likes?: number | null;
    impressions?: number | null;
    spend?: number | null;

    // Neue Felder für Ad Library Style (Oft in 'demographic_distribution' oder root)
    targeted_or_reached_countries?: string[]; // Array von Länder-Codes oder Namen
    target_ages?: string | { min?: number, max?: number }; // Alter "18-65+"
    reach_estimate?: number | { min?: number, max?: number } | null; 
    
    // Zusatzinfos für Details
    about_advertiser?: {
        followers?: number;
        category?: string;
        location?: string;
    };

    [key: string]: any; 
}

interface MetaAdCardProps {
    ad: MetaAd;
    // FIX: viewMode ist optional (?), das behebt den Vercel Fehler
    viewMode?: 'condensed' | 'details';
    onClick: (ad: MetaAd) => void;
    platformContext?: 'facebook' | 'instagram';
}

const MetaAdCard: React.FC<MetaAdCardProps> = ({ ad, viewMode = 'condensed', onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

    const safeAd = ad as unknown as SafeMetaAd;

    // Helper: Formatiert Zahlen (1.2k, 1M etc.)
    const formatMetric = (val: any, prefix = '') => {
        if (val === null || val === undefined || val === '') return 'N/A';
        const num = Number(val);
        if (isNaN(num) || num === -1 || num < 0) return 'N/A';
        try {
            return prefix + new Intl.NumberFormat('de-DE', { 
                notation: "compact", 
                compactDisplay: "short",
                maximumFractionDigits: 1 
            }).format(num);
        } catch (e) {
            return 'N/A';
        }
    };

    // Helper: Bereinigt Text
    const cleanText = (text: string | null | undefined) => {
        if (!text) return null;
        const cleaned = text.replace(/\{\{.*?\}\}/g, '').trim();
        return cleaned.length > 0 ? cleaned : null;
    };

    const handleImageError = () => {
        setImageError(true);
    };

    // --- Extraktion der neuen Daten ---
    
    // 1. Standort
    const locationText = useMemo(() => {
        const countries = safeAd.targeted_or_reached_countries || safeAd.publisher_platforms || []; // Fallback
        if (Array.isArray(countries) && countries.length > 0) {
            if (countries.length <= 3) return countries.join(', ');
            return `${countries.length} Standorte`;
        }
        return null; // Wenn leer, zeigen wir nichts an
    }, [safeAd]);

    // 2. Alter
    const ageText = useMemo(() => {
        // Versuche Alter aus verschiedenen möglichen Feldern zu lesen
        if (typeof safeAd.target_ages === 'string') return safeAd.target_ages;
        // Mock-Fallback Logik falls Struktur anders ist (oft in API anders verschachtelt)
        return null; 
    }, [safeAd]);

    // 3. Reichweite (Total)
    const reachText = useMemo(() => {
        if (safeAd.reach_estimate) {
            if (typeof safeAd.reach_estimate === 'number') return formatMetric(safeAd.reach_estimate);
            // Wenn es ein Object ist {min, max}
            // @ts-ignore
            if (safeAd.reach_estimate.min) return `>${formatMetric(safeAd.reach_estimate.min)}`;
        }
        return null;
    }, [safeAd]);

    // Prüfen, ob wir "Performance" Daten haben (für die alte Ansicht)
    const hasPerformanceMetrics = useMemo(() => {
        const isValid = (val: any) => val !== null && val !== undefined && val !== -1 && val !== '';
        return isValid(safeAd.likes) || isValid(safeAd.impressions) || isValid(safeAd.spend);
    }, [safeAd]);

    // Prüfen, ob wir "Targeting" Daten haben (für die neue Ansicht)
    const hasTargetingMetrics = locationText || ageText || reachText;

    // --- Rendering ---

    if (!safeAd) return null;

    const mediaType = safeAd.media?.type;
    const isVideo = mediaType === 'video';
    const mediaUrl = safeAd.media?.url;
    const mediaPoster = safeAd.media?.poster;
    const displayImage = imageError || !mediaUrl 
        ? 'https://placehold.co/400x400?text=No+Preview' 
        : mediaUrl;
    const cleanedBody = cleanText(safeAd.body);

    // Render-Funktion für die Karte (Condensed View)
    const renderCondensed = () => (
        <div 
            onClick={() => onClick(ad)}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
        >
            {/* Header */}
            <div className="p-3 flex items-center gap-3 border-b border-gray-100">
                <div className="h-9 w-9 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                    {safeAd.avatar ? (
                        <img src={safeAd.avatar} alt="" className="h-full w-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
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
                    <div className="flex items-center text-xs text-gray-500 gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            <span>ID: {safeAd.id || safeAd.ad_archive_id}</span>
                        </div>
                        <span>• {safeAd.status === 'Active' ? 'Aktiv' : 'Inaktiv'}</span>
                    </div>
                </div>
            </div>

            {/* Media */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {isVideo ? (
                    <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                        <img src={mediaPoster || displayImage} alt="Video Thumbnail" className="w-full h-full object-cover opacity-90" onError={handleImageError} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 text-brand-600 fill-brand-600 ml-0.5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <img src={displayImage} alt="Ad Creative" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={handleImageError} />
                )}
            </div>

            {/* Metrics Bar - PRIORITÄT: Standort, Alter, Reichweite (Wie Ad Library Overview) */}
            <div className="bg-gray-50 border-t border-gray-100 p-2 text-xs text-gray-600">
                 {hasTargetingMetrics ? (
                    <div className="grid grid-cols-3 gap-2">
                        {/* Standort */}
                        <div className="flex flex-col items-center text-center p-1">
                            <MapPin className="w-3.5 h-3.5 mb-1 text-gray-400" />
                            <span className="font-medium truncate w-full" title={locationText || 'N/A'}>
                                {locationText || 'Standort N/A'}
                            </span>
                        </div>
                        {/* Alter */}
                        <div className="flex flex-col items-center text-center p-1 border-l border-gray-200">
                            <Users className="w-3.5 h-3.5 mb-1 text-gray-400" />
                            <span className="font-medium">
                                {ageText || 'Alle'}
                            </span>
                        </div>
                        {/* Reichweite */}
                        <div className="flex flex-col items-center text-center p-1 border-l border-gray-200">
                            <Globe className="w-3.5 h-3.5 mb-1 text-gray-400" />
                            <span className="font-medium">
                                {reachText || 'N/A'}
                            </span>
                        </div>
                    </div>
                 ) : hasPerformanceMetrics ? (
                    // Fallback auf Performance Metriken (Likes/Spend) wenn kein Targeting da ist
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center" title="Likes">
                            <ThumbsUp className="w-3.5 h-3.5 mx-auto mb-1 text-gray-400" />
                            <span className="font-medium">{formatMetric(safeAd.likes)}</span>
                        </div>
                        <div className="text-center border-l border-gray-200" title="Impressions">
                            <Eye className="w-3.5 h-3.5 mx-auto mb-1 text-gray-400" />
                            <span className="font-medium">{formatMetric(safeAd.impressions)}</span>
                        </div>
                        <div className="text-center border-l border-gray-200" title="Spend">
                            <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-gray-400" />
                            <span className="font-medium">{formatMetric(safeAd.spend, '€')}</span>
                        </div>
                    </div>
                 ) : (
                    // Wenn gar nichts da ist, zeige CTA info
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-400">
                        <Info className="w-4 h-4" />
                        <span>Keine Metriken verfügbar</span>
                    </div>
                 )}
            </div>

            {/* Footer Text & Button */}
            <div className="p-3 flex flex-col gap-2 border-t border-gray-100 flex-grow">
                {cleanedBody && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal">
                        {cleanedBody}
                    </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                        {safeAd.ctaText || 'Mehr dazu'}
                    </span>
                </div>
            </div>
        </div>
    );

    // Render-Funktion für die Detailansicht (Expanded View) - Ad Library Style
    const renderDetails = () => (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col md:flex-row max-h-[80vh] w-full">
            {/* Linke Seite: Media & Basic Info */}
            <div className="w-full md:w-1/2 bg-gray-50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
                 <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                                {safeAd.avatar && <img src={safeAd.avatar} className="w-full h-full object-cover"/>}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">{safeAd.pageName}</p>
                                <p className="text-xs text-gray-500">Gesponsert • ID: {safeAd.id}</p>
                            </div>
                        </div>
                        {cleanedBody && <div className="p-3 text-sm text-gray-800 whitespace-pre-wrap">{cleanedBody}</div>}
                        <div className="relative w-full">
                             {isVideo ? (
                                <video src={mediaUrl || ''} controls poster={mediaPoster || ''} className="w-full" />
                            ) : (
                                <img src={displayImage} className="w-full h-auto" />
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase font-semibold">{safeAd.linkUrl ? new URL(safeAd.linkUrl).hostname : 'WEBSITE'}</span>
                            <button className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded">
                                {safeAd.ctaText || 'Mehr dazu'}
                            </button>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Rechte Seite: Ad Library Details */}
            <div className="w-full md:w-1/2 p-0 overflow-y-auto flex flex-col">
                <div className="p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Details zur Werbeanzeige</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md font-medium">
                            Status: {safeAd.status || 'Aktiv'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            Start: {safeAd.date || 'N/A'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            Plattformen: {safeAd.publisher_platform ? safeAd.publisher_platform.join(', ') : 'Facebook, Instagram'}
                        </span>
                    </div>
                </div>

                {/* Sektion 1: Infos zum Werbetreibenden */}
                <div className="p-5 border-b border-gray-100">
                    <button onClick={() => setIsDetailsExpanded(!isDetailsExpanded)} className="flex items-center justify-between w-full text-left mb-2">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Infos zum Werbetreibenden
                        </h3>
                        {isDetailsExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </button>
                    {/* Inhalt immer anzeigen oder toggeln - hier toggeln wir als Beispiel */}
                    <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Name:</strong> {safeAd.pageName}</p>
                        <p className="mt-1"><strong>Disclaimer:</strong> {safeAd.byline || 'Kein Disclaimer angegeben'}</p>
                        {safeAd.page_categories && (
                            <p className="mt-1"><strong>Kategorie:</strong> {safeAd.page_categories.join(', ')}</p>
                        )}
                    </div>
                </div>

                {/* Sektion 2: EU Transparenz / Zielgruppe */}
                <div className="p-5 border-b border-gray-100 bg-blue-50/30">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        EU-Transparenz & Zielgruppe
                    </h3>
                    
                    {/* Grid für Standort, Alter, Geschlecht */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Standort</div>
                            <div className="text-sm font-medium flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <span>{locationText || 'Nicht verfügbar'}</span>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1 uppercase font-bold tracking-wider">Alter & Geschlecht</div>
                            <div className="text-sm font-medium flex items-start gap-2">
                                <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <span>{ageText || 'Alle'} • {safeAd.gender || 'Alle'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reichweite */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                         <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Geschätzte Reichweite</div>
                            <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">EU</div>
                         </div>
                         <div className="text-2xl font-bold text-gray-900">
                             {reachText || 'Daten nicht verfügbar'}
                         </div>
                         <p className="text-xs text-gray-400 mt-1">
                             Dies ist eine Schätzung der Konten, die diese Anzeige gesehen haben könnten.
                             {safeAd.eu_total_reach ? '' : ' (Werte oft nur für politische Anzeigen verfügbar)'}
                         </p>
                    </div>
                </div>
                
                {/* JSON Data Dump (für Debugging im Detail View oft hilfreich) */}
                 <div className="mt-auto p-4 bg-gray-50 text-xs text-gray-400 border-t border-gray-100 break-all">
                    Link zur Ad Library: <a href={safeAd.ad_library_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Hier öffnen</a>
                 </div>
            </div>
        </div>
    );

    // Haupt-Render-Switch
    return viewMode === 'details' ? renderDetails() : renderCondensed();
};

export default MetaAdCard;