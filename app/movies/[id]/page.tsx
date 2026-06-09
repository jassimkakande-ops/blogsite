"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HeroDetail from "@/components/HeroDetail";
import { useAuth } from "@/components/AuthProvider";
import AuthRequiredModal from '@/components/AuthRequiredModal';
import PremiumUpgradeModal from '@/components/PremiumUpgradeModal';
import { FullPageSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { NetflixCard } from "@/components/NetflixCard";
import { isStandardPremium } from "@/lib/isStandardPremium";
import { getMovieByIdClient, getStreamUrlClient } from "@/lib/api-client";

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isPremium } = useAuth();

  const [movie, setMovie] = useState<any | null>(null);
  const [isStandardPremiumUser, setIsStandardPremiumUser] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPremiumUpgradeModal, setShowPremiumUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'play' | 'download'>('play');
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) { setIsStandardPremiumUser(false); return; }
      const subscription = await (await import("@/lib/subscriptions")).getUserSubscription(user.id);
      const { isStandardPremium: checkStandard } = await import("@/lib/isStandardPremium");
      setIsStandardPremiumUser(checkStandard(subscription));
    })();
  }, [user]);

  useEffect(() => {
    async function fetchMovieData() {
      setLoading(true);
      setError(null);
      if (!params?.id) {
        setError("No movie ID provided");
        setLoading(false);
        return;
      }

      const data = await getMovieByIdClient(params.id as string);

      if (!data || !data.movie) {
        setError("Movie not found");
        setLoading(false);
        return;
      }

      setMovie(data.movie);
      setRelated(data.related || []);
      setLoading(false);
    }
    fetchMovieData();
  }, [params.id]);

  if (loading || authLoading) {
    return <FullPageSpinner text="Loading movie details..." />;
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Movie Not Found"}</h1>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handleWatch = async () => {
    if (!user?.id) {
      setAuthAction('play');
      setShowAuthModal(true);
      return;
    }

    if (!isPremium) {
      setShowPremiumUpgradeModal(true);
      return;
    }

    // Get streaming URL
    const streamUrl = await getStreamUrlClient(movie.id, 'movie');
    if (streamUrl) {
      router.push(`/player?id=${movie.id}&type=movie&url=${encodeURIComponent(streamUrl)}`);
    } else {
      router.push(`/player?id=${movie.id}&type=movie`);
    }
  };

  const handleDownload = async () => {
    if (!user?.id) {
      setAuthAction('download');
      setShowAuthModal(true);
      return;
    }

    if (!isPremium) {
      setShowPremiumUpgradeModal(true);
      return;
    }

    const subscription = await (await import("@/lib/subscriptions")).getUserSubscription(user.id);
    const hasStandardPremium = isStandardPremium(subscription);

    if (!hasStandardPremium) {
      setShowPremiumUpgradeModal(true);
      return;
    }

    setShowDownloadModal(true);
  };

  const genres = movie.genres || [];
  const vjName = movie.vjs?.name || "";

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroDetail
        title={movie.title}
        subtitle={undefined}
        description={movie.description || movie.overview || "No description."}
        year={movie.release_date ? new Date(movie.release_date).getFullYear().toString() : ""}
        vj={vjName}
        genres={genres.length > 0 ? genres : ["Drama"]}
        coverImage={movie.cover_image_url || movie.backdrop_path || movie.thumbnail_url || `https://via.placeholder.com/1920x1080/1f2937/f97316?text=${encodeURIComponent(movie.title)}`}
        onWatch={handleWatch}
        onDownload={handleDownload}
        primaryColor="#f97316"
      />
      
      <div className="container mx-auto px-6 mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Movies</h2>
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          {related.length > 0 ? (
            related.map((r) => (
              <div key={r.id} className="flex-shrink-0 w-[120px] md:w-[150px] lg:w-[160px]">
                <NetflixCard content={r} type="movie" />
              </div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[120px] md:w-[150px]">
                <div className="aspect-[2/3] rounded-lg bg-gray-800/30 animate-pulse"></div>
              </div>
            ))
          )}
        </div>
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-xl border border-orange-400 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-3 text-orange-400">Download Movie</h2>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 mb-3"
              onClick={() => {
                const downloadUrl = `/api/download?id=${movie.id}&type=movie&filename=${encodeURIComponent(movie.title + '.mp4')}`;
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = movie.title + '.mp4';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setShowDownloadModal(false);
              }}
            >
              Download Now
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setShowDownloadModal(false)}>Close</Button>
          </div>
        </div>
      )}

      <PremiumUpgradeModal
        isOpen={showPremiumUpgradeModal}
        onClose={() => setShowPremiumUpgradeModal(false)}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
        requirePremium={false}
      />
    </div>
  );
}
