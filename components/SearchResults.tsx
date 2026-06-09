"use client";

import { Search } from 'lucide-react';
import { NetflixCard } from '@/components/NetflixCard';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: string;
  title: string;
  poster_url?: string;
  release_date?: string;
  rating?: number;
  type: 'movie' | 'series' | 'anime' | 'english-movie' | 'english-series';
  genre?: string;
  description?: string;
  relevanceScore?: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  query: string;
  totalCount: number;
  currentFilter: string;
  currentSort: string;
  onShowAllResults: () => void;
}

export function SearchResults({
  results,
  loading,
  query,
  totalCount,
  currentFilter,
  currentSort,
  onShowAllResults
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-gray-400 text-lg">Searching...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">
          Start typing to search for Luganda movies, series, anime, and English content
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No results found for &quot;{query}&quot;</p>
        <p className="text-gray-500 text-sm mt-2">Try searching with different keywords</p>
      </div>
    );
  }

  // Group results by type
  const groupedResults = {
    movies: results.filter(r => r.type === 'movie'),
    series: results.filter(r => r.type === 'series'),
    anime: results.filter(r => r.type === 'anime'),
    englishMovies: results.filter(r => r.type === 'english-movie'),
    englishSeries: results.filter(r => r.type === 'english-series'),
  };

  const renderSection = (title: string, items: SearchResult[], color: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${color}`}>
          {title} ({items.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-4">
          {items.map((item) => (
            <NetflixCard
              key={`${item.type}-${item.id}`}
              content={{
                id: item.id,
                title: item.title,
                poster_url: item.poster_url,
                release_date: item.release_date,
                description: item.description,
              }}
              type={item.type === 'movie' || item.type === 'english-movie' ? 'movie' : 'series'}
              isNonTranslated={item.type === 'anime' || item.type === 'english-movie' || item.type === 'english-series'}
            />
          ))}
        </div>
      </div>
    );
  };

  const getItemHref = (item: SearchResult): string => {
    switch (item.type) {
      case 'movie':
        return `/movies/${item.id}`;
      case 'series':
        return `/series/${item.id}`;
      case 'anime':
        return `/non-translated/anime/${item.id}`;
      case 'english-movie':
        return `/non-translated/movies/${item.id}`;
      case 'english-series':
        return `/non-translated/series/${item.id}`;
      default:
        return '#';
    }
  };

  return (
    <div className="space-y-8">
      {currentFilter === 'all' ? (
        <>
          {renderSection('Luganda Movies', groupedResults.movies, 'text-blue-400')}
          {renderSection('Luganda Series', groupedResults.series, 'text-green-400')}
          {renderSection('English Movies', groupedResults.englishMovies, 'text-cyan-400')}
          {renderSection('English Series', groupedResults.englishSeries, 'text-teal-400')}
          {renderSection('Anime', groupedResults.anime, 'text-purple-400')}
        </>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-4">
          {results.map((item) => (
            <NetflixCard
              key={`${item.type}-${item.id}`}
              content={{
                id: item.id,
                title: item.title,
                poster_url: item.poster_url,
                release_date: item.release_date,
                description: item.description,
              }}
              type={item.type === 'movie' || item.type === 'english-movie' ? 'movie' : 'series'}
              isNonTranslated={item.type === 'anime' || item.type === 'english-movie' || item.type === 'english-series'}
            />
          ))}
        </div>
      )}
    </div>
  );
}