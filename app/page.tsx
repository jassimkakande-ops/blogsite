"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";

import { NetflixCard } from "@/components/NetflixCard";
import { InlineSpinner, FullPageSpinner } from "@/components/LoadingSpinner";

import { useEffect, useState } from "react";
import { getVJContentClient, getKilaxExclusiveContentClient, getMoviesClient, getSeriesClient, getGenreRowsClient } from "@/lib/api-client";

import { Movie, Series } from "@/lib/supabase";

import { useAuthCheck } from "@/components/AuthRequiredModal";
import AuthRequiredModal from "@/components/AuthRequiredModal";

export const dynamic = 'force-dynamic'

type VJContent = (Movie | Series) & {
  type: 'movie' | 'series';
  vjs: { id: string; name: string } | null;
  is_premium?: boolean;
};



// VJ Content card - compact design
const VJCard = ({ content }: { content: VJContent }) => (
  <div className="group">
    <Link href={`/${content.type === 'movie' ? 'movies' : 'series'}/${content.id}`}>
      <div className="cursor-pointer transition-transform duration-200 hover:scale-105">
        <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-2">
          <Image
            src={content.thumbnail_url || content.cover_image_url || `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(content.title)}`}
            alt={content.title}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(content.title)}`;
            }}
          />

          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${content.type === 'movie' ? 'bg-[#FF7F50]' : 'bg-[#1ABC9C]'
            }`}>
            {content.type === 'movie' ? 'Movie' : 'Series'}
          </div>

          {/* Description overlay on hover - simplified */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2">
            <p className="text-[10px] text-gray-300 line-clamp-2 leading-tight">
              {content.description?.slice(0, 40) + '...' || "Watch now"}
            </p>
          </div>
        </div>
      </div>
    </Link>

    {/* VJ Content info outside the card - more compact */}
    <div className="mt-1">
      <h3 className="font-medium text-white text-xs truncate leading-tight">{content.title}</h3>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
        {content.vjs && (
          <span className="text-orange-400">{content.vjs.name}</span>
        )}
        {content.vjs && content.release_date && (
          <span>•</span>
        )}
        {content.release_date && (
          <span>{new Date(content.release_date).getFullYear()}</span>
        )}
      </div>
    </div>
  </div>
);

// Kilax Exclusive card - special design with exclusive badge
const KilaxExclusiveCard = ({ content }: { content: VJContent }) => (
  <div className="group">
    <Link href={`/${content.type === 'movie' ? 'movies' : 'series'}/${content.id}`}>
      <div className="cursor-pointer transition-transform duration-200 hover:scale-105">
        <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-2 border-2 border-transparent hover:border-yellow-400/50 transition-all duration-300">
          <Image
            src={content.thumbnail_url || content.cover_image_url || `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(content.title)}`}
            alt={content.title}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(content.title)}`;
            }}
          />

          {/* Exclusive badge */}
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
            EXCLUSIVE
          </div>

          {/* Type badge */}
          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${content.type === 'movie' ? 'bg-[#FF7F50]' : 'bg-[#1ABC9C]'
            }`}>
            {content.type === 'movie' ? 'Movie' : 'Series'}
          </div>

          {/* Premium glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/20 via-transparent to-transparent"></div>

          {/* Description overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2">
            <p className="text-[10px] text-gray-300 line-clamp-2 leading-tight">
              {content.description?.slice(0, 40) + '...' || "Exclusive content"}
            </p>
          </div>
        </div>
      </div>
    </Link>

    {/* Exclusive content info */}
    <div className="mt-1">
      <h3 className="font-medium text-white text-xs truncate leading-tight">{content.title}</h3>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
        <span className="text-yellow-400 font-semibold">KILAX EXCLUSIVE</span>
        {content.release_date && (
          <>
            <span>•</span>
            <span>{new Date(content.release_date).getFullYear()}</span>
          </>
        )}
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const [featuredContent, setFeaturedContent] = useState<VJContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [latestMovies, setLatestMovies] = useState<any[]>([]);
  const [latestSeries, setLatestSeries] = useState<any[]>([]);
  const [genreRows, setGenreRows] = useState<{ name: string; movies: any[] }[]>([]);
  const [vjContent, setVJContent] = useState<VJContent[]>([]);
  const [kilaxExclusive, setKilaxExclusive] = useState<VJContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    action: 'play' | 'download';
    requirePremium?: boolean;
  }>({ isOpen: false, action: 'play' });

  // Auth hook
  const { checkAuth } = useAuthCheck();

  useEffect(() => {
    async function fetchCriticalData() {
      try {
        // First, load only the essential data for above-the-fold content
        const vjData = await getVJContentClient(8);
        setFeaturedContent(vjData.slice(0, 5));
        setVJContent(vjData);
        setLoading(false); // Hide skeleton as soon as hero content is ready

        // Then load the rest of the content progressively
        const [latestMovies, latestSeries, kilaxExclusiveData, genreRows] = await Promise.all([
          getMoviesClient(12),
          getSeriesClient(12),
          getKilaxExclusiveContentClient(8),
          getGenreRowsClient(12),
        ]);

        setLatestMovies(latestMovies);
        setLatestSeries(latestSeries);
        setKilaxExclusive(kilaxExclusiveData);
        setGenreRows(genreRows);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false); // Still hide skeleton even on error
      }
    }
    fetchCriticalData();
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

  if (loading) {
    return <FullPageSpinner text="Loading home..." />;
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        {/* Netflix-style Hero Banner */}
        <section className="relative h-[40vh] md:h-[60vh] lg:h-[70vh] xl:h-[80vh] w-full overflow-hidden">
          {featuredContent.length > 0 && (
            <>
              {/* Hero Background */}
              <div className="absolute inset-0">
                {featuredContent.map((content, index) => (
                  <div
                    key={content.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                      }`}
                  >
                    <Image
                      src={content.cover_image_url || `https://via.placeholder.com/1920x1080/1f2937/f97316?text=${encodeURIComponent(content.title)}`}
                      alt={content.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/1920x1080/1f2937/f97316?text=${encodeURIComponent(content.title)}`;
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
                      {featuredContent[currentSlide]?.title || "Featured Content"}
                    </h1>

                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 text-xs">
                      {featuredContent[currentSlide]?.vjs && (
                        <span className="border border-orange-400 text-orange-400 px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-bold">
                          {featuredContent[currentSlide].vjs.name}
                        </span>
                      )}
                      {featuredContent[currentSlide]?.release_date && (
                        <span className="text-gray-300">{new Date(featuredContent[currentSlide].release_date).getFullYear()}</span>
                      )}
                      {featuredContent[currentSlide] && 'duration' in featuredContent[currentSlide] && (featuredContent[currentSlide] as any).duration && (
                        <span className="text-gray-300">{(featuredContent[currentSlide] as any).duration}m</span>
                      )}
                    </div>

                    <p className="text-sm md:text-lg mb-4 md:mb-6 text-gray-100 leading-relaxed max-w-xs md:max-w-lg font-medium">
                      {featuredContent[currentSlide]?.description?.slice(0, 120) || "Experience the best in entertainment with stunning visuals and captivating storytelling."}
                      {featuredContent[currentSlide]?.description && featuredContent[currentSlide].description!.length > 120 && "..."}
                    </p>

                    <div className="flex gap-3 md:gap-4">
                      <Button
                        size="lg"
                        className="font-bold px-6 py-2 md:px-8 md:py-3 rounded-md text-sm md:text-base transition-all duration-200 hover:scale-105 bg-white text-black hover:bg-gray-200"
                        onClick={() => {
                          const authCheck = checkAuth(featuredContent[currentSlide]?.is_premium || false);
                          if (!authCheck.allowed) {
                            setAuthModal({
                              isOpen: true,
                              action: 'play',
                              requirePremium: authCheck.reason === 'premium_required'
                            });
                          } else {
                            window.location.href = `/${featuredContent[currentSlide]?.type === 'movie' ? 'movies' : 'series'}/${featuredContent[currentSlide]?.id}`;
                          }
                        }}
                      >
                        <Play className="w-4 h-4 md:w-5 md:h-5 mr-2 fill-current" />
                        Play
                      </Button>
                      <Link href={`/${featuredContent[currentSlide]?.type === 'movie' ? 'movies' : 'series'}/${featuredContent[currentSlide]?.id}`}>
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
                    className={`w-1 h-8 transition-all duration-300 ${index === currentSlide ? 'bg-white' : 'bg-white/30'
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Netflix-style Content Rows */}
        <div className="relative z-10 -mt-8 md:-mt-12 lg:-mt-16 pb-8">
          {/* Latest Translated */}
          <section className="mb-12 pt-8 md:pt-12">
            <div className="container mx-auto px-4 md:px-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white">VJ Movies & Series</h2>
              </div>

              <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                {vjContent.map((content) => (
                  <div key={content.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                    <VJCard content={content} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Kilax Exclusive */}
          <section className="mb-12">
            <div className="container mx-auto px-4 md:px-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Kilax Exclusive</h2>
                  <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold rounded">
                    EXCLUSIVE
                  </div>
                </div>
              </div>

              <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                {kilaxExclusive.length > 0 ? (
                  kilaxExclusive.map((content) => (
                    <div key={content.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                      <KilaxExclusiveCard content={content} />
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center w-full py-8">
                    <InlineSpinner text="Loading exclusive content..." />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Latest Movies */}
          <section className="mb-12">
            <div className="container mx-auto px-4 md:px-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white">Latest Movies</h2>
                <Link href="/movies" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
              </div>
              <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                {latestMovies.length > 0 ? (
                  latestMovies.map((movie) => (
                    <div key={movie.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                      <NetflixCard content={movie} type="movie" />
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center w-full py-8">
                    <InlineSpinner text="Loading latest movies..." />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Latest Series */}
          <section className="mb-12">
            <div className="container mx-auto px-4 md:px-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white">Latest Series</h2>
                <Link href="/series" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
              </div>
              <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                {latestSeries.length > 0 ? (
                  latestSeries.map((show) => (
                    <div key={show.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                      <NetflixCard content={show} type="series" />
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center w-full py-8">
                    <InlineSpinner text="Loading latest series..." />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Genre Rows */}
          {genreRows.length > 0 ? (
            genreRows.map((genre) => (
              <section className="mb-12" key={genre.name}>
                <div className="container mx-auto px-4 md:px-12">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white">{genre.name} Movies</h2>
                    <Link href="/movies" className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors">See All</Link>
                  </div>
                  <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
                    {genre.movies.map((item) => (
                      <div key={item.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                        <NetflixCard content={item} type={item.type} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))
          ) : (
            <div className="flex justify-center w-full py-12">
              <InlineSpinner text="Loading genre collections..." />
            </div>
          )}
        </div>
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        action={authModal.action}
        requirePremium={authModal.requirePremium}
      />
    </>
  );
}