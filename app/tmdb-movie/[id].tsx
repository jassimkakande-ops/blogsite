import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';

// Fetch full TMDB movie details
async function getTMDBMovieDetails(id: string) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`);
  if (!res.ok) return null;
  return res.json();
}

export default async function TMDBMovieDetailPage({ params }: { params: { id: string } }) {
  const movie = await getTMDBMovieDetails(params.id);
  if (!movie) return notFound();

  const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
  const coverUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero / Banner */}
      {coverUrl && (
        <div className="relative h-[45vw] min-h-[300px] w-full overflow-hidden mb-8">
          <Image src={coverUrl} alt={movie.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{movie.title}</h1>
            <div className="flex gap-4 text-lg text-gray-200 mb-2">
              <span>{movie.release_date?.slice(0, 4)}</span>
              {movie.runtime && <span>{movie.runtime} min</span>}
              {movie.vote_average && <span>⭐ {movie.vote_average.toFixed(1)}</span>}
            </div>
            <p className="max-w-xl text-base md:text-lg text-gray-300 mb-4">{movie.overview}</p>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row gap-8">
          {posterUrl && (
            <div className="flex-shrink-0 w-48 md:w-64">
              <Image src={posterUrl} alt={movie.title} width={400} height={600} className="rounded-lg object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">About</h2>
            <p className="mb-4 text-gray-200">{movie.overview}</p>
            <div className="mb-2"><b>Genres:</b> {movie.genres?.map((g: any) => g.name).join(', ')}</div>
            <div className="mb-2"><b>Release Date:</b> {movie.release_date}</div>
            <div className="mb-2"><b>Original Language:</b> {movie.original_language?.toUpperCase()}</div>
            <div className="mb-2"><b>TMDB Rating:</b> {movie.vote_average?.toFixed(1)} / 10</div>
            <div className="mb-2"><b>Status:</b> {movie.status}</div>
            {/* Add more fields as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
