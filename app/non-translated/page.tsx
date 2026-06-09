"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import { FullPageSpinner } from "@/components/LoadingSpinner";
import { 
  getTrendingForSlider, 
  getLatestMoviesForSlider, 
  getLatestSeriesForSlider, 
  getPopularAnimationsForSlider, 
  getAnimeForSlider 
} from '@/lib/tmdb-fetchers';
import type { TMDBTrendingItem, TMDBMovie, TMDBTVShow } from '@/lib/types/tmdb';
import { getMovieEmbedUrl, getTvEmbedUrl } from '@/app/utils/vidsrc';

// Content card component for non-translated items - Netflix style
const NonTranslatedCard = ({ content, type, isAnimeRow = false }: { content: TMDBTrendingItem | TMDBMovie | TMDBTVShow; type: 'movie' | 'tv' | 'trending'; isAnimeRow?: boolean }) => {
  const title = ('title' in content ? content.title : undefined) || ('name' in content ? content.name : undefined) || 'Unknown Title';
  const releaseDate = ('release_date' in content ? content.release_date : undefined) || ('first_air_date' in content ? content.first_air_date : undefined);
  const posterPath = content.poster_path;
  
  // Determine content type for mixed trending content
  const contentType = ('media_type' in content && content.media_type === 'tv') || type === 'tv' ? 'tv' : 'movie';
  
  // Check if this is anime (animated series from Japan) or if it's from the anime row
  const isAnime = isAnimeRow || (contentType === 'tv' && 'genres' in content && content.genres?.some((genre: { name: string }) => 
    ['Animation', 'Anime'].includes(genre.name)
  ) && 'origin_country' in content && content.origin_country?.includes('JP'));
  
  const displayType = isAnime ? 'anime' : (contentType === 'tv' ? 'series' : 'movie');

  return (
    <div className="group">
      <Link href={`/non-translated/${displayType === "movie" ? "movies" : "series"}/${content.id}`}>
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

            {/* Description overlay on hover - matching NetflixCard style */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#f97316]/80 via-[#f97316]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {content.overview || "Experience this content in its original language with subtitles for an authentic viewing experience."}
              </p>
            </div>
          </div>
        </div>
      </Link>
    
      {/* Content info outside the card - matching NetflixCard style */}
      <div className="mt-1">
        <h3 className="font-semibold text-white text-sm truncate">{title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
          {releaseDate && (
            <span>{new Date(releaseDate).getFullYear()}</span>
          )}
          {displayType === 'series' && 'number_of_seasons' in content && content.number_of_seasons && (
            <>
              <span>•</span>
              <span>{content.number_of_seasons} Season{content.number_of_seasons > 1 ? "s" : ""}</span>
            </>
          )}
          {displayType === 'anime' && 'number_of_seasons' in content && content.number_of_seasons && (
            <>
              <span>•</span>
              <span>{content.number_of_seasons} Season{content.number_of_seasons > 1 ? "s" : ""}</span>
            </>
          )}
          {displayType === 'movie' && 'runtime' in content && content.runtime && (
            <>
              <span>•</span>
              <span>{content.runtime}m</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NonTranslatedPage() {
  const [trending, setTrending] = useState<TMDBTrendingItem[]>([]);
  const [latestMovies, setLatestMovies] = useState<TMDBMovie[]>([]);
  const [latestSeries, setLatestSeries] = useState<TMDBTVShow[]>([]);
  const [animations, setAnimations] = useState<TMDBMovie[]>([]);
  const [anime, setAnime] = useState<TMDBTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredContent, setFeaturedContent] = useState<TMDBTrendingItem[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [trendingData, moviesData, seriesData, animationData, animeData] = await Promise.all([
          getTrendingForSlider(),
          getLatestMoviesForSlider(),
          getLatestSeriesForSlider(),
          getPopularAnimationsForSlider(),
          getAnimeForSlider(),
        ]);
        
        setTrending(trendingData);
        setLatestMovies(moviesData);
        setLatestSeries(seriesData);
        setAnimations(animationData);
        setAnime(animeData);
        
        // Use first 5 trending items as featured content for the slider
        setFeaturedContent(trendingData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (featuredContent.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredContent.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [featuredContent.length]);

  // Generate embed URL when featured content changes
  useEffect(() => {
    if (!featuredContent[currentSlide]) return;

    try {
      const currentContent = featuredContent[currentSlide];
      const isMovie = currentContent.media_type === 'movie';
      const embedUrl = isMovie 
        ? getMovieEmbedUrl(currentContent.id, "v2", true, true)
        : getTvEmbedUrl(currentContent.id, "v2", true);
      
      console.log("Generated embed URL:", embedUrl);
      setEmbedUrl(embedUrl);
    } catch (error) {
      console.error("Error generating embed URL:", error);
      setEmbedUrl(null);
    }
  }, [featuredContent, currentSlide]);

  const handlePlayClick = () => {
    console.log("Play button clicked, opening player");
    setIsPlayerLoading(true);
    setShowingPlayer(true);
  };

  if (loading) {
    return <FullPageSpinner text="Loading non-translated content..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Video Player - Prime TV Style (Top) */}
      {showingPlayer && embedUrl && (
        <div className="w-full bg-black">
          <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-6">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {isPlayerLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-sm">Loading player...</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowingPlayer(false)}
                className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Close player"
              >
                ✕
              </button>
              
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onError={() => {
                  console.error("Embed failed");
                  setEmbedUrl(null);
                  setShowingPlayer(false);
                }}
                onLoad={() => {
                  console.log("Iframe loaded");
                  setIsPlayerLoading(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Hero Banner Slider */}
      <section className="relative h-[40vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh] w-full overflow-hidden">
        {featuredContent.length > 0 && (
          <>
            {/* Hero Background */}
            <div className="absolute inset-0">
              {featuredContent.map((content, index) => (
                <div
                  key={content.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={content.backdrop_path ? `https://image.tmdb.org/t/p/original${content.backdrop_path}` : `https://via.placeholder.com/1920x1080/1f2937/f97316?text=${encodeURIComponent(content.title || content.name || 'Non-Translated Content')}`}
                    alt={content.title || content.name || 'Non-Translated Content'}
                    fill
                    className="object-cover"
                    priority={true}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/1920x1080/1f2937/f97316?text=${encodeURIComponent(content.title || content.name || 'Non-Translated Content')}`;
                    }}
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 flex items-center h-full">
              <div className="container mx-auto px-4 md:px-12">
                <div className="max-w-2xl">
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3 text-orange-500 leading-tight">
                    {featuredContent[currentSlide]?.title || featuredContent[currentSlide]?.name || "Non-Translated Content"}
                  </h1>
                  
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 text-xs">
                    <span className="border border-orange-400 text-orange-400 px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-bold">
                      {featuredContent[currentSlide]?.media_type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                    {featuredContent[currentSlide]?.release_date && (
                      <span className="text-gray-300">{new Date(featuredContent[currentSlide].release_date!).getFullYear()}</span>
                    )}
                    {featuredContent[currentSlide]?.first_air_date && (
                      <span className="text-gray-300">{new Date(featuredContent[currentSlide].first_air_date!).getFullYear()}</span>
                    )}
                  </div>
                  
                  <p className="text-sm md:text-lg mb-4 md:mb-6 text-gray-100 leading-relaxed max-w-xs md:max-w-lg font-medium">
                    {featuredContent[currentSlide]?.overview?.slice(0, 120) || "Experience the best in non-translated entertainment with stunning visuals and captivating storytelling."}
                    {featuredContent[currentSlide]?.overview && featuredContent[currentSlide].overview!.length > 120 && "..."}
                  </p>
                  
                  <div className="flex gap-3 md:gap-4">
                    <Button 
                      size="lg" 
                      onClick={handlePlayClick}
                      className="bg-white text-black hover:bg-gray-200 font-bold px-6 py-2 md:px-8 md:py-3 rounded-md text-sm md:text-base transition-all duration-200 hover:scale-105"
                    >
                      <Play className="w-4 h-4 md:w-5 md:h-5 mr-2 fill-current" />
                      Play
                    </Button>
                    <Link href={`/non-translated/${featuredContent[currentSlide]?.media_type === 'movie' ? 'movies' : 'series'}/${featuredContent[currentSlide]?.id}`}>
                      <Button size="lg" variant="outline" className="border-2 border-gray-400 text-white hover:border-white hover:bg-white/10 bg-gray-600/50 font-bold px-6 py-2 md:px-8 md:py-3 rounded-md text-sm md:text-base transition-all duration-200 hover:scale-105">
                        <Info className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        More Info
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Minimal indicators */}
            <div className="absolute bottom-8 right-8 flex gap-1 z-20">
              {featuredContent.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-1 h-8 transition-all duration-300 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Content Rows */}
      <div className="relative z-10 -mt-8 md:-mt-12 lg:-mt-16 pb-8">
        {/* Trending Now */}
        <section className="mb-12 pt-8 md:pt-12">
          <div className="container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Trending Now</h2>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {trending.map((content) => (
                <div key={content.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                  <NonTranslatedCard content={content} type="trending" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Movies */}
        <section className="mb-12">
          <div className="container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Latest Movies</h2>
              <Link href="/non-translated/movies" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {latestMovies.map((movie) => (
                <div key={movie.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                  <NonTranslatedCard content={movie} type="movie" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Series */}
        <section className="mb-12">
          <div className="container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Latest Series</h2>
              <Link href="/non-translated/series" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {latestSeries.map((series) => (
                <div key={series.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                  <NonTranslatedCard content={series} type="tv" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Animations */}
        <section className="mb-12">
          <div className="container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Animations</h2>
              <Link href="/non-translated/animations" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {animations.map((animation) => (
                <div key={animation.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                  <NonTranslatedCard content={animation} type="movie" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Anime */}
        <section className="mb-12">
          <div className="container mx-auto px-4 md:px-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Anime</h2>
              <Link href="/non-translated/anime" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {anime.map((animeItem) => (
                <div key={animeItem.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                  <NonTranslatedCard content={animeItem} type="tv" isAnimeRow={true} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}