import React from "react";
import Image from "next/image";
import { Play, Download } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useAuthCheck } from "./AuthRequiredModal";

interface HeroDetailProps {
  title: string;
  subtitle?: string;
  description: string;
  year: string | number;
  vj?: string;
  genres: string[];
  coverImage: string;
  onWatch: () => void;
  onDownload: () => void;
  primaryColor?: string;
  requiresPremium?: boolean;
}

const HeroDetail: React.FC<HeroDetailProps> = ({
  title,
  subtitle,
  description,
  year,
  vj,
  genres,
  coverImage,
  onWatch,
  onDownload,
  primaryColor = "#f97316", // orange
  requiresPremium = false,
}) => {
  const { user } = useAuth();
  const { checkAuth } = useAuthCheck();
  return (
    <section className="relative w-full min-h-[400px] flex flex-col lg:flex-row items-stretch bg-gray-900">
      {/* Background Image with overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover object-center opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
      </div>
      {/* Left: Details */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-10 lg:py-16 lg:pl-16 lg:pr-8 text-white">
        {/* Mobile layout: overlay, left-aligned */}
        <div className="block lg:hidden absolute left-0 right-0 bottom-0 z-10 px-6 pb-8 pt-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
          {subtitle && <h2 className="text-orange-400 text-xs font-semibold uppercase mb-1 tracking-wide text-left">{subtitle}</h2>}
          <h1 className="text-2xl font-bold mb-2 leading-tight text-left" style={{ color: primaryColor }}>{title}</h1>
          <div className="flex items-center gap-2 text-xs mb-2 flex-wrap text-left">
            <span className="bg-gray-800/80 rounded px-2 py-0.5 font-semibold">{year}</span>
            {vj && <span className="bg-gray-800/80 rounded px-2 py-0.5 font-semibold">VJ: {vj}</span>}
            {genres.map((g) => (
              <span key={g} className="bg-gray-800/80 rounded px-2 py-0.5 font-semibold">{g}</span>
            ))}
          </div>
          <div className="flex gap-4 mb-3 justify-start">
            <button
              onClick={onWatch}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full shadow transition-all focus:outline-none ${
                !user ? 'bg-gray-600 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              aria-label="Watch Now"
              title={!user ? 'Sign in to watch' : 'Watch Now'}
            >
              <Play className="w-6 h-6 text-white" />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded bg-black/90 text-xs text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all whitespace-nowrap">
                {!user ? 'Sign in to watch' : 'Watch Now'}
              </span>
            </button>
            <button
              onClick={onDownload}
              className="group relative flex items-center justify-center w-11 h-11 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow transition-all focus:outline-none"
              aria-label="Download"
            >
              <Download className="w-6 h-6" />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded bg-black/90 text-xs text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all whitespace-nowrap">Download</span>
            </button>
          </div>
          <p className="text-xs text-gray-200 mb-2 max-w-full text-left line-clamp-4">{description}</p>
        </div>
        {/* Desktop layout: original */}
        <div className="hidden lg:block">
          {subtitle && <h2 className="text-orange-400 text-sm font-semibold uppercase mb-2 tracking-wide">{subtitle}</h2>}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ color: primaryColor }}>{title}</h1>
          <div className="flex items-center gap-4 text-base mb-4 flex-wrap">
            <span className="bg-gray-800 rounded px-3 py-1 font-semibold">{year}</span>
            {vj && <span className="bg-gray-800 rounded px-3 py-1 font-semibold">VJ: {vj}</span>}
            {genres.map((g) => (
              <span key={g} className="bg-gray-800 rounded px-3 py-1 font-semibold">{g}</span>
            ))}
          </div>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl">{description}</p>
          <div className="flex gap-4 flex-wrap">
            <button 
              onClick={onWatch} 
              className={`font-bold py-3 px-8 rounded-lg shadow transition-all min-w-[140px] ${
                !user ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
              title={!user ? 'Sign in to watch' : 'Watch Now'}
            >
              {!user ? 'Sign in to watch' : 'Watch Now'}
            </button>
            <button onClick={onDownload} className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg min-w-[100px]">Download</button>
          </div>
        </div>
      </div>
      {/* Right: Main Poster (hidden on mobile) */}
      <div className="hidden lg:flex items-center justify-center w-[420px] flex-shrink-0 relative z-10">
        <div className="relative aspect-[2/3] w-80 rounded-xl overflow-hidden shadow-xl border-4 border-orange-400">
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover object-center"
            priority
          />
        </div>
      </div>
      {/* Bottom gradient for smooth blend */}
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-28 z-20" style={{background: "linear-gradient(180deg, transparent 0%, #09090b 90%)"}} />
    </section>
  );
};

export default HeroDetail;
