"use client";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { TMDBTrendingItem, TMDBMovie, TMDBTVShow } from '@/lib/types/tmdb';

interface ContentSliderProps {
  title: string;
  content: (TMDBTrendingItem | TMDBMovie | TMDBTVShow)[];
  seeAllLink: string;
  contentType?: 'trending' | 'movie' | 'tv';
}

// Content card component for slider
const SliderCard = ({
  content,
  type
}: {
  content: TMDBTrendingItem | TMDBMovie | TMDBTVShow;
  type: 'movie' | 'tv' | 'trending'
}) => {
  const title = ('title' in content ? content.title : undefined) || ('name' in content ? content.name : undefined) || 'Unknown Title';
  const releaseDate = ('release_date' in content ? content.release_date : undefined) || ('first_air_date' in content ? content.first_air_date : undefined);
  const posterPath = content.poster_path;

  // Determine content type for mixed trending content
  const contentType = ('media_type' in content && content.media_type === 'tv') || type === 'tv' ? 'tv' : 'movie';
  const displayType = contentType === 'tv' ? 'series' : 'movie';

  return (
    <div className="group flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
      <Link href={`/non-translated/${displayType === "movie" ? "movies" : "series"}/${content.id}`}>
        <div className="cursor-pointer transition-transform duration-200 hover:scale-105">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-2 md:mb-3">
            <Image
              src={posterPath ? `https://image.tmdb.org/t/p/original${posterPath}` : `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(title)}`}
              alt={title}
              fill
              className="object-cover transition-opacity duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(title)}`;
              }}
            />

            {/* Content type badge - smaller */}
            <div className={`absolute top-1 left-1 md:top-2 md:left-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-bold ${displayType === "movie" ? "bg-[#FF7F50]" : "bg-[#1ABC9C]"
              }`}>
              {displayType === "movie" ? "Movie" : "Series"}
            </div>

            {/* Description overlay - simplified */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2 md:p-3">
              <p className="text-[10px] md:text-xs text-gray-300 line-clamp-2 md:line-clamp-3 leading-tight">
                {content.overview?.slice(0, 40) + '...' || "Watch now"}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Content info - more compact */}
      <div className="mt-1">
        <h3 className="font-medium text-white text-xs md:text-sm truncate leading-tight">{title}</h3>
        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-400 mt-0.5">
          {releaseDate && (
            <span>{new Date(releaseDate).getFullYear()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ContentSlider({ title, content, seeAllLink, contentType = 'trending' }: ContentSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Calculate responsive item width based on screen size
  const getItemWidth = () => {
    if (typeof window === 'undefined') return 136; // Default for SSR (120px + 16px gap)
    const screenWidth = window.innerWidth;
    if (screenWidth < 768) return 120 + 12; // mobile: 120px + gap
    if (screenWidth < 1024) return 150 + 12; // md: 150px + gap
    return 160 + 12; // lg+: 160px + gap
  };
  
  const itemWidth = getItemWidth();
  const visibleItems = Math.floor((typeof window !== 'undefined' ? window.innerWidth - 64 : 1200) / itemWidth); // Account for container padding
  const maxIndex = Math.max(0, content.length - visibleItems);

  const scrollToIndex = (index: number) => {
    if (sliderRef.current) {
      const scrollLeft = index * itemWidth;
      sliderRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(maxIndex, currentIndex + 1);
    scrollToIndex(newIndex);
  };

  if (content.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="container mx-auto px-4 md:px-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <Link href={seeAllLink} className="text-sm text-gray-300 hover:text-white">
            See all
          </Link>
        </div>

        <div className="relative">
          {/* Previous Button */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200 -ml-4"
              aria-label="Previous items"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Next Button */}
          {currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200 -mr-4"
              aria-label="Next items"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Slider Container */}
          <div
            ref={sliderRef}
            className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {content.map((item) => (
              <SliderCard
                key={item.id}
                content={item}
                type={contentType === 'trending' ? 'trending' : contentType}
              />
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${i === currentIndex ? 'bg-orange-500' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
