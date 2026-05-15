import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MapPin, Users, Lightbulb, ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/public/PublicLayout";

const CU_PURPLE = "#5B47DB";

const STATUS_COLORS = {
  seeking_collaborators: "bg-orange-100 text-orange-700 border-orange-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};
const STATUS_LABELS = {
  seeking_collaborators: "Seeking Collaborators",
  in_progress: "In Progress",
  completed: "Completed",
};
const CLASS_COLORS = {
  educational: "bg-blue-50 text-blue-700",
  career_development: "bg-pink-50 text-pink-700",
  hobby: "bg-yellow-50 text-yellow-700",
  business: "bg-orange-50 text-orange-700",
  nonprofit: "bg-teal-50 text-teal-700",
  startup: "bg-purple-50 text-purple-700",
};

// Fallback cover images by classification
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1461773518188-b3e86f98242f?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop",
];

function getProjectImage(project, index) {
  if (project.background_image_url) return project.background_image_url;
  if (project.logo_url) return project.logo_url;
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

// Large featured card
function FeaturedCard({ project, index }) {
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.in_progress;
  const statusLabel = STATUS_LABELS[project.status] || "In Progress";
  const classColor = CLASS_COLORS[project.classification] || "bg-gray-100 text-gray-600";
  const img = getProjectImage(project, index);

  return (
    <a href="https://collabunity.io/login" className="block group">
      <div className="relative rounded-2xl overflow-hidden mb-4">
        <img
          src={img}
          alt={project.title}
          className="w-full h-64 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor} bg-white/90`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        {project.logo_url ? (
          <img src={project.logo_url} alt={project.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#5B47DB] transition-colors leading-snug mb-1 line-clamp-2">
            {project.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{project.description}</p>
          <div className="flex flex-wrap items-center gap-2">
            {project.classification && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classColor}`}>
                {project.classification.replace(/_/g, ' ')}
              </span>
            )}
            {project.location && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />{project.location}
              </span>
            )}
            {project.current_collaborators_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3 h-3" />{project.current_collaborators_count} member{project.current_collaborators_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {project.skills_needed && project.skills_needed.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.skills_needed.slice(0, 3).map(s => (
                <span key={s} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
              ))}
              {project.skills_needed.length > 3 && (
                <span className="text-[11px] text-gray-400">+{project.skills_needed.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

// Smaller grid card
function ProjectCard({ project, index }) {
  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.in_progress;
  const statusLabel = STATUS_LABELS[project.status] || "In Progress";
  const img = getProjectImage(project, index);

  return (
    <a href="https://collabunity.io/login" className="block group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <img
          src={img}
          alt={project.title}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor} bg-white/90`}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {project.logo_url ? (
            <img src={project.logo_url} alt={project.title} className="w-7 h-7 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
            </div>
          )}
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#5B47DB] transition-colors line-clamp-1">
            {project.title}
          </h3>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{project.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{project.current_collaborators_count || 1} member{(project.current_collaborators_count || 1) !== 1 ? 's' : ''}</span>
          </div>
          {project.area_of_interest && (
            <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              {project.area_of_interest}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export default function Featured() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [interestFilter, setInterestFilter] = useState("All");

  const statusFilters = ["All", "Seeking Collaborators", "In Progress", "Completed"];
  const statusMap = { "Seeking Collaborators": "seeking_collaborators", "In Progress": "in_progress", "Completed": "completed" };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await base44.entities.Project.filter(
        { is_visible_on_feed: true, is_archived: false },
        "-updated_date",
        500
      );
      setProjects(allProjects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Derive unique industries and interests from loaded projects
  const industries = ["All", ...Array.from(new Set(projects.map(p => p.industry).filter(Boolean))).sort()];
  const interests = ["All", ...Array.from(new Set(projects.map(p => p.area_of_interest).filter(Boolean))).sort()];

  const filtered = projects.filter(p => {
    const matchStatus = statusFilter === "All" || p.status === statusMap[statusFilter];
    const matchIndustry = industryFilter === "All" || p.industry === industryFilter;
    const matchInterest = interestFilter === "All" || p.area_of_interest === interestFilter;
    return matchStatus && matchIndustry && matchInterest;
  });

  const featuredProject = filtered[0];
  const gridProjects = filtered.slice(1, 7);
  const remainingProjects = filtered.slice(7);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <PublicNav currentPage="Featured" />

      <div className="pt-14">
        {/* Hero */}
        <div className="border-b border-gray-200 py-12 px-4 bg-gradient-to-b from-purple-50/50 to-white">
          <div className="max-w-[1200px] mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#5B47DB]" />
              <span className="text-sm font-semibold text-[#5B47DB] uppercase tracking-wide">Community Projects</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-3">
              Bring a creative project to life.
            </h1>
            <p className="text-lg text-gray-500 max-w-[520px] mx-auto mb-6">
              Explore real projects built by our community. Find something inspiring — or start your own.
            </p>
            <a
              href="https://collabunity.io/login"
              className="inline-flex items-center gap-2 bg-[#5B47DB] text-white rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[#4A37C0] transition-colors"
            >
              Join & Collaborate <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Filter bar */}
        <div className="border-b border-gray-200 bg-white sticky top-14 z-40">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 space-y-2">
            {/* Status filters */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {statusFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                    statusFilter === f ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400 flex-shrink-0 pl-4">{filtered.length} projects</span>
            </div>
            {/* Industry + Interest dropdowns */}
            <div className="flex flex-wrap gap-2">
              <select
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#5B47DB] cursor-pointer"
              >
                {industries.map(i => <option key={i} value={i}>{i === "All" ? "All Industries" : i}</option>)}
              </select>
              <select
                value={interestFilter}
                onChange={e => setInterestFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-[#5B47DB] cursor-pointer"
              >
                {interests.map(i => <option key={i} value={i}>{i === "All" ? "All Areas of Interest" : i}</option>)}
              </select>
              {(industryFilter !== "All" || interestFilter !== "All") && (
                <button
                  onClick={() => { setIndustryFilter("All"); setInterestFilter("All"); }}
                  className="text-xs text-[#5B47DB] hover:underline px-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <div className="w-full h-72 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500">No projects found</h3>
              <p className="text-gray-400 text-sm mt-1">Try a different filter or check back soon.</p>
            </div>
          ) : (
            <>
              {/* Main layout: featured left + grid right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Featured project */}
                {featuredProject && (
                  <div className="lg:col-span-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Featured Project</p>
                    <FeaturedCard project={featuredProject} index={0} />
                  </div>
                )}

                {/* Grid of remaining projects */}
                {gridProjects.length > 0 && (
                  <div className="lg:col-span-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {statusFilter === "All" ? "All Projects" : statusFilter}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {gridProjects.map((project, i) => (
                        <ProjectCard key={project.id} project={project} index={i + 1} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Extra projects in full-width grid */}
              {remainingProjects.length > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-8 mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">More Projects</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {remainingProjects.map((project, i) => (
                      <ProjectCard key={project.id} project={project} index={i + 7} />
                    ))}
                  </div>
                </>
              )}

              {/* CTA */}
              <div className="mt-16 rounded-3xl bg-gradient-to-br from-[#5B47DB] to-indigo-600 p-10 text-center text-white">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Have a project idea?</h2>
                <p className="text-purple-200 mb-6 max-w-md mx-auto">Join Collab Unity, post your project, and find the collaborators you need to make it real.</p>
                <a
                  href="https://collabunity.io/login"
                  className="inline-flex items-center gap-2 bg-white text-[#5B47DB] font-bold px-6 py-3 rounded-full text-sm hover:bg-purple-50 transition-colors"
                >
                  Get started free <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </>
          )}
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}