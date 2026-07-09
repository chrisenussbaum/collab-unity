import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Clock, ExternalLink, Loader2, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const getFaviconUrl = (urlString) => {
  try {
    const hostname = new URL(urlString).hostname;
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${hostname}`;
  } catch {
    return null;
  }
};

const ResourceImage = ({ url, title, source }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <img
          src={getFaviconUrl(url)}
          alt=""
          className="w-12 h-12 mb-2 object-contain"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <span className="text-xs font-semibold text-gray-500 truncate max-w-[80%]">{source}</span>
      </div>
    );
  }

  return (
    <img
      src={`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`}
      alt={title}
      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
};

export default function MarketplaceResources() {
  const scrollRef = useRef(null);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a content curator for a freelancer and gig marketplace platform.
Find 6 real, helpful articles and resources for freelancers, gig workers, and service providers.
Topics should cover: writing gig listings that convert, pricing your services competitively, building a standout portfolio, writing winning gig applications, in-demand skills for freelancers, client communication best practices, and protecting your work online.
For each resource provide: title, url (a real existing URL to the article — not a homepage, the actual article), source (the website/publication name), summary (one sentence describing what the reader will learn), and readTime (e.g. "5 min read").
Only return resources you are confident actually exist. Use well-known sources like Medium, Harvard Business Review, Upwork blog, Fiverr blog, Freelancers Union, Forbes, Inc, etc.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              resources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                    source: { type: "string" },
                    summary: { type: "string" },
                    readTime: { type: "string" },
                  },
                },
              },
            },
          },
        });
        setResources(result?.resources || []);
      } catch (e) {
        console.error("Error fetching marketplace resources:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, []);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Resources</h2>
          <p className="text-sm text-gray-500 mt-0.5">Insights, tips, and tools to help you create impactful gigs and services.</p>
        </div>
        {!isLoading && resources.length > 0 && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => scroll(-1)}
              className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <p className="text-sm text-gray-500">Curating fresh resources for you...</p>
        </div>
      ) : resources.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No resources available right now. Check back later.</p>
      ) : (
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
          {resources.map((resource, i) => (
            <a
              key={i}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
            >
              <div className="relative h-36 overflow-hidden bg-gray-100">
                <ResourceImage url={resource.url} title={resource.title} source={resource.source} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {resource.readTime || "5 MIN READ"}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 mb-1 leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">{resource.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{resource.summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-medium">{resource.source}</span>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read article</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}