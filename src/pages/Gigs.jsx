import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Briefcase, Plus, Loader2, Search, Clock, Settings2, Compass, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GigCard from "@/components/gigs/GigCard";
import PostGigDialog from "@/components/gigs/PostGigDialog";
import MyGigsTracker from "@/components/gigs/MyGigsTracker";
import GigApplicationManager from "@/components/gigs/GigApplicationManager";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Gigs({ currentUser }) {
  const [gigs, setGigs] = useState([]);
  const [myPostedGigs, setMyPostedGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("browse");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [selectedGig, setSelectedGig] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    setLoading(true);
    try {
      const allGigs = await base44.entities.Gig.filter(
        { is_archived: false },
        "-created_date",
        100
      );
      setGigs(allGigs);

      if (currentUser) {
        setMyPostedGigs(allGigs.filter((g) => g.owner_email === currentUser.email));
      }
    } catch (error) {
      console.error("Failed to load gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Gig.update(deleteTarget.id, { is_archived: true });
      toast.success("Gig removed.");
      setDeleteTarget(null);
      setSelectedGig(null);
      loadGigs();
    } catch (error) {
      toast.error("Failed to remove gig.");
    } finally {
      setDeleting(false);
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

    if (filter === "paid") return gig.gig_type === "paid";
    if (filter === "challenge") return gig.gig_type === "challenge";
    return true;
  });

  const tabs = [
    { key: "browse", label: "Browse", icon: Compass },
    ...(currentUser
      ? [
          { key: "applications", label: "My Applications", icon: Clock },
          { key: "manage", label: "Manage Gigs", icon: Settings2 },
        ]
      : []),
  ];

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
          <Button onClick={() => setShowPostDialog(true)} style={{ background: "var(--cu-primary)" }} className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            Post a Gig
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {tabs.map((t) => {
          const TabIcon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedGig(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-purple-600"
              }`}
              style={isActive ? { borderColor: "var(--cu-primary)" } : {}}
            >
              <TabIcon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Browse Tab */}
      {tab === "browse" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "paid", label: "Paid Gigs" },
                { key: "challenge", label: "Career Challenges" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.key ? "text-white" : "bg-white text-gray-600 hover:text-purple-600 border border-gray-200"
                  }`}
                  style={filter === f.key ? { background: "var(--cu-primary)" } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search gigs, skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : filteredGigs.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No gigs posted yet.</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to post a gig and find collaborators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} currentUser={currentUser} />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Applications Tab */}
      {tab === "applications" && <MyGigsTracker currentUser={currentUser} />}

      {/* Manage Gigs Tab */}
      {tab === "manage" && (
        <div>
          {selectedGig ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setSelectedGig(null)} className="text-sm text-gray-500 hover:text-purple-600">
                  ← Back to my gigs
                </button>
                <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(selectedGig)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Remove Gig
                </Button>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Applications: {selectedGig.title}</h2>
              <GigApplicationManager gig={selectedGig} currentUser={currentUser} />
            </div>
          ) : myPostedGigs.length === 0 ? (
            <div className="text-center py-20">
              <Settings2 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">You haven't posted any gigs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPostedGigs.map((gig) => (
                <div key={gig.id} className="cu-card p-4 flex items-center justify-between gap-3">
                  <button onClick={() => setSelectedGig(gig)} className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{gig.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {gig.status === "open" ? "Accepting applications" : gig.status === "in_progress" ? "In progress" : gig.status === "completed" ? "Completed" : "Cancelled"}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gig.bounty_amount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>
                        ${gig.bounty_amount}
                      </span>
                    )}
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedGig(gig)}>
                      View Applications
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(gig)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PostGigDialog open={showPostDialog} onOpenChange={setShowPostDialog} onPosted={loadGigs} currentUser={currentUser} />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove this gig?</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.title}" will be removed from the Gigs page. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Removing..." : "Remove Gig"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}