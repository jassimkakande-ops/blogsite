// Fetches a poster image from TMDB as a Blob or URL
// Usage: fetchTMDBPoster(posterPath: string, size?: string)
// Example: fetchTMDBPoster('/abc123.jpg', 'original')

export async function fetchTMDBPoster(posterPath: string, size: string = 'original'): Promise<Blob> {
  if (!posterPath) throw new Error('No poster path provided');
  const url = `https://image.tmdb.org/t/p/${size}${posterPath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch poster: ${res.status}`);
  return await res.blob();
}

// Optionally, to get an object URL for use in <img src=...>
export async function getTMDBPosterObjectURL(posterPath: string, size: string = 'original'): Promise<string> {
  const blob = await fetchTMDBPoster(posterPath, size);
  return URL.createObjectURL(blob);
}
