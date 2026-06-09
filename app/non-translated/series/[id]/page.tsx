"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import HeroDetail from "@/components/HeroDetail";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/components/AuthProvider";

import { getTMDBTVDetails, getSimilarTV } from '@/lib/tmdb-fetchers';
import type { TMDBTVDetails, TMDBTVShow, TMDBGenre, TMDBSeason, TMDBEpisode } from '@/lib/types/tmdb';
import { getTvEpisodeEmbedUrl, getAnimeEmbedUrl } from "@/app/utils/vidsrc";

// Non-translated card component for similar content
const NonTranslatedCard = ({ content, type, isAnime }: { content: TMDBTVShow; type: 'movie' | 'tv'; isAnime?: boolean }) => {
  const title = content.name;
  const releaseDate = content.first_air_date;
  const posterPath = content.poster_path;

  // Determine display type
  const displayType = isAnime ? 'anime' : (type === 'tv' ? 'series' : 'movie');

  return (
    <div className="group">
      <Link href={`/non-translated/${type === "movie" ? "movies" : "series"}/${content.id}`}>
        <div className="cursor-pointer transition-transform duration-300 hover:scale-105">
          <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-gray-800 mb-3">
            <Image
              src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : `https://via.placeholder.com/300x450/1f2937/f97316?text=${encodeURIComponent(title)}`}
              alt={title}
              fill
              className="object-cover transition-opacity duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/300x450/1f2937/f97316?text=${encodeURIComponent(title)}`;
              }}
            />
            
            {/* Content type badge */}
            <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
              displayType === "movie" ? "bg-[#FF7F50]" : 
              displayType === "anime" ? "bg-[#9B59B6]" : "bg-[#1ABC9C]"
            }`}>
              {displayType === "movie" ? "Movie" : 
               displayType === "anime" ? "Anime" : "Series"}
            </div>

            {/* Description overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${
              displayType === 'anime' ? 'from-[#9B59B6]/80 via-[#9B59B6]/60' :
              displayType === 'series' ? 'from-[#1ABC9C]/80 via-[#1ABC9C]/60' : 
              'from-[#f97316]/80 via-[#f97316]/60'
            } to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4`}>
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {content.overview || "Experience this content in its original language with subtitles for an authentic viewing experience."}
              </p>
            </div>
          </div>
        </div>
      </Link>
    
      {/* Content info */}
      <div className="mt-1">
        <h3 className="font-semibold text-white text-sm truncate">{title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
          {releaseDate && (
            <span>{new Date(releaseDate).getFullYear()}</span>
          )}
          {type === 'tv' && content.number_of_seasons && (
            <>
              <span>•</span>
              <span>{content.number_of_seasons} Season{content.number_of_seasons > 1 ? "s" : ""}</span>
            </>
          )}
          {content.vote_average && (
            <>
              <span>•</span>
              <span>⭐ {content.vote_average.toFixed(1)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NonTranslatedSeriesDetailsPage() {
  const params = useParams();
  const [series, setSeries] = useState<TMDBTVDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarSeries, setSimilarSeries] = useState<TMDBTVShow[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [isAnime, setIsAnime] = useState<boolean>(false);
  const [streamType, setStreamType] = useState<"sub" | "dub">("sub");
  const { user } = useAuth();

  const blockPopups = () => {
    window.open = function () {
      console.log("Blocked a pop-up attempt");
      return null;
    };
  };

  useEffect(() => {
    blockPopups();
    return () => {
      console.log("Pop-up blocker remains active");
    };
  }, []);

  useEffect(() => {
    async function fetchSeries() {
      if (!params.id) return;

      try {
        // Fetch series details from TMDB
        const seriesData = await getTMDBTVDetails(params.id as string);
        setSeries(seriesData);

        // Detect if this is anime content (animated series from Japan)
        const isAnimeContent = seriesData.genres?.some((genre: TMDBGenre) => 
          ['Animation', 'Anime'].includes(genre.name)
        ) && seriesData.origin_country?.includes('JP');
        setIsAnime(isAnimeContent);

        // Fetch similar series
        const similarData = await getSimilarTV(params.id as string);
        setSimilarSeries(similarData.slice(0, 10));

        // Set default season and episode for TV shows
        if (seriesData.seasons && seriesData.seasons.length > 0) {
          const firstSeason = seriesData.seasons[0]
          setSelectedSeason(firstSeason.season_number)
          if (firstSeason.episodes && firstSeason.episodes.length > 0) {
            setSelectedEpisode(firstSeason.episodes[0].episode_number)
          }
        }
      } catch (error) {
        console.error('Error fetching series:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSeries();
  }, [params.id]);

  // Generate embed URL when series is loaded
  useEffect(() => {
    if (!series) return

    try {
      const mainUrl = isAnime 
        ? getAnimeEmbedUrl(series.id, selectedEpisode, streamType, true, true)
        : getTvEpisodeEmbedUrl(series.id, selectedSeason, selectedEpisode, true)
      console.log(`Generated ${isAnime ? 'anime' : 'TV show'} embed URL:`, mainUrl)
      setEmbedUrl(mainUrl)
    } catch (error) {
      console.error("Error generating embed URL:", error)
      setEmbedUrl(null)
    }
  }, [series, selectedSeason, selectedEpisode, isAnime, streamType])

  const handlePlayClick = (episode?: TMDBEpisode) => {
    if (episode) {
      setSelectedEpisode(episode.episode_number)
    }
    setIsPlayerLoading(true)
    setShowingPlayer(true)
  }

  if (loading) {
    return <FullPageSpinner text="Loading series details..." />;
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Series Not Found</h1>
          <Link href="/non-translated">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Non-Translated
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract genres from TMDB data
  const genres = series.genres ? series.genres.map((g: TMDBGenre) => g.name) : [];
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Video Player - Prime TV Style (Top) */}
      <AuthGuard action="play">
        {showingPlayer && embedUrl && (
          <div className="w-full bg-black">
            <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-6">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {isPlayerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Loading player...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title={`${series.name} - S${selectedSeason}E${selectedEpisode}`}
                  allow="autoplay; encrypted-media"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                  onError={() => {
                    console.error("Embed failed");
                    setEmbedUrl(null);
                    setShowingPlayer(false);
                  }}
                  onLoad={() => {
                    console.log("Iframe loaded, pop-up blocker active");
                    setIsPlayerLoading(false);
                  }}
                />
                {isAnime && (
                  <div className="absolute top-4 right-4 z-10">
                    <select
                      value={streamType}
                      onChange={(e) => setStreamType(e.target.value as "sub" | "dub")}
                      className="bg-black/80 text-white px-3 py-1 rounded border border-gray-600 text-sm"
                    >
                      <option value="sub">Subtitled</option>
                      <option value="dub">Dubbed</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AuthGuard>

      {/* Episode Selection - Below Player */}
      {showingPlayer && series && (
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 mb-6">
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-4">
              {isAnime ? 'Episodes' : 'Episodes'}
            </h3>
            
            {!isAnime && (
              <div className="flex flex-wrap gap-2 mb-3">
                {series.seasons?.map((season: TMDBSeason) => (
                  <button
                    key={season.season_number}
                    onClick={() => {
                      setSelectedSeason(season.season_number)
                      setEpisodeSearch("")
                    }}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      selectedSeason === season.season_number
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    S{season.season_number.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            )}

            {/* Episode Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search episodes..."
                value={episodeSearch}
                onChange={(e) => {
                  setEpisodeSearch(e.target.value)
                }}
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Episodes Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {series.seasons?.find((s: TMDBSeason) => s.season_number === selectedSeason)?.episodes?.map((episode: TMDBEpisode) => (
                <button
                  key={episode.id}
                  onClick={() => handlePlayClick(episode)}
                  className={`aspect-square rounded text-sm font-medium transition-colors ${
                    selectedEpisode === episode.episode_number && selectedSeason === episode.season_number
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  title={episode.name || `Episode ${episode.episode_number}`}
                >
                  {episode.episode_number.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>→</span>
          <Link href="/non-translated" className="hover:text-white">Non-Translated</Link>
          <span>→</span>
          <span className="text-white">{isAnime ? "Anime" : "Series"}</span>
        </div>
      </div>

      {/* Main Content - Prime Video Style Hero */}
      <HeroDetail
        title={series.name}
        subtitle={undefined}
        description={series.overview || "Experience this series in its original language with subtitles for an authentic viewing experience."}
        year={series.first_air_date ? new Date(series.first_air_date).getFullYear().toString() : ''}
        vj={undefined}
        genres={genres.length > 0 ? genres : ["Drama"]}
        coverImage={series.backdrop_path ? `https://image.tmdb.org/t/p/original${series.backdrop_path}` : series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : `https://via.placeholder.com/300x450/1f2937/f97316?text=${encodeURIComponent(series.name)}`}
        onWatch={() => handlePlayClick()}

        onDownload={() => { /* TODO: Implement Download */ }}
        primaryColor="#1ABC9C"
      />

      {/* Seasons Information */}
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 mt-8">
        {series.seasons && series.seasons.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Seasons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {series.seasons.map((season: TMDBSeason) => (
                <div key={season.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex gap-4">
                    {season.poster_path && (
                      <div className="w-16 h-24 flex-shrink-0">
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                          alt={season.name}
                          width={64}
                          height={96}
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{season.name}</h4>
                      {season.air_date && (
                        <p className="text-sm text-gray-400">{new Date(season.air_date).getFullYear()}</p>
                      )}
                      {season.episode_count && (
                        <p className="text-sm text-gray-400">{season.episode_count} episodes</p>
                      )}
                      {season.overview && (
                        <p className="text-xs text-gray-300 mt-2 line-clamp-2">{season.overview}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar Series */}
      {similarSeries.length > 0 && (
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 mt-16">
          <h2 className="text-2xl font-bold mb-6">Similar Series</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {similarSeries.map((similarShow) => {
              // Check if this similar show is anime
              const isSimilarAnime = similarShow.genres?.some((genre: TMDBGenre) => 
                ['Animation', 'Anime'].includes(genre.name)
              ) && similarShow.origin_country?.includes('JP');
              
              return (
                <div key={similarShow.id} className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44">
                  <NonTranslatedCard content={similarShow} type="tv" isAnime={isSimilarAnime} />
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
