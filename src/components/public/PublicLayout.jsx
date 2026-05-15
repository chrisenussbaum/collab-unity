import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";
const CU_PURPLE = "#5B47DB";

// Nav items — anchor links go to /Welcome#section, page links go directly
const NAV_ITEMS = [
  { label: "Features", href: "/Welcome#features", hash: "#features", isAnchor: true },
  { label: "How It Works", href: "/Welcome#how-it-works", hash: "#how-it-works", isAnchor: true },
  { label: "About", href: "/Welcome#about", hash: "#about", isAnchor: true },
  { label: "FAQ", href: "/Welcome#faq", hash: "#faq", isAnchor: true },
  { label: "Contact", page: "Contact" },
  { label: "Featured", page: "Featured" },
  { label: "Resources", page: "Resources" },
];

export function PublicNav({ currentPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorClick = (e, hash) => {
    e.preventDefault();
    setMobileOpen(false);
    const isOnWelcome = location.pathname === "/Welcome" || location.pathname === "/";
    if (isOnWelcome) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/Welcome");
      // After navigation, scroll once the page has rendered
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to={createPageUrl("Welcome")} className="flex items-center gap-2 flex-shrink-0">
          <img src={LOGO_URL} alt="Collab Unity" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-sm font-semibold text-gray-900">Collab Unity</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-gray-600 font-medium">
          {NAV_ITEMS.map(item => {
            const isActive = item.page && currentPage === item.page;
            if (item.isAnchor) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleAnchorClick(e, item.hash)}
                  className="hover:text-[#5B47DB] transition-colors cursor-pointer"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                to={createPageUrl(item.page)}
                className="transition-colors"
                style={{ color: isActive ? CU_PURPLE : undefined, fontWeight: isActive ? 700 : undefined }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth buttons + hamburger */}
        <div className="flex items-center gap-3">
          <a href="https://collabunity.io/login" className="text-[13px] text-gray-600 font-medium hover:text-[#5B47DB] transition-colors hidden md:inline px-2 py-1">Log in</a>
          <a href="https://collabunity.io/login" className="bg-[#5B47DB] text-white rounded-full px-4 py-2 text-[13px] font-medium hover:bg-[#4A37C0] transition-colors shadow-sm">Sign up</a>
          {/* Hamburger — visible below lg */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex flex-col gap-1.5 p-2 ml-1"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-4 flex flex-col gap-4 text-sm text-gray-700 font-medium">
          {NAV_ITEMS.map(item => {
            const isActive = item.page && currentPage === item.page;
            if (item.isAnchor) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleAnchorClick(e, item.hash)}
                  className="hover:text-[#5B47DB] transition-colors cursor-pointer"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                className="transition-colors"
                style={{ color: isActive ? CU_PURPLE : undefined, fontWeight: isActive ? 700 : undefined }}
              >
                {item.label}
              </Link>
            );
          })}
          <a href="https://collabunity.io/login" className="text-sm text-gray-600 font-medium hover:text-[#5B47DB] transition-colors sm:hidden">Log in</a>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-gray-200 py-10 px-4">
      <div className="max-w-[980px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between gap-8 text-sm text-gray-500 mb-8">
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Platform</h5>
            <ul className="space-y-2">
              <li><a href="/Welcome#features" className="hover:text-gray-900 transition-colors">Features</a></li>
              <li><a href="/Welcome#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a></li>
              <li><a href="/Welcome#faq" className="hover:text-gray-900 transition-colors">FAQ</a></li>
              <li><Link to={createPageUrl("Featured")} className="hover:text-gray-900 transition-colors">Featured</Link></li>
              <li><Link to={createPageUrl("Resources")} className="hover:text-gray-900 transition-colors">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Legal</h5>
            <ul className="space-y-2">
              <li><Link to={createPageUrl("Contact")} className="hover:text-gray-900 transition-colors">Contact</Link></li>
              <li><Link to={createPageUrl("TermsOfService")} className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
              <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Collab Unity" className="w-5 h-5 rounded object-cover" />
            <div>
              <span className="text-xs font-semibold text-gray-700">Collab Unity</span>
              <span className="text-xs text-gray-400 ml-2">Where Ideas Happen</span>
            </div>
          </div>
          <span className="text-xs text-gray-400">Copyright © 2025 Collab Unity. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}