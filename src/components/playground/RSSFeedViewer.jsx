import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function RSSFeedViewer({ feedUrl, feedTitle, itemTitle, onBack }) {
  const [feedItems, setFeedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRSSFeed = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use AI to parse the RSS feed content
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Fetch and parse the RSS feed from this URL: ${feedUrl}

Extract all feed items and return them in a structured format. Each item should include:
- title: The item's title
- description: A brief description or summary
- link: The URL to the full content
- pubDate: Publication date if available
- author: Author name if available
- thumbnail: Image/thumbnail URL if available

Return up to 50 items from the feed.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    link: { type: "string" },
                    pubDate: { type: "string" },
                    author: { type: "string" },
                    thumbnail: { type: "string" }
                  }
                }
              }
            }
          }
        });

        setFeedItems(result.items || []);
      } catch (error) {
        console.error("Error fetching RSS feed:", error);
        setError("Failed to load feed content. The feed might be unavailable or in an unsupported format.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRSSFeed();
  }, [feedUrl]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white py-16 sm:py-20 -mt-14 pt-28 sm:-mt-16 sm:pt-32">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 mb-4"
              onClick={onBack}
            >
              ← Back
            </Button>
            
            <div className="flex items-center gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">{feedTitle}</h1>
                <p className="text-purple-100 text-lg">{itemTitle}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading feed content...</p>
          </div>
        ) : error ? (
          <Card className="cu-card">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Unable to Load Feed
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <a href={feedUrl} target="_blank" rel="noopener noreferrer">
                <Button className="cu-button">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Feed URL
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : feedItems.length === 0 ? (
          <Card className="cu-card">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Content Found
              </h3>
              <p className="text-gray-600">
                This feed doesn't contain any items yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="cu-card hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {item.thumbnail && (
                        <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden">
                          <img 
                            src={item.thumbnail} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          {item.author && <span>By {item.author}</span>}
                          {item.pubDate && <span>• {new Date(item.pubDate).toLocaleDateString()}</span>}
                        </div>
                        
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-3 h-3 mr-2" />
                              View Content
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}