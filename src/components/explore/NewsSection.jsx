import React, { useState, useEffect } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { NewsSource } from "@/entities/all";
import { createPageUrl } from "@/utils";
import SectionShell, { SkeletonGrid, Empty } from "./SectionShell";

const getFavicon = (url) => `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
const screenshot = (url) => `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

export default function NewsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setItems(await NewsSource.list() || []); }
      catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  return (
    <SectionShell icon={Newspaper} title="News & Entertainment" seeAllTo={createPageUrl("NewsEntertainment")}>
      {loading ? <SkeletonGrid count={3} /> : items.length === 0 ? <Empty label="No news sources yet" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.slice(0, 6).map(n => (
            <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md hover:border-purple-300 transition-all">
              <div className="relative h-24 sm:h-28 overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={getFavicon(n.url)} alt="" className="w-8 h-8 rounded object-contain opacity-50" onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <img
                  src={screenshot(n.url)}
                  alt={`${n.name} preview`}
                  className="relative w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="flex items-center gap-2 p-2.5">
                <img src={getFavicon(n.url)} alt="" className="w-5 h-5 rounded object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-purple-700">{n.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{n.category}</p>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-400 flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      )}
    </SectionShell>
  );
}