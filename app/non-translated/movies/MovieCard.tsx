import Image from "next/image";
import Link from "next/link";
import type { TMDBMovie } from '@/lib/types/tmdb';

interface MovieCardProps {
  content: TMDBMovie;
}

export default function MovieCard({ content }: MovieCardProps) {
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
              Movie
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
}