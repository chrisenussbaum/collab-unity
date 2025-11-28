import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, ExternalLink, Globe, AlertCircle } from 'lucide-react';

export default function ProjectLinkPreviewDialog({ isOpen, onClose, url, projectTitle }) {
  const [previewMode, setPreviewMode] = useState('desktop');
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIframeError(false);
      setIsLoading(true);
      
      // Set a timeout to detect if iframe never loads
      timeoutRef.current = setTimeout(() => {
        setIframeError(true);
        setIsLoading(false);
      }, 8000); // 8 seconds timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, url]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Try to access iframe content to detect X-Frame-Options blocking
    try {
      const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
      if (iframeDoc) {
        setIsLoading(false);
        setIframeError(false);
      } else {
        setIframeError(true);
        setIsLoading(false);
      }
    } catch (e) {
      // Cross-origin or blocked
      setIframeError(true);
      setIsLoading(false);
    }
  };

  const handleIframeError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIframeError(true);
    setIsLoading(false);
  };

  const getDomain = (urlString) => {
    try {
      const urlObject = new URL(urlString);
      return urlObject.hostname.replace(/^www\./, '');
    } catch (e) {
      return urlString;
    }
  };

  const getFaviconUrl = (urlString) => {
    try {
      const urlObject = new URL(urlString);
      return `https://www.google.com/s2/favicons?sz=128&domain_url=${urlObject.hostname}`;
    } catch (e) {
      return null;
    }
  };

  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold mb-2">Published Project</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {projectTitle && (
                  <Badge variant="outline" className="text-xs">
                    {projectTitle}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {getDomain(url)}
                </Badge>
                {!iframeError && (
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                    <Button 
                      variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                      size="sm" 
                      className="h-7 px-3 text-xs" 
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="w-3 h-3 mr-1" />
                      Desktop
                    </Button>
                    <Button 
                      variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                      size="sm" 
                      className="h-7 px-3 text-xs" 
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="w-3 h-3 mr-1" />
                      Mobile
                    </Button>
                  </div>
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}

          {iframeError ? (
            <div className="flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                
                {getFaviconUrl(url) && (
                  <img 
                    src={getFaviconUrl(url)} 
                    alt="Site icon"
                    className="w-16 h-16 mx-auto mb-4"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Preview Not Available
                </h3>
                <p className="text-gray-600 mb-2">
                  This website cannot be embedded for security reasons.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Click below to visit <span className="font-semibold">{getDomain(url)}</span> in a new tab.
                </p>
                
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Visit {getDomain(url)}
                </Button>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-left">
                      Many websites block embedding to protect against security threats. 
                      This is normal and expected for sites like Medium, LinkedIn, and others.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`h-full w-full flex items-center justify-center transition-all ${previewMode === 'mobile' ? 'p-4' : ''}`}>
              <div className={`transition-all ${previewMode === 'mobile' ? 'w-[375px] h-[667px] border-8 border-gray-800 rounded-[2rem] shadow-2xl' : 'w-full h-full'}`}>
                <iframe
                  ref={iframeRef}
                  src={url}
                  className={`w-full h-full bg-white ${previewMode === 'mobile' ? 'rounded-[1.2rem]' : ''}`}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  title={`Preview of ${projectTitle || 'project'}`}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}