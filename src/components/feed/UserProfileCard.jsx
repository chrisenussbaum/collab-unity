import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Volume2, Square, Eye, FolderOpen, ExternalLink,
  Instagram, Facebook, Twitter, Youtube, Twitch, Linkedin, Globe,
  Pencil,
} from "lucide-react";

const SKILL_BADGE_COLORS = [
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-green-100 text-green-800 border-green-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-rose-100 text-rose-800 border-rose-300",
];

const SOCIAL_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  twitch: Twitch,
  linkedin: Linkedin,
  website: Globe,
};

function ensureProtocol(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url)) return url;
  return `https://${url}`;
}

export default function UserProfileCard({ currentUser }) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); } };
  }, []);

  if (!currentUser) return null;

  const profileUrl = currentUser.username
    ? createPageUrl(`UserProfile?username=${currentUser.username}`)
    : createPageUrl("EditProfile");

  const editUrl = createPageUrl("EditProfile");

  // Skills — show up to 3
  const skills = (currentUser.skills || []).slice(0, 3);

  // Social links from both social_links object and individual fields
  const socialLinks = currentUser.social_links || {};
  const allSocialLinks = [
    ...Object.entries(socialLinks).filter(([, url]) => url).map(([platform, url]) => ({ platform, url: ensureProtocol(url) })),
    ...(currentUser.linkedin_url ? [{ platform: "linkedin", url: ensureProtocol(currentUser.linkedin_url) }] : []),
    ...(currentUser.website_url ? [{ platform: "website", url: ensureProtocol(currentUser.website_url) }] : []),
  ];

  // Web links (personal portfolio links)
  const webLinks = currentUser.web_links || {};
  const webLinkEntries = Object.entries(webLinks).filter(([, url]) => url).slice(0, 3)
    .map(([label, url]) => [label, ensureProtocol(url)]);

  const hasVoiceIntro = !!currentUser.voice_intro_url;

  const toggleVoiceIntro = () => {
    if (!hasVoiceIntro) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(currentUser.voice_intro_url);
      audioRef.current.onended = () => setIsPlayingVoice(false);
    }
    if (isPlayingVoice) {
      audioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      audioRef.current.play();
      setIsPlayingVoice(true);
    }
  };

  const profileViews = currentUser.profile_views || 0;
  const projectViews = currentUser.project_views || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Section 1: Cover image + profile info */}
      <div className="relative">
        {/* Cover / background image */}
        <div className="h-24 w-full bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 overflow-hidden">
          {currentUser.cover_image && (
            <img
              src={currentUser.cover_image}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>

        {/* Top action icons */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
          <Link to={editUrl} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            <Pencil className="w-3.5 h-3.5 text-gray-700" />
          </Link>
          {hasVoiceIntro && (
            <button
              onClick={toggleVoiceIntro}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              title={isPlayingVoice ? "Stop voice intro" : "Play voice intro"}
            >
              {isPlayingVoice
                ? <Square className="w-3.5 h-3.5 text-purple-600" />
                : <Volume2 className="w-3.5 h-3.5 text-purple-600" />}
            </button>
          )}
        </div>

        {/* Profile image — overlapping cover */}
        <div className="flex justify-center -mt-10 mb-2">
          <Link to={profileUrl}>
            <Avatar className="w-20 h-20 border-4 border-white shadow-md">
              <AvatarImage src={currentUser.profile_image} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-2xl font-bold">
                {currentUser.full_name?.[0] || currentUser.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Name + bio */}
        <div className="px-4 pb-3 text-center">
          <Link to={profileUrl}>
            <h3 className="font-bold text-gray-900 text-base hover:text-purple-600 transition-colors truncate">
              {currentUser.full_name || "Anonymous"}
            </h3>
          </Link>
          {currentUser.bio && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{currentUser.bio}</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Section 2: Skills */}
      {skills.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-700 text-center mb-2">Subject Matter Expert</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {skills.map((skill, i) => (
              <span
                key={i}
                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${SKILL_BADGE_COLORS[i % SKILL_BADGE_COLORS.length]}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {skills.length > 0 && <div className="border-t border-gray-100" />}

      {/* Section 3: Analytics + social links */}
      <div className="px-4 py-3">
        {/* Analytics */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Eye className="w-3.5 h-3.5" />
              Profile Views
            </span>
            <span className="font-bold text-blue-600">{profileViews}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              <FolderOpen className="w-3.5 h-3.5" />
              Project Views
            </span>
            <span className="font-bold text-blue-600">{projectViews}</span>
          </div>
        </div>

        {/* Social links */}
        {allSocialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-2">
            {allSocialLinks.map(({ platform, url }, i) => {
              const Icon = SOCIAL_ICONS[platform] || Globe;
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-purple-100 text-gray-600 hover:text-purple-600 transition-colors"
                  title={platform}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Web links */}
        {webLinkEntries.length > 0 && (
          <div className="space-y-1">
            {webLinkEntries.map(([label, url], i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-purple-600 hover:text-purple-700 hover:underline truncate"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{label || url}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}