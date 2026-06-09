"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Artplayer from "artplayer"
import { isIOSDevice, canStreamMKV } from "@/lib/device-utils"
import { EpisodeWithSeason } from '@/lib/supabase'
import { useAuth } from './AuthProvider'
import { useAuthCheck } from './AuthRequiredModal'

interface ArtPlayerProps {
  url: string
  poster?: string
  title?: string
  className?: string
  onEnded?: () => void
  // Episodes overlay props
  episodes?: EpisodeWithSeason[]
  currentEpisodeIndex?: number
  onEpisodeSelect?: (episode: EpisodeWithSeason) => void
  contentType?: string
}

export function ArtPlayer({ url, poster, title, className, onEnded, episodes = [], currentEpisodeIndex = -1, onEpisodeSelect, contentType }: ArtPlayerProps) {
  const artRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Artplayer | null>(null)
  const [authenticatedUrl, setAuthenticatedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [showEpisodesOverlay, setShowEpisodesOverlay] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { checkAuth } = useAuthCheck()

  // Keyboard support for episodes overlay
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showEpisodesOverlay) {
        if (event.key === 'Escape') {
          setShowEpisodesOverlay(false);
        }
      } else if (contentType === 'series' && episodes.length > 0) {
        // Open episodes overlay with 'E' key or 'L' key (like Netflix)
        if (event.key === 'e' || event.key === 'E' || event.key === 'l' || event.key === 'L') {
          setShowEpisodesOverlay(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEpisodesOverlay, contentType, episodes.length]);

  // Stabilize the onEnded callback
  const stableOnEnded = useCallback(() => {
    if (onEnded) {
      onEnded();
    }
  }, [onEnded]);

  // The keyboard handling is now managed by the useEpisodeNavigation hook

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true)
      try {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        }

        // Check if iOS device and video format is not supported
        if (isIOSDevice() && !canStreamMKV()) {
          const isMKV = url.toLowerCase().includes('.mkv')
          if (isMKV) {
            setFormatError("MKV format is not supported on iOS devices. Please use the download option to watch with VLC player.")
            setLoading(false)
            return
          }
        }

        // Use the URL as-is since it's already proxied through /api/stream
        setFormatError(null)
        setAuthError(null)
        setAuthenticatedUrl(url)
      } catch (error) {
        console.error('ArtPlayer URL processing error:', error)
        setAuthenticatedUrl(url)
      } finally {
        setLoading(false)
      }
    }

    if (url && url !== "#") {
      fetchUrl()
    } else {
      setLoading(false)
      setAuthenticatedUrl(null)
    }
  }, [url])

  useEffect(() => {
    if (!artRef.current || !authenticatedUrl) {
      console.log('ArtPlayer initialization blocked:', {
        hasContainer: !!artRef.current,
        hasUrl: !!authenticatedUrl,
        loading,
        authenticatedUrl
      })
      return
    }

    console.log('Initializing ArtPlayer with URL:', authenticatedUrl)
    console.log('Previous URL was:', currentUrl)

    // Always destroy the previous player when URL changes
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy(false)
        }
      } catch (e) {
        console.log('Error destroying previous player:', e)
      }
      playerRef.current = null
    }

    // Update current URL tracking
    setCurrentUrl(authenticatedUrl)

    const art = new Artplayer({
      container: artRef.current,
      url: authenticatedUrl,
      ...(poster && { poster }),
      volume: 0.5,
      isLive: false,
      muted: false,
      autoplay: false,
      pip: true,
      autoSize: true,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: false,
      airplay: true,
      theme: "#f97316",
      lang: "en",
      // Optimize video attributes for better seeking performance
      moreVideoAttr: {
        preload: "metadata",
        crossOrigin: "anonymous",
      } as any,
      // Enable fast seeking
      fastForward: true,
      // Optimize for streaming
      type: 'mp4',
    })

    // Add error handling
    art.on('error', (error) => {
      console.error('ArtPlayer error:', { error, url: authenticatedUrl })
    })

    art.on('ready', () => {
      // Optimize video element for better seeking
      if (art.video) {
        // Enable faster seeking by setting buffer ahead time
        art.video.preload = 'metadata'
        
        // Add event listeners for better seeking feedback
        art.video.addEventListener('seeking', () => {
          console.log('Video seeking...')
        })
        
        art.video.addEventListener('seeked', () => {
          console.log('Video seeked successfully')
        })
        
        // Optimize buffer settings if available
        try {
          if ('buffered' in art.video) {
            // Log buffer info for debugging
            const buffered = art.video.buffered
            if (buffered.length > 0) {
              console.log('Video buffer:', {
                start: buffered.start(0),
                end: buffered.end(buffered.length - 1),
                duration: art.video.duration
              })
            }
          }
        } catch (e) {
          // Ignore buffer info errors
        }
      }

      // Add Netflix-style episodes button if we have episodes and it's series content
      if (contentType === 'series' && episodes.length > 0) {
        art.controls.add({
          name: 'episodes',
          position: 'right',
          html: `<div class="art-episodes-btn" style="
                   padding: 8px 12px; 
                   cursor: pointer; 
                   display: flex; 
                   align-items: center; 
                   color: white; 
                   background: rgba(249, 115, 22, 0.1);
                   border: 1px solid rgba(249, 115, 22, 0.3);
                   border-radius: 6px;
                   transition: all 0.2s ease;
                   font-size: 13px;
                   font-weight: 500;
                   gap: 6px;
                 " 
                 onmouseover="this.style.background='rgba(249, 115, 22, 0.2)'; this.style.borderColor='rgba(249, 115, 22, 0.5)'"
                 onmouseout="this.style.background='rgba(249, 115, 22, 0.1)'; this.style.borderColor='rgba(249, 115, 22, 0.3)'">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                     <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                     <line x1="9" y1="9" x2="15" y2="9"></line>
                     <line x1="9" y1="12" x2="15" y2="12"></line>
                     <line x1="9" y1="15" x2="15" y2="15"></line>
                   </svg>
                   <span>Episodes</span>
                 </div>`,
          tooltip: 'View Episodes (Press E)',
          click: () => {
            setShowEpisodesOverlay(true)
          }
        })
      }
    })

    // Handle play/pause events for scroll and rotation management
    art.on('play', () => {
      setIsPlaying(true)
      // Note: We don't auto-rotate on play anymore since that can be intrusive
      // Auto-rotation is now only triggered by fullscreen events
      if (typeof window !== 'undefined') {
        // Only hide scroll bars, don't force orientation on play
        document.body.style.overflow = 'hidden'
      }
    })

    art.on('pause', () => {
      setIsPlaying(false)
      // Restore scroll when paused, but don't unlock orientation
      // Let fullscreen events handle orientation management
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'auto'
      }
    })

    art.on('destroy', () => {
      setIsPlaying(false)
      // Restore scroll and unlock orientation when player is destroyed
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'auto'

        // Unlock orientation when player is destroyed
        if ('screen' in window && 'orientation' in window.screen) {
          try {
            const orientation = window.screen.orientation as any;
            if (orientation && typeof orientation.unlock === 'function') {
              orientation.unlock()
            }
          } catch (e) {
            console.log('Orientation unlock failed:', e)
          }
        }

        // Also try the older APIs
        if ('unlockOrientation' in screen) {
          try {
            (screen as any).unlockOrientation()
          } catch (e) {
            console.log('Legacy orientation unlock failed:', e)
          }
        }

        if ('webkitUnlockOrientation' in screen) {
          try {
            (screen as any).webkitUnlockOrientation()
          } catch (e) {
            console.log('Webkit orientation unlock failed:', e)
          }
        }
      }
    })

    // Handle video ended event
    art.on('video:ended', () => {
      stableOnEnded()
    })

    // Handle fullscreen events for auto-rotation
    art.on('fullscreen', (fullscreenState) => {
      setIsFullscreen(fullscreenState)

      if (typeof window !== 'undefined') {
        if (fullscreenState) {
          // Entering fullscreen - auto-rotate to landscape
          console.log('Entering fullscreen - attempting landscape rotation')

          // Hide scroll bars
          document.body.style.overflow = 'hidden'

          // Modern Screen Orientation API
          if ('screen' in window && 'orientation' in window.screen) {
            try {
              const orientation = window.screen.orientation as any;
              if (orientation && typeof orientation.lock === 'function') {
                orientation.lock('landscape-primary').catch((error: any) => {
                  console.log('Primary landscape lock failed, trying any landscape:', error)
                  // Try any landscape orientation as fallback
                  orientation.lock('landscape').catch((fallbackError: any) => {
                    console.log('All landscape orientation locks failed:', fallbackError)
                  })
                })
              }
            } catch (e) {
              console.log('Screen Orientation API not available:', e)
            }
          }

          // Legacy orientation API for broader compatibility
          if ('lockOrientation' in screen) {
            try {
              const result = (screen as any).lockOrientation('landscape-primary') ||
                (screen as any).lockOrientation('landscape')
              if (!result) {
                console.log('Legacy orientation lock returned false')
              }
            } catch (e) {
              console.log('Legacy orientation lock failed:', e)
            }
          }

          // Also try webkit prefixed version
          if ('webkitLockOrientation' in screen) {
            try {
              const result = (screen as any).webkitLockOrientation('landscape-primary') ||
                (screen as any).webkitLockOrientation('landscape')
              if (!result) {
                console.log('Webkit orientation lock returned false')
              }
            } catch (e) {
              console.log('Webkit orientation lock failed:', e)
            }
          }

          // Force a small delay to ensure controls remain visible after rotation
          setTimeout(() => {
            if (art && art.controls) {
              art.controls.show = true
            }
          }, 500)

        } else {
          // Exiting fullscreen - unlock orientation
          console.log('Exiting fullscreen - unlocking orientation')

          // Restore scroll
          document.body.style.overflow = 'auto'

          // Modern Screen Orientation API
          if ('screen' in window && 'orientation' in window.screen) {
            try {
              const orientation = window.screen.orientation as any;
              if (orientation && typeof orientation.unlock === 'function') {
                orientation.unlock()
              }
            } catch (e) {
              console.log('Orientation unlock failed:', e)
            }
          }

          // Legacy orientation API
          if ('unlockOrientation' in screen) {
            try {
              (screen as any).unlockOrientation()
            } catch (e) {
              console.log('Legacy orientation unlock failed:', e)
            }
          }

          // Webkit prefixed version
          if ('webkitUnlockOrientation' in screen) {
            try {
              (screen as any).webkitUnlockOrientation()
            } catch (e) {
              console.log('Webkit orientation unlock failed:', e)
            }
          }
        }
      }
    })

    // Handle fullscreen web events (for web fullscreen mode)
    art.on('fullscreenWeb', (isFullscreenWeb) => {
      console.log('Web fullscreen state changed:', isFullscreenWeb)

      if (typeof window !== 'undefined') {
        if (isFullscreenWeb) {
          // Similar handling for web fullscreen
          document.body.style.overflow = 'hidden'

          // Force controls to remain visible
          setTimeout(() => {
            if (art && art.controls) {
              art.controls.show = true
            }
          }, 300)
        } else {
          document.body.style.overflow = 'auto'
        }
      }
    })

    // Listen for orientation changes to ensure controls remain visible
    const handleOrientationChange = () => {
      console.log('Orientation changed, ensuring controls visibility')

      // Small delay to let the rotation complete
      setTimeout(() => {
        if (art && art.controls) {
          art.controls.show = true
          // Note: Artplayer handles resize automatically on orientation changes
        }
      }, 300)
    }

    // Add orientation change listeners
    if (typeof window !== 'undefined') {
      // Modern API
      if ('screen' in window && 'orientation' in window.screen) {
        window.screen.orientation?.addEventListener('change', handleOrientationChange)
      }

      // Legacy API
      window.addEventListener('orientationchange', handleOrientationChange)

      // Also listen for resize events as a fallback
      window.addEventListener('resize', handleOrientationChange)
    }

    playerRef.current = art

    return () => {
      // Remove orientation change listeners
      if (typeof window !== 'undefined') {
        // Modern API
        if ('screen' in window && 'orientation' in window.screen) {
          window.screen.orientation?.removeEventListener('change', handleOrientationChange)
        }

        // Legacy API
        window.removeEventListener('orientationchange', handleOrientationChange)

        // Resize events
        window.removeEventListener('resize', handleOrientationChange)
      }

      if (art && typeof art.destroy === 'function') {
        try {
          art.destroy(false)
        } catch (e) {
          console.log('Error destroying player on cleanup:', e)
        }
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }

      // Ensure orientation is unlocked on cleanup
      if (typeof window !== 'undefined') {
        // Restore scroll
        document.body.style.overflow = 'auto'

        if ('screen' in window && 'orientation' in window.screen) {
          try {
            const orientation = window.screen.orientation as any;
            if (orientation && typeof orientation.unlock === 'function') {
              orientation.unlock()
            }
          } catch (e) {
            console.log('Cleanup orientation unlock failed:', e)
          }
        }

        // Also try the older APIs
        if ('unlockOrientation' in screen) {
          try {
            (screen as any).unlockOrientation()
          } catch (e) {
            console.log('Cleanup legacy orientation unlock failed:', e)
          }
        }

        if ('webkitUnlockOrientation' in screen) {
          try {
            (screen as any).webkitUnlockOrientation()
          } catch (e) {
            console.log('Cleanup webkit orientation unlock failed:', e)
          }
        }
      }

      setCurrentUrl(null)
    }
  }, [authenticatedUrl, poster, title, stableOnEnded])

  if (loading) {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <p className="text-white">Loading video...</p>
      </div>
    )
  }

  if (formatError) {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 mb-2">Unsupported Video Format</p>
          <p className="text-gray-400 text-sm mb-3">{formatError}</p>
          <p className="text-gray-500 text-xs">
            This video uses a format (MKV, AVI, etc.) that web browsers cannot play directly.
            Consider converting to MP4 format for web playback.
          </p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center max-w-md px-4">
          <p className="text-red-400 mb-2">Authentication Error</p>
          <p className="text-gray-400 text-sm mb-3">{authError}</p>
          <p className="text-gray-500 text-xs">
            The server rejected the authentication credentials. This may be a different server or domain.
          </p>
        </div>
      </div>
    )
  }

  if (!authenticatedUrl || authenticatedUrl === "#") {
    return (
      <div className={`w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-white mb-2">Video not available</p>
          <p className="text-gray-400 text-sm">No valid video source found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={artRef}
        className={`w-full aspect-video bg-black rounded-lg overflow-hidden ${className}`}
      />

      {/* Episodes Overlay - Desktop/TV Style */}
      {showEpisodesOverlay && contentType === 'series' && episodes.length > 0 && (
        <div className={`fixed inset-0 bg-black/90 flex ${isFullscreen ? 'z-[999999]' : 'z-[99999]'}`}>
          {/* Left side - Video preview area (hidden on mobile) */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2">Episodes</h1>
              <p className="text-gray-400">Select an episode to continue watching</p>
            </div>
          </div>

          {/* Right side - Episodes list */}
          <div className="w-full lg:w-1/2 bg-gray-900/95 backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">Episodes</h2>
                <p className="text-sm text-gray-400 mt-1">Season 1</p>
              </div>
              <button
                onClick={() => setShowEpisodesOverlay(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Episodes List - Unified Layout */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="space-y-3">
                {episodes.map((episode, index) => {
                  const isCurrentEpisode = index === currentEpisodeIndex;
                  const isPremiumEpisode = episode.premium;
                  const canAccess = checkAuth(isPremiumEpisode).allowed;

                  return (
                    <div
                      key={episode.id}
                      className={`p-3 lg:p-4 rounded-lg cursor-pointer transition-colors ${isCurrentEpisode
                        ? 'bg-orange-500/20 border border-orange-500/30'
                        : canAccess
                          ? 'hover:bg-gray-800'
                          : 'opacity-60 cursor-not-allowed'
                        }`}
                      onClick={() => {
                        if (canAccess && onEpisodeSelect) {
                          onEpisodeSelect(episode);
                          setShowEpisodesOverlay(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        {/* Episode Thumbnail */}
                        <div className="relative w-16 h-10 lg:w-20 lg:h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                          {episode.thumbnail_url ? (
                            <img
                              src={episode.thumbnail_url}
                              alt={episode.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className={`w-8 h-6 rounded flex items-center justify-center text-xs font-bold ${isCurrentEpisode
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-600 text-gray-300'
                                }`}>
                                {episode.episode_number}
                              </div>
                            </div>
                          )}

                          {/* Play indicator overlay */}
                          {isCurrentEpisode && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <polygon points="5,3 19,12 5,21"></polygon>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Episode Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm lg:text-base font-medium truncate">
                              {episode.title}
                            </span>
                            {isPremiumEpisode && (
                              <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded flex-shrink-0">
                                Premium
                              </span>
                            )}
                            {isCurrentEpisode && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500 flex-shrink-0">
                                <polygon points="5,3 19,12 5,21"></polygon>
                              </svg>
                            )}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-400">
                            {episode.seasonName} • Episode {episode.episode_number}
                          </div>
                          {!canAccess && (
                            <div className="text-xs text-red-400 mt-1">
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
        </div>
      )}
    </div>
  )
}