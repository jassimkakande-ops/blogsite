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
import { Download } from "lucide-react";

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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedDownloadEpisode, setSelectedDownloadEpisode] = useState<any>(null);

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

    if (!isPremium) {
      setShowPremiumUpgradeModal(true);
      return;
    }

    if (episodeNumber) {
      router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=${episodeNumber}`);
    } else {
      const episode = episodes.find(e => e.episode_number === 1) || episodes[0];
      if (episode) {
        router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=${episode.episode_number}`);
      } else {
        router.push(`/player?id=${series.id}&type=series&season=${selectedSeason}&episode=1`);
      }
    }
  };

  const handleDownload = async (episode?: any) => {
    if (!user?.id) {
      setAuthAction('download');
      setShowAuthModal(true);
      return;
    }

    if (!isPremium) {
      setShowPremiumUpgradeModal(true);
      return;
    }

    if (episode) {
      setSelectedDownloadEpisode(episode);
      setShowDownloadModal(true);
    } else if (episodes.length > 0) {
      setSelectedDownloadEpisode(episodes[0]); // default to first episode
      setShowDownloadModal(true);
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
        onDownload={() => handleDownload()}
        primaryColor="#f97316"
      />

      {(episodes.length > 0 || series.no_of_seasons > 1 || series.number_of_seasons > 1 || (series.seasons && series.seasons.length > 1) || selectedSeason > 1) && (
        <div className="container mx-auto px-6 mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold">Episodes - Season {selectedSeason}</h2>
            {(() => {
              const seasonNumbers = series.seasons && series.seasons.length > 0
                ? Array.from(new Set(series.seasons.map((s: any) => s.season_number).filter(Boolean))) as number[]
                : Array.from({ length: series.no_of_seasons || series.number_of_seasons || 1 }, (_, i) => i + 1);
              
              if (seasonNumbers.length <= 1) return null;
              
              return (
                <div className="flex flex-wrap gap-2">
                  {seasonNumbers.sort((a, b) => a - b).map((num) => (
                    <Button
                      key={num}
                      variant={selectedSeason === num ? "default" : "outline"}
                      className={selectedSeason === num ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"}
                      onClick={() => setSelectedSeason(num)}
                      size="sm"
                    >
                      Season {num}
                    </Button>
                  ))}
                </div>
              );
            })()}
          </div>
          
          {episodes.length === 0 ? (
            <div className="text-gray-400 py-8 text-center bg-gray-900 rounded-lg border border-gray-800">
              No episodes found for Season {selectedSeason}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {episodes.map((episode) => (
              <div 
                key={episode.id} 
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 cursor-pointer transition group flex flex-col"
                onClick={() => handleWatch(episode.episode_number)}
              >
                {/* Episode Thumbnail - Top */}
                <div className="w-full relative bg-gray-900">
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
                        `https://via.placeholder.com/320x180/1f2937/f97316?text=Episode+${episode.episode_number}`
                      }
                      alt={`Episode ${episode.episode_number}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/320x180/1f2937/f97316?text=Episode+${episode.episode_number}`;
                      }}
                    />
                    {/* Hover overlay with play button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition gap-2">
                      <button 
                        className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWatch(episode.episode_number);
                        }}
                        title="Watch"
                      >
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <button 
                        className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(episode);
                        }}
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {/* Episode number badge */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                      {episode.episode_number}
                    </div>
                  </div>
                </div>
                
                {/* Episode Info - Bottom */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                    {episode.title || episode.name || `Episode ${episode.episode_number}`}
                  </h3>
                  {episode.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{episode.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
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

      {showDownloadModal && selectedDownloadEpisode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-xl border border-orange-400 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-3 text-orange-400">Download Episode</h2>
            <p className="text-gray-300 mb-4 line-clamp-2">
              {series.title} - {selectedDownloadEpisode.title || `Episode ${selectedDownloadEpisode.episode_number}`}
            </p>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 mb-3"
              onClick={async () => {
                setShowDownloadModal(false);
                try {
                  const cleanTitle = series.title ? series.title.replace(/[^a-zA-Z0-9\s\-_.]/g, '').trim() : 'series';
                  const filename = `${cleanTitle} S${selectedSeason}E${selectedDownloadEpisode.episode_number}.mp4`;
                  // Use our same-origin proxy to force download instead of inline playback
                  const proxyUrl = `/api/download?id=${series.id}&type=episode&season=${selectedSeason}&episode=${selectedDownloadEpisode.episode_number}&filename=${encodeURIComponent(filename)}`;
                  window.open(proxyUrl, '_blank');
                } catch (err) {
                  console.error('Download failed:', err);
                  alert('Download is not available for this episode right now. Please try again.');
                }
              }}
            >
              Download Now
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setShowDownloadModal(false)}>Close</Button>
          </div>
        </div>
      )}

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
