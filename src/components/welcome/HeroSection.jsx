import React, { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";

const SCREENSHOT_HERO = "https://media.base44.com/images/public/689d7b3bdca9ca6bab2aeef8/4c1c41ede_Screenshot2026-08-12at33654PM.png";

const HeroVisual = () => (
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/60 max-w-4xl mx-auto">
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-red-400" />
      <span className="w-3 h-3 rounded-full bg-yellow-400" />
      <span className="w-3 h-3 rounded-full bg-green-400" />
    </div>
    <img
      src={SCREENSHOT_HERO}
      alt="Collab Unity Feed"
      className="w-full"
      style={{ minHeight: 280, objectFit: "cover" }}
    />
  </div>
);

export default function HeroSection({ onAuth }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);

  // Capture the PWA install prompt so the "Download Now" button can trigger it.
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      alert(
        "To install Collab Unity on your desktop, open your browser's menu and choose \"Install app\" or \"Add to Home screen\"."
      );
      return;
    }
    setInstalling(true);
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch {
      /* user dismissed */
    }
    setInstallPrompt(null);
    setInstalling(false);
  };

  return (
    <section className="pt-24 pb-16 px-4" style={{ background: "linear-gradient(180deg, #F8F7FF 0%, #EDE9FF 100%)" }}>
      <div className="max-w-[640px] mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-5">
          Where Ideas Happen.
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-[540px] mx-auto">
          The platform for creators, builders, and innovators to <span className="font-bold text-gray-900">launch projects</span>, find collaborators, and ship together.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="bg-[#5B47DB] text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-[#4A37C0] transition-colors shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Now
          </button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white border border-gray-900 text-gray-900 rounded-full px-6 py-3 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
          >
            Explore features
          </button>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}