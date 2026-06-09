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

  // Check if it's a Reelplexi embed URL
  const isReelplexiEmbed = src.includes('embed.reelplexi.com');

  if (isReelplexiEmbed) {
    // Use iframe for Reelplexi embeds
    return (
      <div className="w-full h-full bg-black relative">
        <iframe
          src={src}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => onLoad?.()}
          onError={(e) => {
            console.error('Iframe load error:', e);
            onError?.(e);
          }}
        />
      </div>
    );
  }

  // Use ArtPlayer for other video URLs
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
