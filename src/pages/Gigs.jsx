import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Briefcase, Plus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GigCard from "@/components/gigs/GigCard";
import PostGigDialog from "@/components/gigs/PostGigDialog";

export default function Gigs({ currentUser }) {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostDialog, setShowPostDialog] = useState(false);

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    setLoading(true);
    try {
      const projects = await base44.entities.Project.filter(
        { is_visible_on_feed: true, is_archived: false },
        "-created_date",
        100
      );
      const gigProjects = projects.filter(
        (p) => (p.bounty_amount && p.bounty_amount > 0) || p.is_career_challenge
      );
      setGigs(gigProjects);
    } catch (error) {
      console.error("Failed to load gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGigs = gigs.filter((gig) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      gig.title?.toLowerCase().includes(q) ||
      gig.description?.toLowerCase().includes(q) ||
      gig.skills_needed?.some((s) => s.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filter === "paid") return gig.bounty_amount > 0;
    if (filter === "challenge") return gig.is_career_challenge;
    return true;
  });

  return (
    <div className="cu-container cu-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6" style={{ color: "var(--cu-primary)" }} />
            Gigs & Career Challenges
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Get paid to build, or prove your skills with real-world challenges.
          </p>
        </div>
        {currentUser && (
          <Button
            onClick={() => setShowPostDialog(true)}
            style={{ background: "var(--cu-primary)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post a Gig
          </Button>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "paid", label: "Paid Gigs" },
            { key: "challenge", label: "Career Challenges" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "text-white"
                  : "bg-white text-gray-600 hover:text-purple-600 border border-gray-200"
              }`}
              style={filter === tab.key ? { background: "var(--cu-primary)" } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search gigs, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Gigs Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : filteredGigs.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No gigs posted yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Be the first to post a gig and find collaborators.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} currentUser={currentUser} />
          ))}
        </div>
      )}

      <PostGigDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onPosted={loadGigs}
        currentUser={currentUser}
      />
    </div>
  );
}