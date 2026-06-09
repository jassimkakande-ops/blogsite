"use client";
import React, { useState } from "react";

export default function DownloadLogo() {
  const [src, setSrc] = useState("/logo.png");
  return (
    <img
      src={src}
      alt="Kilax App Icon"
      className="w-20 h-20 mb-4 rounded-2xl shadow-lg bg-[#232b3a] object-contain"
      onError={() => setSrc("/file.svg")}
    />
  );
}
