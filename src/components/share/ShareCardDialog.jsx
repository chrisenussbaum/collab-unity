import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Link2, Loader2, Share2, Twitter, Facebook, Linkedin, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const CU_PRIMARY = "#5B47DB";
const CU_PRIMARY_DARK = "#4A37C0";
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";

const statusLabels = {
  seeking_collaborators: "Seeking Collaborators",
  in_progress: "In Progress",
  completed: "Completed",
};

const classificationLabels = {
  educational: "Educational",
  career_development: "Career Development",
  hobby: "Hobby",
  business: "Business",
  nonprofit: "Nonprofit",
  startup: "Startup",
};

export default function ShareCardDialog({ isOpen, onClose, type, data, shareUrl }) {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `collab-unity-${type}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Card downloaded!");
    } catch (error) {
      console.error("Error generating card:", error);
      toast.error("Failed to generate card.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  const shareText = type === "profile"
    ? `Check out ${data?.profileUser?.full_name || "this user"}'s profile on Collab Unity!`
    : `Check out "${data?.project?.title || "this project"}" on Collab Unity!`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const socialPlatforms = [
    { name: "X", icon: Twitter, color: "#000000", url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { name: "Facebook", icon: Facebook, color: "#1877F2", url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}` },
    { name: "LinkedIn", icon: Linkedin, color: "#0A66C2", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: "WhatsApp", icon: MessageCircle, color: "#25D366", url: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { name: "Telegram", icon: Send, color: "#0088CC", url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
  ];

  const handleSocialShare = (url, name) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    toast.success(`Sharing to ${name}!`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: type === "profile" ? `${data?.profileUser?.full_name || "User"} on Collab Unity` : `${data?.project?.title || "Project"} on Collab Unity`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled - silent
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      {/* Off-screen card for html2canvas capture — avoids dialog CSS transform clipping */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }}>
        {type === "profile" ? (
          <ProfileCard ref={cardRef} data={data} shareUrl={shareUrl} />
        ) : (
          <ProjectCard ref={cardRef} data={data} shareUrl={shareUrl} />
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-600" />
              Share {type === "profile" ? "Profile" : "Project"} Card
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center py-2">
            {type === "profile" ? (
              <ProfileCard data={data} shareUrl={shareUrl} />
            ) : (
              <ProjectCard data={data} shareUrl={shareUrl} />
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={handleDownload} disabled={isDownloading} className="w-full cu-button">
              {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {isDownloading ? "Generating..." : "Download Card"}
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                <Link2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button onClick={handleNativeShare} variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500 text-center mb-2 font-medium">Share on social media</p>
              <div className="flex justify-center gap-2">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialShare(platform.url, platform.name)}
                      className="flex flex-col items-center gap-1 group"
                      title={`Share on ${platform.name}`}
                    >
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110 group-hover:shadow-md"
                        style={{ backgroundColor: platform.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] text-gray-600 group-hover:text-gray-900">{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ProfileCard = React.forwardRef(({ data, shareUrl }, ref) => {
  const { profileUser, userProjects = [], skillEndorsements = [], collaboratorReviews = [], userGameStats } = data;
  const skills = (profileUser?.skills || []).slice(0, 4);
  const points = userGameStats?.total_points || 0;
  const level = userGameStats?.level || 1;

  return (
    <div
      ref={ref}
      className="w-[300px] rounded-xl overflow-hidden shadow-2xl"
      style={{ background: "white", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header gradient */}
      <div
        className="px-5 pt-4 pb-3 relative"
        style={{ background: `linear-gradient(135deg, ${CU_PRIMARY} 0%, ${CU_PRIMARY_DARK} 100%)` }}
      >
        <div className="flex items-center gap-2.5">
          {profileUser?.profile_image ? (
            <img
              src={profileUser.profile_image}
              alt={profileUser?.full_name}
              crossOrigin="anonymous"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center text-xl font-bold text-white border-2 border-white">
              {profileUser?.full_name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate leading-tight">{profileUser?.full_name || "Anonymous User"}</h2>
            {profileUser?.username && <p className="text-xs text-white/80 truncate">@{profileUser.username}</p>}
            {profileUser?.location && (
              <p className="text-[10px] text-white/70 truncate mt-0.5">📍 {profileUser.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {profileUser?.bio && (
          <p className="text-xs text-gray-600 mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {profileUser.bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <StatBox value={userProjects.length} label="Projects" />
          <StatBox value={skillEndorsements.length} label="Endorse" />
          <StatBox value={collaboratorReviews.length} label="Reviews" />
          <StatBox value={points} label="Points" />
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Skills</p>
            <div className="flex flex-wrap gap-1">
              {skills.map(skill => (
                <span
                  key={skill}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "#F3F0FF", color: CU_PRIMARY, border: `1px solid #E0D9FF` }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Level badge */}
        {userGameStats && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: `linear-gradient(135deg, ${CU_PRIMARY}, ${CU_PRIMARY_DARK})` }}
            >
              {level}
            </div>
            <span className="text-[10px] text-gray-500">Level {level} Member</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <CardFooter shareUrl={shareUrl} />
    </div>
  );
});

const ProjectCard = React.forwardRef(({ data, shareUrl }, ref) => {
  const { project, owner } = data;
  const skillsNeeded = (project?.skills_needed || []).slice(0, 4);
  const collaboratorCount = project?.current_collaborators_count || (project?.collaborator_emails?.length || 0);
  const followersCount = project?.followers_count || 0;

  return (
    <div
      ref={ref}
      className="w-[300px] rounded-xl overflow-hidden shadow-2xl"
      style={{ background: "white", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header gradient */}
      <div
        className="px-5 pt-4 pb-3 relative"
        style={{ background: `linear-gradient(135deg, ${CU_PRIMARY} 0%, ${CU_PRIMARY_DARK} 100%)` }}
      >
        <div className="flex items-center gap-2.5">
          {project?.logo_url ? (
            <img
              src={project.logo_url}
              alt={project?.title}
              crossOrigin="anonymous"
              className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/30 flex items-center justify-center border-2 border-white">
              <span className="text-xl">💡</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate leading-tight">{project?.title || "Untitled Project"}</h2>
            {project?.status && (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white mt-1">
                {statusLabels[project.status] || project.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {project?.description && (
          <p className="text-xs text-gray-600 mb-3" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <StatBox value={collaboratorCount} label="Collabs" />
          <StatBox value={followersCount} label="Followers" />
          <StatBox value={classificationLabels[project?.classification] || "—"} label="Type" isText />
        </div>

        {/* Skills needed */}
        {skillsNeeded.length > 0 && (
          <div className="mb-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Skills Needed</p>
            <div className="flex flex-wrap gap-1">
              {skillsNeeded.map(skill => (
                <span
                  key={skill}
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "#F3F0FF", color: CU_PRIMARY, border: `1px solid #E0D9FF` }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Owner */}
        {owner && (
          <div className="flex items-center gap-1.5">
            {owner.profile_image ? (
              <img src={owner.profile_image} alt={owner.full_name} crossOrigin="anonymous" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                {owner.full_name?.[0] || "U"}
              </div>
            )}
            <span className="text-[10px] text-gray-500">by {owner.full_name || owner.email}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <CardFooter shareUrl={shareUrl} />
    </div>
  );
});

const StatBox = ({ value, label, isText }) => (
  <div className="text-center py-1.5 px-1 rounded-lg flex flex-col items-center justify-center" style={{ background: "#F8F7FF" }}>
    <p className={`font-bold leading-tight ${isText ? "text-[10px]" : "text-sm"}`} style={{ color: CU_PRIMARY }}>{value}</p>
    <p className="text-[9px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);

const CardFooter = ({ shareUrl }) => {
  let displayPath = shareUrl || "";
  try {
    const url = new URL(shareUrl);
    displayPath = url.pathname + url.search;
  } catch (e) {
    // keep original
  }

  return (
    <div
      className="px-5 py-2 flex items-center justify-between"
      style={{ background: "#F8F7FF", borderTop: "1px solid #E0D9FF" }}
    >
      <div className="flex items-center gap-1.5">
        <img src={LOGO_URL} alt="Collab Unity" crossOrigin="anonymous" className="w-5 h-5 rounded-md object-cover" />
        <span className="text-[11px] font-bold" style={{ color: CU_PRIMARY }}>Collab Unity</span>
      </div>
      <span className="text-[9px] text-gray-400 truncate max-w-[140px]">{displayPath}</span>
    </div>
  );
};