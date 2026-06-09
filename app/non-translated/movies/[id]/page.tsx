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

import { getTMDBMovieDetails, getSimilarMovies } from '@/lib/tmdb-fetchers';
import type { TMDBMovieDetails, TMDBMovie, TMDBGenre } from '@/lib/types/tmdb';
import { getMovieEmbedUrl } from "@/app/utils/vidsrc";

// Non-translated card component for similar content
const NonTranslatedCard = ({ content, type }: { content: TMDBMovie; type: 'movie' | 'tv' }) => {
  const title = content.title;
  const releaseDate = content.release_date;
  const posterPath = content.poster_path;

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
            
            {/* Content type badge matching home page */}
            <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
              type === "movie" ? "bg-[#FF7F50]" : "bg-[#1ABC9C]"
            }`}>
              {type === "movie" ? "Movie" : "Series"}
            </div>

            {/* Description overlay matching home page */}
            <div className={`absolute inset-0 bg-gradient-to-t ${type === 'movie' ? 'from-[#f97316]/80 via-[#f97316]/60' : 'from-[#1ABC9C]/80 via-[#1ABC9C]/60'} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4`}>
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {content.overview || "Experience this content in its original language with subtitles for an authentic viewing experience."}
              </p>
            </div>
          </div>
        </div>
      </Link>
    
      {/* Content info matching home page */}
      <div className="mt-1">
        <h3 className="font-semibold text-white text-sm truncate">{title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
          {releaseDate && (
            <span>{new Date(releaseDate).getFullYear()}</span>
          )}
          {type === 'movie' && content.runtime && (
            <>
              <span>•</span>
              <span>{content.runtime}m</span>
            </>
          )}
          {type === 'movie' && !content.runtime && content.vote_average && (
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

export default function NonTranslatedMovieDetailsPage() {
  const params = useParams();
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [showingPlayer, setShowingPlayer] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchMovie() {
      if (!params.id) return;

      try {
        // Fetch movie details from TMDB
        const movieData = await getTMDBMovieDetails(params.id as string);
        setMovie(movieData);

        // Fetch similar movies
        const similarData = await getSimilarMovies(params.id as string);
        setSimilarMovies(similarData.slice(0, 10));
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [params.id]);

  // Generate embed URL when movie is loaded
  useEffect(() => {
    if (!movie) return

    try {
      const mainUrl = getMovieEmbedUrl(movie.id, "v2", true, true)
      console.log("Generated movie embed URL:", mainUrl)
      setEmbedUrl(mainUrl)
    } catch (error) {
      console.error("Error generating embed URL:", error)
      setEmbedUrl(null)
    }
  }, [movie])

  const handlePlayClick = () => {
    console.log("Play button clicked, opening player")
    setIsPlayerLoading(true)
    setShowingPlayer(true)
  }

  if (loading) {
    return <FullPageSpinner text="Loading movie details..." />;
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
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
  const genres = movie.genres ? movie.genres.map((g: TMDBGenre) => g.name) : [];
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>→</span>
          <Link href="/non-translated" className="hover:text-white">Non-Translated</Link>
          <span>→</span>
          <span className="text-white">Movies</span>
        </div>
      </div>

      {/* Main Content - Prime Video Style Hero */}
      <HeroDetail
        title={movie.title}
        subtitle={undefined}
        description={movie.overview || "Experience this movie in its original language with subtitles for an authentic cinematic experience."}
        year={movie.release_date ? new Date(movie.release_date).getFullYear().toString() : ''}
        vj={undefined}
        genres={genres.length > 0 ? genres : ["Drama"]}
        coverImage={movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : `https://via.placeholder.com/300x450/1f2937/f97316?text=${encodeURIComponent(movie.title)}`}
        onWatch={() => handlePlayClick()}

        onDownload={() => { /* TODO: Implement Download */ }}
        primaryColor="#f97316"
      />

      {/* Video Player - Inline */}
      <AuthGuard action="play">
        {showingPlayer && embedUrl && (
          <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 mb-6">
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
                title={`${movie.title} Player`}
                allow="autoplay; encrypted-media"
                sandbox="allow-same-origin allow-scripts allow-forms"
                onError={() => {
                  console.error("Embed failed");
                  setEmbedUrl(null);
                  setShowingPlayer(false);
                }}
                onLoad={() => {
                  console.log("Iframe loaded")
                  setIsPlayerLoading(false);
                }}
              />
            </div>
          </div>
        )}
      </AuthGuard>

      {/* Movie Details */}
      {similarMovies.length > 0 && (
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 mt-16">
          <h2 className="text-2xl font-bold mb-6">Similar Movies</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
            {similarMovies.map((similarMovie) => (
              <div key={similarMovie.id} className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44">
                <NonTranslatedCard content={similarMovie} type="movie" />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
