/**
 * Utility functions for vidsrc video streaming
 */

const VIDSRC_BASE_URL = 'https://vidsrc.cc';

export const getMovieEmbedUrl = (
  id: string | number,
  version: 'v2' | 'v3' = 'v3',
  autoPlay: boolean = true,
  poster: boolean = true
) => {
  const tmdbId = String(id);
  return `${VIDSRC_BASE_URL}/${version}/embed/movie/${tmdbId}?autoPlay=${autoPlay}&poster=${poster}`;
};

export const getAnimeEmbedUrl = (
  id: string | number,
  episode: number,
  type: 'sub' | 'dub' = 'sub',
  autoPlay: boolean = true,
  autoSkipIntro: boolean = true
) => {
  const tmdbId = `tmdb${String(id)}`;
  const url = `${VIDSRC_BASE_URL}/v2/embed/anime/${tmdbId}/${episode}/${type}?autoPlay=${autoPlay}&autoSkipIntro=${autoSkipIntro}`;
  console.log('Generated anime embed URL:', url);
  return url;
};

export const getTvEpisodeEmbedUrl = (
  id: string | number,
  season: number,
  episode: number,
  autoPlay: boolean = true
) => {
  const tmdbId = String(id);
  const url = `${VIDSRC_BASE_URL}/v2/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=${autoPlay}`;
  console.log('Generated TV show embed URL:', url);
  return url;
};

export const getTvEmbedUrl = (id: string | number, version: 'v2' | 'v3' = 'v3', autoPlay: boolean = true) => {
  const tmdbId = String(id);
  return `${VIDSRC_BASE_URL}/${version}/embed/tv/${tmdbId}?autoPlay=${autoPlay}`;
};