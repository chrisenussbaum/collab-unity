import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';

export default function ProjectLinkPreview({ url }) {
  if (!url) return null;

  let displayUrl = url;
  let domain = '';
  try {
    const urlObject = new URL(url);
    domain = urlObject.hostname;
    displayUrl = domain.replace(/^www\./, '');
  } catch (e) {
    // Fallback for invalid URLs
    displayUrl = url.split('/')[0];
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${domain}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mb-4 group">
      <Card className="cu-card bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <div className="flex-1 text-center bg-white dark:bg-gray-700 rounded-md mx-4 py-1 truncate">
              {displayUrl}
            </div>
          </div>
          <div className="relative aspect-video bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border">
            <div className="text-center">
              <img src={faviconUrl} alt="Favicon" className="w-12 h-12 mx-auto mb-2" onError={(e) => e.currentTarget.style.display = 'none'} />
              <p className="font-semibold text-gray-800 dark:text-gray-200">Live Preview</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Click to visit the live site</p>
            </div>
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <ArrowUpRight className="w-8 h-8 text-black/50 dark:text-white/50" />
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}