"use client";

import React, { useCallback } from 'react';
import { ArtPlayer } from './ArtPlayer';
import { EpisodeWithSeason } from '@/lib/supabase';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  onError?: (error: any) => void;
  onLoad?: () => void;
  onEnded?: () => void;
  subscriptionPlan?: string | null;
  isPremiumContent?: boolean;
  // Episodes overlay props
  episodes?: EpisodeWithSeason[];
  currentEpisodeIndex?: number;
  onEpisodeSelect?: (episode: EpisodeWithSeason) => void;
  contentType?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  poster,
  onError,
  onLoad,
  onEnded,
  subscriptionPlan,
  isPremiumContent = false,
  episodes = [],
  currentEpisodeIndex = -1,
  onEpisodeSelect,
  contentType
}) => {
  // Stabilize the onEnded callback to prevent unnecessary re-renders
  const stableOnEnded = useCallback(() => {
    if (onEnded) {
      onEnded();
    }
  }, [onEnded]);

  return (
    <ArtPlayer
      key={`artplayer-${src}`}
      url={src}
      title={title}
      poster={poster}
      onEnded={stableOnEnded}
      className="w-full h-full"
      episodes={episodes}
      currentEpisodeIndex={currentEpisodeIndex}
      onEpisodeSelect={onEpisodeSelect}
      contentType={contentType}
    />
  );
};

export default VideoPlayer;
