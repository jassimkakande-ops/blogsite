"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import { ArrowLeft, AlertCircle, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import AuthRequiredModal, { useAuthCheck } from '@/components/AuthRequiredModal';
import { getProfile, Profile } from '@/lib/profiles';
import { Episode, EpisodeWithSeason } from '@/lib/supabase';
import { normalizeVideoUrl } from '@/lib/utils';

export default function PlayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<EpisodeWithSeason[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(-1);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [switchingEpisode, setSwitchingEpisode] = useState(false);

  const { user, loading: authLoading, isPremium } = useAuth();
  const { checkAuth } = useAuthCheck();

  // Preload next episode for faster switching
  const preloadNextEpisode = useCallback(() => {
    if (currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1) {
      const nextEpisode = allEpisodes[currentEpisodeIndex + 1];
      if (nextEpisode?.video_url) {
        // Preload through proxy
        const preloadVideo = document.createElement('video');
        preloadVideo.preload = 'metadata';
        preloadVideo.src = normalizeVideoUrl(nextEpisode.video_url);
        preloadVideo.style.display = 'none';
        document.body.appendChild(preloadVideo);

        // Remove after a short delay to free up memory
        setTimeout(() => {
          if (document.body.contains(preloadVideo)) {
            document.body.removeChild(preloadVideo);
          }
        }, 30000);
      }
    }
  }, [currentEpisodeIndex, allEpisodes]);

  useEffect(() => {
    if (!switchingEpisode && streamUrl) {
      const timer = setTimeout(preloadNextEpisode, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentEpisodeIndex, switchingEpisode, streamUrl, preloadNextEpisode]);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then(setProfile);
    }
  }, [user]);

  const contentId = searchParams.get('id');
  const contentType = searchParams.get('type');
  const episodeId = searchParams.get('episodeId');
  const urlParam = searchParams.get('url');
  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');

  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (!contentId || !contentType) {
        setError('Missing content parameters');
        setLoading(false);
        return;
      }

      // Wait for auth to load
      if (authLoading) {
        return;
      }

      try {
        let videoUrl = '';
        let contentTitle = '';
        let contentInfo: any = null;

        if (contentType === 'movie') {
          // If URL is provided directly, use it
          if (urlParam) {
            videoUrl = decodeURIComponent(urlParam);
            // Try to get movie title from Reelpexi
            try {
              const movieData = await fetch(`/api/reelplexi/movie?id=${contentId}`);
              if (movieData.ok) {
                const { movie: movieDetails } = await movieData.json();
                if (movieDetails) {
                  contentTitle = movieDetails.title || 'Movie';
                  contentInfo = { id: contentId, premium: movieDetails.premium || false, title: movieDetails.title };
                }
              }
            } catch (err) {
              console.warn('Could not fetch movie title from Reelpexi:', err);
              contentTitle = 'Movie';
              contentInfo = { id: contentId, premium: false };
            }
          } else {
            // Fallback: try Supabase
            const { data: movie, error } = await supabase
              .from('movies')
              .select('id, title, video_url, published, premium')
              .eq('id', contentId)
              .eq('published', true)
              .single();

            if (error || !movie) {
              throw new Error('Movie not found or not published');
            }

            contentInfo = movie;
            videoUrl = movie.video_url;
            contentTitle = movie.title;
          }

        } else if (contentType === 'series') {
          // Check if we have season/episode params (new format from Reelplexi)
          if (seasonParam && episodeParam && urlParam) {
            videoUrl = decodeURIComponent(urlParam);
            contentTitle = `Episode ${episodeParam}`;
            contentInfo = { id: contentId, premium: false };
            
            // Store series ID
            setSeriesId(contentId);
          } else if (!episodeId && !seasonParam) {
            throw new Error('Episode ID or season/episode parameters required for series streaming');
          } else if (episodeId) {
            // Old format - fetch from Supabase
            const { data: episode, error: episodeError } = await supabase
              .from('episodes')
              .select(`
                id,
                title,
                video_url,
                published,
                premium,
                episode_number,
                season_id
              `)
              .eq('id', episodeId)
              .eq('published', true)
              .single();

            if (episodeError || !episode) {
              console.error('Episode fetch error:', episodeError);
              console.error('Episode ID:', episodeId);
              throw new Error('Episode not found or not published');
            }

            // Fetch season info
            const { data: season, error: seasonError } = await supabase
              .from('seasons')
              .select(`
                id,
                name,
                order,
                series_id
              `)
              .eq('id', episode.season_id)
              .single();

            let seriesData = null;
            let seriesIdValue = null;

            if (season && !seasonError) {
              const { data: series, error: seriesError } = await supabase
                .from('series')
                .select('id, title')
                .eq('id', season.series_id)
                .single();

              if (series && !seriesError) {
                seriesData = series;
                seriesIdValue = series.id;
              } else {
                seriesIdValue = season.series_id;
              }
            }

            contentInfo = episode;
            videoUrl = episode.video_url;
            contentTitle = `${seriesData?.title || 'Series'} - ${season?.name || 'Season'} - ${episode.title}`;

            // Store series ID
            setSeriesId(seriesIdValue);

            // Fetch all episodes
            if (seriesIdValue) {
              await fetchAllEpisodes(seriesIdValue, episodeId);
            } else if (contentId) {
              await fetchAllEpisodes(contentId, episodeId);
            }
          }
        }

        setContentData(contentInfo);

        // Check authentication using unified system
        const authCheck = checkAuth(contentInfo?.premium);
        if (!authCheck.allowed) {
          setShowAuthModal(true);
          setLoading(false);
          return;
        }

        if (!videoUrl) {
          throw new Error('No video URL available');
        }

        // Use video URL directly - normalizeVideoUrl will proxy through /api/stream
        console.log('🎬 PlayerContent URL:', videoUrl);
        setStreamUrl(normalizeVideoUrl(videoUrl));
        setTitle(contentTitle);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching stream URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to setup stream');
        setLoading(false);
      }
    };

    fetchStreamUrl();
  }, [contentId, contentType, episodeId, user, authLoading, isPremium]);

  // Fetch all episodes for navigation
  const fetchAllEpisodes = async (seriesId: string, currentEpisodeId: string) => {
    try {
      // First get seasons
      const { data: seasons, error: seasonsError } = await supabase
        .from('seasons')
        .select(`
          id,
          name,
          order
        `)
        .eq('series_id', seriesId)
        .eq('published', true)
        .order('order', { ascending: true });

      if (seasonsError) {
        console.error('Error fetching seasons for navigation:', seasonsError);
        console.error('Series ID:', seriesId);
        return;
      }



      // Then get episodes for each season
      const seasonsWithEpisodes = [];

      for (const season of seasons || []) {
        const { data: episodes, error: episodesError } = await supabase
          .from('episodes')
          .select(`
            id,
            title,
            video_url,
            published,
            premium,
            episode_number,
            thumbnail_url
          `)
          .eq('season_id', season.id)
          .eq('published', true)
          .order('episode_number', { ascending: true });

        if (episodesError) {
          console.error(`Error fetching episodes for season ${season.id}:`, episodesError);
          continue;
        }

        seasonsWithEpisodes.push({
          ...season,
          episodes: episodes || []
        });
      }



      // Flatten all episodes with season info
      const allEpisodesArray: EpisodeWithSeason[] = [];
      let currentIndex = -1;

      seasonsWithEpisodes.forEach(season => {
        if (season.episodes) {
          season.episodes
            .filter((ep: any) => ep.published && ep.video_url)
            .forEach((episode: any) => {
              const episodeWithSeason: EpisodeWithSeason = {
                ...episode,
                seasonName: season.name || `Season ${season.order}`,
                seasonOrder: season.order
              };

              if (episode.id === currentEpisodeId) {
                currentIndex = allEpisodesArray.length;
              }

              allEpisodesArray.push(episodeWithSeason);
            });
        }
      });

      setAllEpisodes(allEpisodesArray);
      setCurrentEpisodeIndex(currentIndex);
    } catch (error) {
      console.error('Error fetching all episodes:', error);
    }
  };

  // Switch to episode directly without page navigation
  const switchToEpisode = async (episode: EpisodeWithSeason) => {
    try {
      setSwitchingEpisode(true);
      setError(null);

      // Check authentication for episode
      const authCheck = checkAuth(episode.premium);
      if (!authCheck.allowed) {
        setShowAuthModal(true);
        setSwitchingEpisode(false);
        return;
      }

      if (!episode.video_url) {
        setError('This episode is not available for watching');
        setSwitchingEpisode(false);
        return;
      }

      // Update URL without navigation
      const newUrl = `/player?id=${seriesId || contentId}&type=series&episodeId=${episode.id}`;
      window.history.replaceState({}, '', newUrl);

      // Process video URL through proxy
      let videoUrl = episode.video_url;
      console.log('🔄 Switching episode with proxy URL');

      // Update current episode index
      const newIndex = allEpisodes.findIndex(ep => ep.id === episode.id);
      setCurrentEpisodeIndex(newIndex);

      // Update stream URL and title - normalizeVideoUrl will handle proxying
      setStreamUrl(normalizeVideoUrl(videoUrl));
      setTitle(`${contentData?.title || 'Series'} - ${episode.seasonName} - ${episode.title}`);
      setSwitchingEpisode(false);

    } catch (err) {
      console.error('Error switching episode:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch episode');
      setSwitchingEpisode(false);
    }
  };

  // Navigate to next episode
  const handleNextEpisode = () => {
    if (currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1) {
      const nextEpisode = allEpisodes[currentEpisodeIndex + 1];
      switchToEpisode(nextEpisode);
    }
  };

  // Navigate to previous episode
  const handlePreviousEpisode = () => {
    if (currentEpisodeIndex > 0) {
      const prevEpisode = allEpisodes[currentEpisodeIndex - 1];
      switchToEpisode(prevEpisode);
    }
  };

  // Handle video end - show next episode prompt
  const handleVideoEnd = useCallback(() => {
    if (contentType === 'series' && currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1) {
      setShowNextEpisodePrompt(true);
    }
  }, [contentType, currentEpisodeIndex, allEpisodes.length]);

  // Auto-play next episode
  const handleAutoPlayNext = () => {
    setShowNextEpisodePrompt(false);
    handleNextEpisode();
  };

  // Get current episode info
  const getCurrentEpisode = () => {
    return currentEpisodeIndex >= 0 ? allEpisodes[currentEpisodeIndex] : null;
  };

  // Get next episode info
  const getNextEpisode = () => {
    return currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1
      ? allEpisodes[currentEpisodeIndex + 1]
      : null;
  };

  // Navigate to specific episode from list
  const handleEpisodeSelect = (episode: EpisodeWithSeason) => {
    switchToEpisode(episode);
  };

  const handleVideoError = (error: any) => {
    console.error('Video player error:', error);
    console.error('Stream URL:', streamUrl);
    console.error('Content ID:', contentId);
    console.error('Content Type:', contentType);
    console.error('Episode ID:', episodeId);
    setError('Failed to play video. Check console for details.');
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    console.log('Stream URL:', streamUrl);
    setError(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center px-4">
        <div className="text-center text-white max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Loading Video...</h2>
          <p className="text-sm sm:text-base text-gray-400">Please wait while we prepare your stream</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="max-w-sm sm:max-w-md w-full text-center text-white">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Stream Error</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600 h-11 text-base font-medium"
            >
              Try Again
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 h-11 text-base font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentEpisode = getCurrentEpisode();
  const nextEpisode = getNextEpisode();
  const hasPrevious = currentEpisodeIndex > 0;
  const hasNext = currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Simplified Top Navigation */}
      <div className="absolute top-2 left-2 z-50">
        <Button
          onClick={() => {
            if (contentType === 'series' && (seriesId || contentId)) {
              router.push(`/series/${seriesId || contentId}`);
            } else {
              router.back();
            }
          }}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 bg-black/60 backdrop-blur-sm h-8 px-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      {/* Video Player Container */}
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        {switchingEpisode && (
          <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Switching Episode...</p>
            </div>
          </div>
        )}
        <VideoPlayer
          key={`player-${streamUrl}`}
          src={streamUrl}
          title={title}
          onError={handleVideoError}
          onLoad={handleVideoLoad}
          onEnded={handleVideoEnd}
          subscriptionPlan={profile?.subscription || null}
          isPremiumContent={contentData?.premium || false}
          episodes={allEpisodes}
          currentEpisodeIndex={currentEpisodeIndex}
          onEpisodeSelect={handleEpisodeSelect}
          contentType={contentType || undefined}
        />
      </div>

      {/* Bottom Section - Episode Info and List */}
      {contentType === 'series' && (
        <div className="bg-black flex-1 flex flex-col overflow-hidden">
          {/* Current Episode Title */}
          {currentEpisode && (
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-lg truncate">
                    {currentEpisode.title}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {currentEpisode.seasonName} • Episode {currentEpisode.episode_number}
                  </p>
                </div>

                {/* Navigation Controls */}
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={handlePreviousEpisode}
                    disabled={!hasPrevious}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-gray-800 h-8 w-8 p-0 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleNextEpisode}
                    disabled={!hasNext}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-gray-800 h-8 w-8 p-0 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Episode List */}
          {allEpisodes.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                <div className="grid grid-cols-1 gap-1">
                  {allEpisodes.map((episode, index) => {
                    const isCurrentEpisode = index === currentEpisodeIndex;
                    const isPremiumEpisode = episode.premium;
                    const canAccess = checkAuth(isPremiumEpisode).allowed;

                    return (
                      <div
                        key={episode.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${isCurrentEpisode
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : canAccess
                            ? 'hover:bg-gray-800'
                            : 'opacity-60'
                          }`}
                        onClick={() => canAccess && handleEpisodeSelect(episode)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Episode Thumbnail */}
                          <div className="relative w-12 h-8 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                            {episode.thumbnail_url ? (
                              <img
                                src={episode.thumbnail_url}
                                alt={episode.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to episode number if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`${episode.thumbnail_url ? 'hidden' : ''} absolute inset-0 flex items-center justify-center`}>
                              <div className={`w-6 h-4 rounded flex items-center justify-center text-xs font-bold ${isCurrentEpisode
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-600 text-gray-300'
                                }`}>
                                {episode.episode_number}
                              </div>
                            </div>
                            {/* Play indicator overlay */}
                            {isCurrentEpisode && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Play className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Episode Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium truncate">
                                {episode.title}
                              </span>
                              {isPremiumEpisode && (
                                <span className="text-xs bg-orange-500 text-white px-1 py-0.5 rounded flex-shrink-0">
                                  Premium
                                </span>
                              )}
                              {isCurrentEpisode && (
                                <Play className="w-3 h-3 text-orange-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {episode.seasonName}
                            </div>
                            {!canAccess && (
                              <div className="text-xs text-red-400">
                                {isPremiumEpisode ? 'Premium Required' : 'Login Required'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Next Episode Prompt Modal */}
      {showNextEpisodePrompt && nextEpisode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-orange-400 shadow-xl max-w-md w-full text-center p-6">
            <h2 className="text-2xl font-bold mb-3 text-orange-400">Episode Ended</h2>
            <p className="mb-4 text-gray-200">
              Up next: <span className="font-semibold">{nextEpisode.seasonName} - Episode {nextEpisode.episode_number}</span>
            </p>
            <p className="mb-6 text-gray-300 font-medium">{nextEpisode.title}</p>

            <div className="flex gap-3">
              <Button
                onClick={handleAutoPlayNext}
                className="flex-1 bg-orange-500 hover:bg-orange-600 h-12 text-base font-medium"
              >
                <Play className="w-5 h-5 mr-2" />
                Play Next Episode
              </Button>
              <Button
                onClick={() => setShowNextEpisodePrompt(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 h-12 text-base font-medium"
              >
                Stay Here
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="play"
        requirePremium={Boolean(contentData?.premium)}
      />
    </div>
  );
}