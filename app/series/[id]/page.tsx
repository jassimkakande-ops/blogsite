"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HeroDetail from "@/components/HeroDetail";
import { useAuth } from "@/components/AuthProvider";
import AuthRequiredModal from '@/components/AuthRequiredModal';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import { FullPageSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { NetflixCard } from "@/components/NetflixCard";
import { getSeriesByIdClient, getStreamUrlClient } from "@/lib/api-client";

export default function SeriesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isPremium } = useAuth();

  const [series, setSeries] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumUpgradeModal, setShowPremiumUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'play' | 'download'>('play');
  const [related, setRelated] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);

  useEffect(() => {
    async function fetchSeriesData() {
      setLoading(true);
      setError(null);
      if (!params?.id) {
        setError("No series ID provided");
        setLoading(false);
        return;
      }

      const data = await getSeriesByIdClient(params.id as string, selectedSeason);

      if (!data || !data.series) {
        setError("Series not found");
        setLoading(false);
        return;
      }

      console.log('Episodes data received:', data.episodes);
      if (data.episodes && data.episodes.length > 0) {
        console.log('First episode sample:', data.episodes[0]);
      }

      setSeries(data.series);
      setRelated(data.related || []);
      setEpisodes(data.episodes || []);
      setLoading(false);
    }
    fetchSeriesData();
  }, [params.id, selectedSeason]);

  if (loading || authLoading) {
    return <FullPageSpinner text="Loading series details..." />;
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Series Not Found"}</h1>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handleWatch = async (episodeNumber?: number) => {
    if (!user?.id) {
      setAuthAction('play');
      setShowAuthModal(true);
      return;
    }

    if (series.premium && !isPremium) {
      setShowPremiumUpgradeModal(true);
      return;
    }

    if (episodeNumber) {
      const streamUrl = await getStreamUrlClient(series.id, 'episode', selectedSeason, episodeNumber);
      if (streamUrl) {
        router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=${episodeNumber}&url=${encodeURIComponent(streamUrl)}`);
      } else {
        router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=${episodeNumber}`);
      }
    } else {
      const streamUrl = await getStreamUrlClient(series.id, 'episode', selectedSeason, 1);
      if (streamUrl) {
        router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=1&url=${encodeURIComponent(streamUrl)}`);
      } else {
        router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=1`);
      }
    }
  };

  const genres = series.genres || [];
  const vjName = series.vjs?.name || "";

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroDetail
        title={series.title}
        subtitle={undefined}
        description={series.description || series.overview || "No description."}
        year={series.first_air_date || series.release_date ? new Date(series.first_air_date || series.release_date).getFullYear().toString() : ""}
        vj={vjName}
        genres={genres.length > 0 ? genres : ["Drama"]}
        coverImage={series.cover_image_url || series.backdrop_path || series.thumbnail_url || `https://via.placeholder.com/1920x1080/1f2937/f97316?text=${encodeURIComponent(series.title)}`}
        onWatch={() => handleWatch()}
        onDownload={() => {}}
        primaryColor="#f97316"
      />

      {episodes.length > 0 && (
        <div className="container mx-auto px-6 mt-12">
          <h2 className="text-2xl font-bold mb-6">Episodes - Season {selectedSeason}</h2>
          <div className="space-y-3">
            {episodes.map((episode) => (
              <div 
                key={episode.id} 
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 cursor-pointer transition group flex"
                onClick={() => handleWatch(episode.episode_number)}
              >
                {/* Episode Thumbnail - Left Side */}
                <div className="w-64 flex-shrink-0 relative bg-gray-900">
                  <div className="aspect-video relative">
                    <img
                      src={
                        episode.thumbnail_url ||
                        episode.poster_url ||
                        episode.poster_path ||
                        episode.cover_image_url ||
                        episode.backdrop_url ||
                        series.thumbnail_url ||
                        series.poster_path ||
                        `https://via.placeholder.com/640x360/1f2937/f97316?text=Episode+${episode.episode_number}`
                      }
                      alt={`Episode ${episode.episode_number}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/640x360/1f2937/f97316?text=Episode+${episode.episode_number}`;
                      }}
                    />
                    {/* Hover overlay with play and download buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatch(episode.episode_number);
                        }}
                      >
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <button 
                        className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Episode Info - Right Side */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          {episode.episode_number}. {episode.title || episode.name || `Episode ${episode.episode_number}`}
                        </h3>
                        {episode.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{episode.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-6 mt-12 pb-12">
        <h2 className="text-2xl font-bold mb-6">Related Series</h2>
        {related.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {related.map((r) => (
              <NetflixCard key={r.id} content={r} type="series" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-gray-800/30 animate-pulse"></div>
            ))}
          </div>
        )}
      </div>

      <PremiumUpgradeModal
        isOpen={showPremiumUpgradeModal}
        onClose={() => setShowPremiumUpgradeModal(false)}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
        requirePremium={false}
      />
    </div>
  );
}
