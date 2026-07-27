import React, { useEffect } from "react";
import { PublicNav, PublicFooter } from "@/components/public/PublicLayout";
import HeroSection from "@/components/welcome/HeroSection";
import FeaturesShowcase from "@/components/welcome/FeaturesShowcase";
import { StatsBanner, HowItWorks, AboutSection, CTABanner, FAQ } from "@/components/welcome/WelcomeSections";

export default function Welcome() {
  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  useEffect(() => {
    const hash = sessionStorage.getItem("scrollToHash");
    if (hash) {
      sessionStorage.removeItem("scrollToHash");
      const tryScroll = (attempts) => {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };
      setTimeout(() => tryScroll(0), 100);
    }
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: "#F7F8FA" }}>
      <PublicNav currentPage="Welcome" />
      <HeroSection onAuth={handleAuth} />
      <StatsBanner />
      <FeaturesShowcase onAuth={handleAuth} />
      <HowItWorks onAuth={handleAuth} />
      <AboutSection />
      <CTABanner onAuth={handleAuth} />
      <FAQ />
      <PublicFooter />
    </div>
  );
}