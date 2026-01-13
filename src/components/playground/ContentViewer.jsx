import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Viewer for Podcasts and Video Courses
function MediaViewer({ item, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef(null);

  const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
  const isVimeo = item.url.includes('vimeo.com');
  const isSpotify = item.url.includes('spotify.com');
  const isSoundCloud = item.url.includes('soundcloud.com');
  const isApplePodcasts = item.url.includes('podcasts.apple.com');

  const getEmbedUrl = (url) => {
    if (isYouTube) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (isVimeo) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    if (isSpotify) {
      return url.replace('/episode/', '/embed/episode/').replace('/show/', '/embed/show/');
    }
    return null;
  };

  const embedUrl = getEmbedUrl(item.url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">{item.title}</h2>
            {item.author && (
              <p className="text-sm text-gray-600">By {item.author}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {embedUrl ? (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : isApplePodcasts || isSoundCloud ? (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg text-center mb-4">
              <Volume2 className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <p className="text-gray-700 mb-4">
                This podcast is hosted externally. Click below to listen.
              </p>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <Button className="cu-button">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Listen on {isApplePodcasts ? 'Apple Podcasts' : 'SoundCloud'}
                </Button>
              </a>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-lg text-center mb-4">
              <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Media player not available for this format</p>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </a>
            </div>
          )}

          {item.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {item.duration && (
              <Badge variant="secondary">{item.duration}</Badge>
            )}
            <Badge variant="outline">{item.content_type.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Viewer for Digital Library and Tutorials
function ContentReader({ item, onClose }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Simulate fetching content - in reality, you'd fetch from the URL
    // For now, we'll show the description and link to external content
    setIsLoading(false);
  }, [item.url]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">{item.title}</h2>
            {item.author && (
              <p className="text-sm text-gray-600">By {item.author}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {item.image_url && (
            <div className="w-full max-h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-6 overflow-hidden flex items-center justify-center">
              <img 
                src={item.image_url} 
                alt={item.title}
                className="w-full max-h-64 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-64"><div class="text-center"><div class="w-20 h-20 bg-purple-200 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><p class="text-sm text-gray-500 font-medium">Image not available</p></div></div>';
                }}
              />
            </div>
          )}

          <div className="prose max-w-none mb-6">
            {item.description ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {item.description}
              </div>
            ) : (
              <p className="text-gray-600">No preview available.</p>
            )}
          </div>

          <div className="border-t pt-6">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <Button className="cu-button w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Read Full Content
              </Button>
            </a>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {item.duration && (
              <Badge variant="secondary">{item.duration}</Badge>
            )}
            <Badge variant="outline">{item.content_type.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Viewer for Games and Interactive Stories
function InteractiveViewer({ item, onClose }) {
  const isEmbeddable = item.url.includes('itch.io') || 
                       item.url.includes('newgrounds.com') ||
                       item.url.includes('kongregate.com');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">{item.title}</h2>
            {item.author && (
              <p className="text-sm text-gray-600">By {item.author}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Maximize className="w-4 h-4 mr-2" />
                Full Screen
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {isEmbeddable ? (
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              <iframe
                src={item.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-12 rounded-lg text-center mb-4">
              {item.image_url ? (
                <div className="w-64 h-64 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg mx-auto mb-6 overflow-hidden flex items-center justify-center">
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-24 h-24 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>';
                    }}
                  />
                </div>
              ) : (
                <Play className="w-24 h-24 mx-auto text-orange-400 mb-6" />
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Play?</h3>
              <p className="text-gray-600 mb-6">
                {item.description || "Click below to start your adventure!"}
              </p>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="cu-button">
                  <Play className="w-5 h-5 mr-2" />
                  Launch {item.content_type === 'game' ? 'Game' : 'Experience'}
                </Button>
              </a>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {item.duration && (
              <Badge variant="secondary">{item.duration}</Badge>
            )}
            <Badge variant="outline">{item.content_type.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main ContentViewer component
export default function ContentViewer({ item, itemType, onClose }) {
  if (!item) return null;

  // Determine viewer type based on category
  const viewerMap = {
    'podcasts': MediaViewer,
    'video_courses': MediaViewer,
    'digital_library': ContentReader,
    'tutorials': ContentReader,
    'games': InteractiveViewer,
    'interactive_stories': InteractiveViewer,
    'shows_movies': MediaViewer
  };

  const ViewerComponent = viewerMap[itemType] || MediaViewer;

  return (
    <AnimatePresence>
      <ViewerComponent item={item} onClose={onClose} />
    </AnimatePresence>
  );
}