"use client";
import { Search, Filter, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { getSeriesClient, searchSeriesClient, getVJsClient, getSeriesByVJClient } from "@/lib/api-client";

type Series = {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  release_date?: string;
  first_air_date?: string;
  vjs?: { name: string } | null;
};

type VJ = {
  id: string;
  name: string;
};

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVJ, setSelectedVJ] = useState<string>("");
  const [selectedVJName, setSelectedVJName] = useState<string>("");
  const [availableVJs, setAvailableVJs] = useState<VJ[]>([]);
  const [showVJDropdown, setShowVJDropdown] = useState(false);
  const [totalSeries, setTotalSeries] = useState(0);

  const fetchAvailableVJs = useCallback(async () => {
    try {
      const vjs = await getVJsClient();
      setAvailableVJs(vjs);
    } catch (error) {
      console.error('Error fetching VJs:', error);
    }
  }, []);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    try {
      const seriesData = await getSeriesClient(100);
      setSeries(seriesData);
      setTotalSeries(seriesData.length);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVJFilter = useCallback(async (vjId: string, vjName: string) => {
    setLoading(true);
    try {
      const filteredSeries = await getSeriesByVJClient(vjId, vjName);
      setSeries(filteredSeries);
      setTotalSeries(filteredSeries.length);
    } catch (error) {
      console.error('Error filtering series by VJ:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      setLoading(true);
      try {
        const searchResults = await searchSeriesClient(query);
        setSeries(searchResults);
        setTotalSeries(searchResults.length);
      } catch (error) {
        console.error('Error searching series:', error);
      } finally {
        setLoading(false);
      }
    } else {
      fetchSeries();
    }
  }, [fetchSeries]);

  useEffect(() => {
    fetchSeries();
    fetchAvailableVJs();
  }, [fetchSeries, fetchAvailableVJs]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim()) {
        setSelectedVJ("");
        setSelectedVJName("");
        performSearch(searchQuery);
      } else if (!selectedVJ) {
        fetchSeries();
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedVJ, performSearch, fetchSeries]);

  useEffect(() => {
    if (selectedVJ && selectedVJName) {
      handleVJFilter(selectedVJ, selectedVJName);
    } else if (!searchQuery) {
      fetchSeries();
    }
  }, [selectedVJ, selectedVJName, searchQuery, handleVJFilter, fetchSeries]);

  const clearFilters = () => {
    setSelectedVJ("");
    setSelectedVJName("");
    setSearchQuery("");
    fetchSeries();
  };

  const isFiltering = searchQuery.trim().length > 0 || selectedVJ;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 flex items-center">
          Series
          <span className="text-sm text-gray-400 ml-2">({totalSeries} total)</span>
        </h1>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Button
                variant="outline"
                className={`border-gray-600 text-gray-300 hover:bg-gray-800 ${selectedVJ ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600' : ''}`}
                onClick={() => setShowVJDropdown(!showVJDropdown)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {selectedVJ ? availableVJs.find(vj => vj.id === selectedVJ)?.name : 'VJ Filter'}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>

              {showVJDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedVJ("");
                        setSelectedVJName("");
                        setShowVJDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                    >
                      All VJs
                    </button>
                    {availableVJs.map((vj) => (
                      <button
                        key={vj.id}
                        onClick={() => {
                          setSelectedVJ(vj.id);
                          setSelectedVJName(vj.name);
                          setShowVJDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                      >
                        {vj.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(selectedVJ || searchQuery) && (
              <Button
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          {(searchQuery || selectedVJ) && (
            <p className="text-gray-400 mb-4">
              {loading ? 'Searching...' : `${series.length} results`}
              {searchQuery && ` for "${searchQuery}"`}
              {selectedVJ && ` by ${availableVJs.find(vj => vj.id === selectedVJ)?.name}`}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-2 gap-y-4">
            {series.map((show) => (
              <div key={show.id} className="group">
              <Link href={`/series/${show.id}`}>
                <div className="cursor-pointer transition-transform duration-200 hover:scale-105">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-2">
                    <Image
                      src={show.thumbnail_url || show.cover_image_url || `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(show.title)}`}
                      alt={show.title}
                      fill
                      className="object-cover transition-opacity duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(show.title)}`;
                      }}
                    />

                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1ABC9C]">
                      Series
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="text-white text-xs font-semibold">Watch Now</div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="space-y-0.5">
                <h3 className="font-medium text-white text-xs truncate leading-tight">{show.title}</h3>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  {show.vjs && (
                    <span className="text-orange-400">{show.vjs.name}</span>
                  )}
                  {show.vjs && (show.release_date || show.first_air_date) && (
                    <span>•</span>
                  )}
                  {(show.release_date || show.first_air_date) && (
                    <span>{new Date(show.release_date || show.first_air_date || '').getFullYear()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {!loading && (searchQuery || selectedVJ) && series.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No series found</h3>
            <p className="text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {isFiltering && (
          <div className="text-center mt-8 text-gray-400">
            Found {series.length} series
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedVJ && ` by ${availableVJs.find(vj => vj.id === selectedVJ)?.name}`}
          </div>
        )}
      </div>
    </div>
  );
}
