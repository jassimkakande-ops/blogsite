import Link from "next/link";
import Image from "next/image";
import { Movie, Series } from "@/lib/supabase";

// Netflix-style card component for both movies and series
type TMDBGenreMovie = {
  id: number | string;
  title?: string;
  poster_url?: string;
  cover_url?: string;
  description?: string;
  release_date?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
};

type NetflixCardProps = {
  content: Movie | Series | TMDBGenreMovie;
  type: "movie" | "series";
  isNonTranslated?: boolean;
};

export const NetflixCard = ({ content, type, isNonTranslated = false }: NetflixCardProps) => {
  const getHref = () => {
    if (isNonTranslated) {
      return `/non-translated/${type === "movie" ? "movies" : "series"}/${content.id}`;
    }
    return `/${type === "movie" ? "movies" : "series"}/${content.id}`;
  };

  // Get the best available image URL
  const imageUrl = content.thumbnail_url ||
    content.cover_image_url ||
    (('poster_url' in content && content.poster_url) ? content.poster_url : undefined) ||
    (('poster_path' in content && content.poster_path) ? content.poster_path : undefined) ||
    (('backdrop_path' in content && content.backdrop_path) ? content.backdrop_path : undefined) ||
    `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(content.title || '')}`;

  return (
    <div className="group">
      <Link href={getHref()}>
      <div className="cursor-pointer transition-transform duration-200 hover:scale-105">
        <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-gray-800 mb-2">
          <Image
            src={imageUrl}
            alt={content.title || `Poster for ${type}`}
            fill
            className="object-cover transition-opacity duration-300"
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/240x360/1f2937/f97316?text=${encodeURIComponent(content.title || '')}`;
            }}
          />

          {/* Content type badge - smaller */}
          <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
            type === "movie" ? "bg-[#FF7F50]" : "bg-[#1ABC9C]"
          }`}>
            {type === "movie" ? "Movie" : "Series"}
          </div>

          {/* Description overlay on hover - simplified */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-2">
            <p className="text-[10px] text-gray-300 line-clamp-2 leading-tight">
              {(typeof (content as any).overview === 'string' && (content as any).overview
  ? (content as any).overview.slice(0, 40)
  : content.description?.slice(0, 40)) + '...' || 'Tap to view details'}
            </p>
          </div>
        </div>
      </div>
    </Link>

    {/* Content info outside the card - more compact */}
    <div className="mt-1">
      <h3 className="font-medium text-white text-xs truncate leading-tight">{content.title}</h3>
      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
        {content.release_date && (
          <span>{new Date(content.release_date).getFullYear()}</span>
        )}
      </div>
    </div>
  </div>
  );
};
