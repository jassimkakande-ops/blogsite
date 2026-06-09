import Image from "next/image";
import Link from "next/link";
import { fetchFromTMDBWithCache } from '@/lib/tmdb';
import type { TMDBMovie } from '@/lib/types/tmdb';
import { Suspense } from 'react';

// Server-side function to fetch animations with pagination
async function getAnimations(page: number = 1, searchQuery?: string) {
  try {
    if (searchQuery) {
      // Search for animations
      const data = await fetchFromTMDBWithCache('/search/movie', {
        query: searchQuery,
        page: page,
        with_genres: 16 // Animation genre
      });
      return {
        results: data.results || [],
        totalPages: Math.min(data.total_pages || 1, 500), // TMDB allows max 500 pages
        totalResults: data.total_results || 0
      };
    } else {
      // Get popular animations
      const data = await fetchFromTMDBWithCache('/discover/movie', {
        with_genres: 16,
        sort_by: 'popularity.desc',
        page: page,
        'vote_count.gte': 100 // Only include movies with decent vote count
      });
      return {
        results: data.results || [],
        totalPages: Math.min(data.total_pages || 1, 500), // TMDB allows max 500 pages
        totalResults: data.total_results || 0
      };
    }
  } catch (error) {
    console.error('Error fetching animations:', error);
    return {
      results: [],
      totalPages: 1,
      totalResults: 0
    };
  }
}

// Content card component for non-translated animations
const AnimationCard = ({ content }: { content: TMDBMovie }) => {
  const title = content.title || 'Unknown Title';
  const releaseDate = content.release_date;
  const posterPath = content.poster_path;

  return (
    <div className="group">
      <Link href={`/non-translated/movies/${content.id}`}>
        <div className="cursor-pointer transition-transform duration-200 hover:scale-105">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-2">
            <Image
              src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : `https://via.placeholder.com/300x450/1f2937/f97316?text=${encodeURIComponent(title)}`}
              alt={title}
              fill
              className="object-cover transition-opacity duration-300"
            />
            
            {/* Content type badge */}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FF7F50]">
              Animation
            </div>

            {/* Simple overlay on hover - compact */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="text-white text-xs font-semibold">Watch Now</div>
            </div>
          </div>
        </div>
      </Link>
    
      {/* Content info */}
      <div className="space-y-0.5">
        <h3 className="font-medium text-white text-xs truncate leading-tight">{title}</h3>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          {releaseDate && (
            <span>{new Date(releaseDate).getFullYear()}</span>
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

import SearchAnimations from './SearchAnimations';
import Pagination from './Pagination';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function NonTranslatedAnimationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const searchQuery = params.search || '';

  const { results: animations, totalPages, totalResults } = await getAnimations(currentPage, searchQuery);

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-orange-500">
            Popular Animations
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Discover popular animated movies in their original language with authentic subtitles
          </p>
        </div>

        {/* Search */}
        <Suspense fallback={<div className="mb-8 h-12 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <SearchAnimations />
        </Suspense>

        {/* Results info */}
        <div className="mb-6 text-gray-400 text-sm">
          {searchQuery ? (
            `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}" (Page ${currentPage} of ${totalPages})`
          ) : (
            `Showing ${totalResults} popular animations (Page ${currentPage} of ${totalPages})`
          )}
        </div>

        {/* Content Grid - Compact Mobile Design */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 gap-y-4">
          {animations.map((animation: TMDBMovie) => (
            <AnimationCard key={animation.id} content={animation} />
          ))}
        </div>

        {/* No results message */}
        {animations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchQuery ? `No animations found matching "${searchQuery}".` : 'No animations found.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        <Suspense fallback={<div className="mt-12 h-12 flex justify-center"><div className="bg-gray-800 rounded animate-pulse w-64 h-10"></div></div>}>
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </Suspense>
      </div>
    </div>
  );
}
