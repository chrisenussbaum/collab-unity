import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Search, Star, HandHeart, Users, ExternalLink, Camera, Play, Loader2, Filter } from "lucide-react";
import { motion } from "framer-motion";
import OptimizedAvatar from "@/components/OptimizedAvatar";
import OptimizedImage from "@/components/OptimizedImage";
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";

const CLASSIFICATIONS = ["All", "startup", "educational", "career_development", "hobby", "business", "nonprofit"];
const formatLabel = (s) => s.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

export default function ProjectShowcases({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassification, setSelectedClassification] = useState("All");
  const [sortBy, setSortBy] = useState("most_applauded");

  useEffect(() => {
    loadShowcases();
  }, []);

  const loadShowcases = async () => {
    setLoading(true);
    // Fetch completed/in_progress projects that are visible and have highlights or project_urls (showcaseable)
    const [allProjects, applauds] = await Promise.all([
      base44.entities.Project.filter({ is_visible_on_feed: true }, "-created_date", 100),
      base44.entities.ProjectApplaud.filter({}, "-created_date", 500),
    ]);

    // Only show projects with highlights or external URLs or enough applauds
    const showcaseable = allProjects.filter(p =>
      (p.highlights && p.highlights.length > 0) ||
      (p.project_urls && p.project_urls.length > 0) ||
      applauds.filter(a => a.project_id === p.id).length >= 1
    );

    // Enrich with owner profiles and applaud counts
    const ownerEmails = [...new Set(showcaseable.map(p => p.created_by))];
    let profilesMap = {};
    if (ownerEmails.length > 0) {
      const { data } = await getPublicUserProfiles({ emails: ownerEmails });
      (data || []).forEach(u => { profilesMap[u.email] = u; });
    }

    const enriched = showcaseable.map(p => ({
      ...p,
      owner: profilesMap[p.created_by] || { email: p.created_by, full_name: p.created_by.split("@")[0] },
      applaudCount: applauds.filter(a => a.project_id === p.id).length,
    }));

    setProjects(enriched);
    setLoading(false);
  };

  const filtered = projects.filter(p => {
    const matchesSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassification === "All" || p.classification === selectedClassification;
    return matchesSearch && matchesClass;
  }).sort((a, b) => {
    if (sortBy === "most_applauded") return b.applaudCount - a.applaudCount;
    if (sortBy === "most_recent") return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === "most_collaborators") return (b.collaborator_emails?.length || 0) - (a.collaborator_emails?.length || 0);
    return 0;
  });

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12 -mt-14 pt-28 sm:-mt-16 sm:pt-32">
        <div className="cu-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl cu-gradient flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Project <span style={{ color: "var(--cu-primary)" }}>Showcases</span></h1>
            <p className="text-gray-600 max-w-xl mx-auto">Get inspired by what the community is building. Celebrate great work.</p>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Input placeholder="Search showcases..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-white" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <Select value={selectedClassification} onValueChange={setSelectedClassification}>
            <SelectTrigger className="w-full sm:w-48 bg-white"><SelectValue placeholder="Classification" /></SelectTrigger>
            <SelectContent>
              {CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c === "All" ? "All Types" : formatLabel(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-44 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="most_applauded">Most Applauded</SelectItem>
              <SelectItem value="most_recent">Most Recent</SelectItem>
              <SelectItem value="most_collaborators">Most Collaborators</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No showcases yet. Start building something amazing!</p>
            <Link to={createPageUrl("CreateProject")}>
              <Button className="mt-4" style={{ background: "var(--cu-primary)" }}>Create a Project</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Featured top 3 */}
            {featured.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="font-bold text-gray-900 text-lg">Featured Projects</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((project, i) => <ShowcaseCard key={project.id} project={project} index={i} featured />)}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-4">All Showcases</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map((project, i) => <ShowcaseCard key={project.id} project={project} index={i} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ShowcaseCard({ project, index, featured }) {
  const firstHighlight = project.highlights?.[0];
  const mediaUrl = firstHighlight?.media_url || firstHighlight?.image_url;
  const isVideo = firstHighlight?.media_type === "video";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
        <Card className={`cu-card h-full flex flex-col hover:shadow-lg transition-all overflow-hidden ${featured ? "border-yellow-200 border-2" : ""}`}>
          {/* Media */}
          <div className="relative h-40 bg-gray-100 overflow-hidden">
            {mediaUrl ? (
              isVideo ? (
                <div className="relative w-full h-full">
                  {firstHighlight?.thumbnail_url ? (
                    <img src={firstHighlight.thumbnail_url} className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaUrl} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                </div>
              ) : (
                <OptimizedImage src={mediaUrl} alt={project.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              )
            ) : project.logo_url ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
                <img src={project.logo_url} alt={project.title} className="w-20 h-20 rounded-xl object-contain" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-200">
                <Camera className="w-10 h-10 text-purple-300" />
              </div>
            )}
            {featured && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-900" /> Featured
              </div>
            )}
          </div>

          <CardContent className="flex-1 pt-4 pb-2">
            <div className="flex items-start gap-2 mb-2">
              {project.logo_url && mediaUrl && (
                <img src={project.logo_url} alt={project.title} className="w-7 h-7 rounded object-cover flex-shrink-0 border border-gray-100" />
              )}
              <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug">{project.title}</h3>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>

            {project.classification && (
              <Badge className="text-xs bg-purple-50 text-purple-700 border border-purple-200">{formatLabel(project.classification)}</Badge>
            )}
          </CardContent>

          <CardFooter className="border-t pt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <OptimizedAvatar src={project.owner?.profile_image} alt={project.owner?.full_name} fallback={project.owner?.full_name?.[0] || "?"} size="xs" className="w-5 h-5" />
              <span className="text-xs text-gray-600 truncate max-w-[80px]">{project.owner?.full_name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-purple-600 font-medium">
                <HandHeart className="w-3.5 h-3.5" /> {project.applaudCount}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {project.collaborator_emails?.length || 1}
              </span>
              {project.project_urls?.length > 0 && (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}