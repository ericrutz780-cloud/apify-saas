// frontend_blue/AdFeed.jsx
import React, { useEffect, useState } from 'react';

// HIER NUTZEN WIR DEINE EXISTIERENDE DATEI:
import { supabase } from './services/supabaseClient.js'; 

// Hier nutzen wir den Adapter von Schritt 1
import { cleanAndTransformData } from './adAdapter';

const AdFeed = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        // Wir holen Daten aus der Tabelle 'ad_results' (wie im Backend definiert)
        const { data, error } = await supabase
          .from('ad_results')
          .select('data')
          .limit(50); // Performance Limit

        if (error) throw error;

        // Hier wird die "Brücke" genutzt, um Fehler zu beheben
        const safeAds = cleanAndTransformData(data);
        setAds(safeAds);

      } catch (err) {
        console.error("Ladefehler:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  if (loading) return <div className="p-10 text-center">Lade Feed...</div>;
  if (ads.length === 0) return <div className="p-10 text-center">Keine Daten gefunden.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {ads.map((ad) => (
        <div key={ad.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center space-x-3 border-b border-gray-50">
            <img src={ad.avatar} alt={ad.pageName} className="w-10 h-10 rounded-full object-cover bg-gray-100"/>
            <div>
              <h3 className="text-sm font-bold truncate">{ad.pageName}</h3>
              <p className="text-xs text-gray-500">{ad.date}</p>
            </div>
          </div>

          {/* Media */}
          <div className="w-full aspect-video bg-black">
            {ad.media.type === 'video' ? (
              <video src={ad.media.url} poster={ad.media.poster} controls className="w-full h-full object-contain"/>
            ) : (
              <img src={ad.media.url} alt="Ad" className="w-full h-full object-cover"/>
            )}
          </div>

          {/* Body */}
          <div className="p-4 flex-1">
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {ad.body || "Kein Textinhalt."}
            </p>
            <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="block text-center bg-blue-600 text-white py-2 rounded">
              {ad.ctaText}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdFeed;