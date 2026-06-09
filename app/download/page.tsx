import React from "react";
import Link from "next/link";
import { Smartphone, Monitor, Apple } from "lucide-react";
import DownloadLogo from "@/components/DownloadLogo";

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-16">
      <DownloadLogo />
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center">Download Kilax App</h1>
      <p className="text-gray-300 text-center mb-6">
        Get the best Ugandan movies and series streaming experience on your Android device. Fast, secure, and offline-ready.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-md">
        <a
          href="https://play.google.com/store/apps/details?id=com.app.kilax&pcampaignid=web_share"
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:scale-105 hover:from-orange-600 hover:to-orange-500 transition-all text-base w-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Smartphone className="w-6 h-6" />
          Download for Android
        </a>
        <a href="https://st67097.ispot.cc/Kilax.exe" className="flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:scale-105 hover:from-orange-600 hover:to-orange-500 transition-all text-base w-full" download>
          <Monitor className="w-6 h-6" />
          Download for Windows
        </a>
        <div className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded-xl px-6 py-4 opacity-70 w-full">
          <div className="bg-gray-800/50 p-3 rounded-xl">
            <Apple className="w-6 h-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <span className="text-gray-400 font-semibold text-base">iOS App</span>
            <p className="text-gray-600 text-xs mt-0.5">Available on the App Store soon</p>
          </div>
          <span className="text-xs bg-gray-800 text-gray-500 px-3 py-1.5 rounded-full font-medium">Coming Soon</span>
        </div>
      </div>
      <p className="text-gray-500 text-xs mt-6 text-center max-w-lg">
        Need help installing?
      </p>
      <div className="flex items-center justify-center gap-4 mt-2">
        <a href="https://wa.me/256780846800" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline hover:text-orange-400 transition-colors">
          <img src="/whatsapp-brands-solid-full.svg" alt="WhatsApp" className="w-5 h-5 inline-block" />
          WhatsApp Support
        </a>
        <a href="https://t.me/256780846800" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline hover:text-blue-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="20" height="20" className="w-5 h-5 inline-block" fill="#229ED9"><path d="M25,2c12.703,0,23,10.297,23,23S37.703,48,25,48S2,37.703,2,25S12.297,2,25,2z M32.934,34.375	c0.423-1.298,2.405-14.234,2.65-16.783c0.074-0.772-0.17-1.285-0.648-1.514c-0.578-0.278-1.434-0.139-2.427,0.219	c-1.362,0.491-18.774,7.884-19.78,8.312c-0.954,0.405-1.856,0.847-1.856,1.487c0,0.45,0.267,0.703,1.003,0.966	c0.766,0.273,2.695,0.858,3.834,1.172c1.097,0.303,2.346,0.04,3.046-0.395c0.742-0.461,9.305-6.191,9.92-6.693	c0.614-0.502,1.104,0.141,0.602,0.644c-0.502,0.502-6.38,6.207-7.155,6.997c-0.941,0.959-0.273,1.953,0.358,2.351	c0.721,0.454,5.906,3.932,6.687,4.49c0.781,0.558,1.573,0.811,2.298,0.811C32.191,36.439,32.573,35.484,32.934,34.375z"/></svg>
          Telegram Support
        </a>
      </div>
    </main>
  );
}
