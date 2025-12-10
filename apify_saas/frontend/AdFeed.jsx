import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabaseClient';
import { cleanAndTransformData } from './adAdapter';
import MetaAdCard from './components/MetaAdCard'; 
import AdDetailModal from './components/AdDetailModal'; 

const AdFeed = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdGroup, setSelectedAdGroup] = useState([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ad_results')
          .select('data')
          .limit(100); 

        if (error) throw error;

        const safeAds = cleanAndTransformData(data);
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

  const handleCardClick = (ad) => {
      setSelectedAdGroup([ad]);
      setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Lade Feed...</div>;
  if (ads.length === 0) return <div className="p-10 text-center text-gray-500">Keine Daten gefunden.</div>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {ads.map((ad) => (
          <MetaAdCard key={ad.id} ad={ad} onClick={handleCardClick} />
        ))}
      </div>
      <AdDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} group={selectedAdGroup} type="meta" />
    </>
  );
};

export default AdFeed;