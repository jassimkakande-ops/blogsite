import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchFromTMDBWithCache } from '@/lib/tmdb';
import type { TMDBMovie } from '@/lib/types/tmdb';
import { Suspense } from 'react';

// Server-side function to fetch movies with pagination
async function getMovies(page: number = 1, searchQuery?: string) {
  try {
    if (searchQuery) {
      // Search for movies - fetch 2 pages to get 40 items (5 rows)
      const tmdbPage1 = page * 2 - 1;
      const tmdbPage2 = page * 2;
      
      // TMDB has max 500 pages, so limit our requests
      if (tmdbPage1 > 500) {
        return {
          results: [],
          totalPages: 250, // 500 TMDB pages / 2 = 250 our pages
          totalResults: 0
        };
      }
      
      const requests = [
        fetchFromTMDBWithCache('/search/movie', {
          query: searchQuery,
          page: tmdbPage1
        })
      ];
      
      // Only fetch second page if it's within TMDB limits
      if (tmdbPage2 <= 500) {
        requests.push(
          fetchFromTMDBWithCache('/search/movie', {
            query: searchQuery,
            page: tmdbPage2
          })
        );
      }
      
      const results = await Promise.all(requests);
      const page1 = results[0];
      const page2 = results[1];
      
      const combinedResults = [...(page1.results || []), ...(page2?.results || [])];
      const data = {
        results: combinedResults,
        total_pages: Math.min(Math.ceil((page1.total_pages || 1) / 2), 250),
        total_results: page1.total_results || 0
      };
      return {
        results: data.results || [],
        totalPages: Math.min(data.total_pages || 1, 500), // TMDB allows max 500 pages
        totalResults: data.total_results || 0
      };
    } else {
      // Get popular movies - fetch 2 pages to get 40 items (5 rows)
      const tmdbPage1 = page * 2 - 1;
      const tmdbPage2 = page * 2;
      
      // TMDB has max 500 pages, so limit our requests
      if (tmdbPage1 > 500) {
        return {
          results: [],
          totalPages: 250, // 500 TMDB pages / 2 = 250 our pages
          totalResults: 0
        };
      }
      
      const requests = [
        fetchFromTMDBWithCache('/movie/popular', {
          page: tmdbPage1,
          'vote_count.gte': 100
        })
      ];
      
      // Only fetch second page if it's within TMDB limits
      if (tmdbPage2 <= 500) {
        requests.push(
          fetchFromTMDBWithCache('/movie/popular', {
            page: tmdbPage2,
            'vote_count.gte': 100
          })
        );
      }
      
      const results = await Promise.all(requests);
      const page1 = results[0];
      const page2 = results[1];
      
      const combinedResults = [...(page1.results || []), ...(page2?.results || [])];
      const data = {
        results: combinedResults,
        total_pages: Math.min(Math.ceil((page1.total_pages || 1) / 2), 250),
        total_results: page1.total_results || 0
      };
      return {
        results: data.results || [],
        totalPages: Math.min(data.total_pages || 1, 500), // TMDB allows max 500 pages
        totalResults: data.total_results || 0
      };
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    return {
      results: [],
      totalPages: 1,
      totalResults: 0
    };
  }
}



import SearchMovies from './SearchMovies';
import Pagination from './Pagination';
import MovieCard from './MovieCard';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function NonTranslatedMoviesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const searchQuery = params.search || '';

  const { results: movies, totalPages, totalResults } = await getMovies(currentPage, searchQuery);

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-orange-500">
            Latest Movies
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Discover the latest movies in their original language with authentic subtitles
          </p>
        </div>

        {/* Search */}
        <Suspense fallback={<div className="mb-8 h-12 bg-gray-800 rounded-lg animate-pulse"></div>}>
          <SearchMovies />
        </Suspense>

        {/* Results info */}
        <div className="mb-6 text-gray-400 text-sm">
          {searchQuery ? (
            `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}" (Page ${currentPage} of ${totalPages})`
          ) : (
            `Showing ${totalResults} latest movies (Page ${currentPage} of ${totalPages})`
          )}
        </div>

        {/* Content Grid - Compact Mobile Design */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 gap-y-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} content={movie} />
          ))}
        </div>

        {/* No results message */}
        {movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchQuery ? `No movies found matching "${searchQuery}".` : 'No movies found.'}
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
