import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import { cleanAndTransformData } from './adAdapter';
import MetaAdCard from './components/MetaAdCard'; // WICHTIG: Die Komponente nutzen!
import AdDetailModal from './components/AdDetailModal'; // Für die Details

const AdFeed = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State für das Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdGroup, setSelectedAdGroup] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        // Wir holen 100 Ads für den statistischen Pool
        const { data, error } = await supabase
          .from('ad_results')
          .select('data')
          .limit(100); 

        if (error) throw error;

        // 1. Daten säubern
        const safeAds = cleanAndTransformData(data);

        // 2. SORTIERUNG NACH VIRALITÄT (WICHTIG!)
        // Höchster Score (z.B. 95) zuerst
        safeAds.sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));

        setAds(safeAds);

      } catch (err) {
        console.error("Ladefehler:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Öffnet das Modal mit der angeklickten Ad
  const handleCardClick = (ad) => {
      // Da wir aktuell keine Gruppen haben, ist die Gruppe nur diese eine Ad
      setSelectedAdGroup([ad]);
      setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Lade Feed...</div>;
  if (ads.length === 0) return <div className="p-10 text-center text-gray-500">Keine Daten gefunden.</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {ads.map((ad) => (
          <MetaAdCard 
            key={ad.id} 
            ad={ad} 
            onClick={handleCardClick} 
          />
        ))}
      </div>

      {/* Das Modal für die Details */}
      <AdDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        group={selectedAdGroup}
        type="meta"
      />
    </>
  );
};

export default AdFeed;