import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Globe, Share2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PortfolioItem({ item, profileUser }) {
  const [relatedProject, setRelatedProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadRelatedProject = async () => {
      if (!item?.related_project_id) return;
      
      setIsLoadingProject(true);
      try {
        const projects = await base44.entities.Project.filter({
          id: item.related_project_id
        });
        
        if (isMounted && projects && projects.length > 0) {
          setRelatedProject(projects[0]);
        }
      } catch (error) {
        // Only log error if component is still mounted (not an abort)
        if (isMounted) {
          console.error("Error loading related project:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProject(false);
        }
      }
    };

    loadRelatedProject();

    return () => {
      isMounted = false;
    };
  }, [item?.related_project_id]);

  const generatePortfolioUrl = () => {
    if (!profileUser || !item?.title) return '';
    
    const baseUrl = window.location.origin;
    const profilePath = profileUser.username 
      ? `UserProfile?username=${profileUser.username}` 
      : `UserProfile?email=${profileUser.email}`;
    const anchor = `portfolio-${item.title.replace(/\s+/g, '-').toLowerCase()}`;
    return `${baseUrl}${createPageUrl(profilePath)}#${anchor}`;
  };

  const handleShare = () => {
    const url = generatePortfolioUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Portfolio link copied to clipboard!");
    }
  };

  if (!item) return null;

  return (
    <div 
      id={`portfolio-${item.title?.replace(/\s+/g, '-').toLowerCase() || 'item'}`}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      {/* Related Project Display */}
      {relatedProject && (
        <Link 
          to={createPageUrl(`ProjectDetail?id=${relatedProject.id}`)}
          className="block mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
        >
          <div className="flex items-center space-x-3">
            {relatedProject.logo_url && (
              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-purple-100">
                <img 
                  src={relatedProject.logo_url} 
                  alt={relatedProject.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-purple-700 mb-0.5">From Project:</p>
              <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {relatedProject.title}
              </p>
              <p className="text-xs text-gray-600 line-clamp-1">{relatedProject.description}</p>
            </div>
          </div>
        </Link>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {item.role && <span>{item.role}</span>}
            {item.role && item.completion_date && <span>•</span>}
            {item.completion_date && <span>{item.completion_date}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {item.project_url && (
            <a
              href={item.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700"
              title="External Link"
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={handleShare}
            className="text-gray-500 hover:text-purple-600 transition-colors"
            title="Copy shareable link"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {item.description}
      </p>

      {item.outcomes && item.outcomes.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-600 mb-1.5">Key Outcomes:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-2">
            {item.outcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </div>
      )}

      {item.technologies && item.technologies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.technologies.map((tech, idx) => (
            <Badge 
              key={idx} 
              className="text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200"
            >
              {tech}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}