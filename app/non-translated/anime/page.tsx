"use client";



import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { getAnime } from '@/lib/tmdb-fetchers';
import type { TMDBTVShow } from '@/lib/types/tmdb';

// Content card component for non-translated anime
const AnimeCard = ({ content }: { content: TMDBTVShow }) => {
  const title = content.name || 'Unknown Title';
  const releaseDate = content.first_air_date;
  const posterPath = content.poster_path;

  return (
    <div className="group">
      <Link href={`/non-translated/series/${content.id}`}>
        <div className="cursor-pointer transition-transform duration-300 hover:scale-105">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-3">
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
            <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold bg-[#9B59B6]">
              Anime
            </div>

            {/* Description overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#f97316]/80 via-[#f97316]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {content.overview || "Tap to view details and watch this anime series."}
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
          {'number_of_seasons' in content && content.number_of_seasons && (
            <>
              <span>•</span>
              <span>{content.number_of_seasons} Season{content.number_of_seasons > 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NonTranslatedAnimePage() {
  // User adblock recommendation message


  const [anime, setAnime] = useState<TMDBTVShow[]>([]);
  const [filteredAnime, setFilteredAnime] = useState<TMDBTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 28;

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const data = await getAnime();
        setAnime(data);
        setFilteredAnime(data);
      } catch (error) {
        console.error('Error fetching anime data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnime();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = anime.filter(show =>
        show.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAnime(filtered);
      setCurrentPage(1);
    } else {
      setFilteredAnime(anime);
      setCurrentPage(1);
    }
  }, [searchQuery, anime]);

  const totalPages = Math.ceil(filteredAnime.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAnime.slice(startIndex, endIndex);

  if (loading) {
    return <FullPageSpinner text="Loading anime content..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-orange-500">
            Latest Anime
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Discover the latest anime in their original language with authentic subtitles
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Results info */}
        <div className="mb-6 text-gray-400 text-sm">
          {searchQuery ? (
            `Found ${filteredAnime.length} result${filteredAnime.length !== 1 ? 's' : ''} for "${searchQuery}"`
          ) : (
            `Showing ${filteredAnime.length} latest anime`
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-3 gap-y-8">
          {currentItems.map((animeItem) => (
            <AnimeCard key={animeItem.id} content={animeItem} />
          ))}
        </div>

        {/* No results message */}
        {filteredAnime.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No anime found matching your search.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 gap-2">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className={currentPage === pageNum 
                      ? "bg-orange-500 hover:bg-orange-600" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
