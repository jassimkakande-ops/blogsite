"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EnhancedSearchBarProps {
  onSearch: (query: string) => void;
  onFiltersChange: (filters: {
    sort: 'relevance' | 'date' | 'title';
    vj: string;
    genre: string;
  }) => void;
  loading: boolean;
  initialQuery?: string;
  vjs: { id: string; name: string }[];
  genres: { id: string; name: string }[];
}

export function EnhancedSearchBar({
  onSearch,
  onFiltersChange,
  loading,
  initialQuery = '',
  vjs,
  genres
}: EnhancedSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sort: 'relevance' as 'relevance' | 'date' | 'title',
    vj: 'all',
    genre: 'all'
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query !== initialQuery) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search Luganda movies, series, anime, and English content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
          disabled={loading}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-white p-1"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-400 hover:text-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort by
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Release Date</option>
                <option value="title">Title</option>
              </select>
            </div>

            {/* VJ Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voice Jockey
              </label>
              <select
                value={filters.vj}
                onChange={(e) => handleFilterChange('vj', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-blue-500"
              >
                <option value="all">All VJs</option>
                {vjs.map((vj) => (
                  <option key={vj.id} value={vj.id}>
                    {vj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                value={filters.genre}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:border-blue-500"
              >
                <option value="all">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}