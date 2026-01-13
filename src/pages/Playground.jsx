import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import ContentViewer from "../components/playground/ContentViewer";
import RSSFeedViewer from "../components/playground/RSSFeedViewer";
import { 
  Sparkles, 
  Book, 
  Tv, 
  Gamepad2, 
  Code, 
  Palette, 
  Music, 
  Film,
  Headphones,
  Puzzle,
  Brush,
  Rocket,
  Library,
  Monitor,
  Wand2
} from "lucide-react";

const PLAYGROUND_CATEGORIES = [
  {
    id: 'create',
    title: 'Creative Studio',
    description: 'Build and design your own projects',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    items: [
      { title: 'Code Editor', icon: Code, description: 'Write and run code', color: 'bg-blue-100 text-blue-700' },
      { title: 'Design Canvas', icon: Brush, description: 'Create visual designs', color: 'bg-pink-100 text-pink-700' },
      { title: 'Music Maker', icon: Music, description: 'Compose and mix music', color: 'bg-purple-100 text-purple-700' },
      { title: 'Animation Studio', icon: Film, description: 'Create animations', color: 'bg-indigo-100 text-indigo-700' }
    ]
  },
  {
    id: 'learn',
    title: 'Learning Hub',
    description: 'Expand your knowledge and skills',
    icon: Book,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    items: [
      { title: 'Digital Library', icon: Library, description: 'Read books and articles', color: 'bg-amber-100 text-amber-700' },
      { title: 'Video Courses', icon: Monitor, description: 'Watch educational content', color: 'bg-blue-100 text-blue-700' },
      { title: 'Podcasts', icon: Headphones, description: 'Listen and learn', color: 'bg-green-100 text-green-700' },
      { title: 'Tutorials', icon: Wand2, description: 'Step-by-step guides', color: 'bg-purple-100 text-purple-700' }
    ]
  },
  {
    id: 'play',
    title: 'Entertainment Zone',
    description: 'Games, shows, and interactive experiences',
    icon: Gamepad2,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    items: [
      { title: 'Games', icon: Gamepad2, description: 'Play interactive games', color: 'bg-red-100 text-red-700' },
      { title: 'Shows & Movies', icon: Tv, description: 'Watch entertainment', color: 'bg-purple-100 text-purple-700' },
      { title: 'Puzzles', icon: Puzzle, description: 'Brain teasers and challenges', color: 'bg-yellow-100 text-yellow-700' },
      { title: 'Interactive Stories', icon: Book, description: 'Choose your adventure', color: 'bg-pink-100 text-pink-700' }
    ]
  }
];

export default function Playground({ currentUser }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [contentFeed, setContentFeed] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [currentItemType, setCurrentItemType] = useState(null);
  const [viewingRSSFeed, setViewingRSSFeed] = useState(null);

  const loadContentForItem = async (categoryId, itemTitle) => {
    setIsLoadingContent(true);
    try {
      // Map item titles to category enums
      const categoryMap = {
        'Digital Library': 'digital_library',
        'Video Courses': 'video_courses',
        'Podcasts': 'podcasts',
        'Tutorials': 'tutorials',
        'Games': 'games',
        'Shows & Movies': 'shows_movies',
        'Puzzles': 'puzzles',
        'Interactive Stories': 'interactive_stories'
      };

      const categoryEnum = categoryMap[itemTitle];
      setCurrentItemType(categoryEnum);
      
      if (categoryEnum) {
        const content = await base44.entities.PlaygroundContent.filter({
          category: categoryEnum,
          is_approved: true
        }, '-created_date');
        
        setContentFeed(content || []);
      }
    } catch (error) {
      console.error("Error loading content:", error);
      setContentFeed([]);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Show RSS feed viewer if viewing an RSS feed
  if (viewingRSSFeed) {
    return (
      <RSSFeedViewer
        feedUrl={viewingRSSFeed.url}
        feedTitle={viewingRSSFeed.title}
        itemTitle={selectedItem?.title}
        onBack={() => setViewingRSSFeed(null)}
      />
    );
  }

  // Show content feed for a specific item
  if (selectedItem) {
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
                onClick={() => setSelectedItem(null)}
              >
                ← Back
              </Button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 ${selectedItem.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <selectedItem.icon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">{selectedItem.title}</h1>
                  <p className="text-purple-100 text-lg">{selectedItem.description}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="cu-container cu-page">
          {isLoadingContent ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          ) : contentFeed.length === 0 ? (
            <Card className="cu-card">
              <CardContent className="p-12 text-center">
                <selectedItem.icon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Content Yet
                </h3>
                <p className="text-gray-600">
                  Content for {selectedItem.title} is coming soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentFeed.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="cu-card h-full hover:shadow-xl transition-all border-2 hover:border-purple-300 cursor-pointer"
                    onClick={() => {
                      if (item.content_type === 'rss_feed') {
                        setViewingRSSFeed(item);
                      } else {
                        setViewingContent(item);
                      }
                    }}
                  >
                    {item.image_url && (
                      <div className="h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-8">
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="w-24 h-24 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="flex items-center justify-center w-full h-full"><div class="text-center"><div class="${selectedItem?.color || 'bg-purple-100 text-purple-700'} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><p class="text-xs text-gray-500 font-medium">No Preview</p></div></div>`;
                          }}
                        />
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                      {item.author && (
                        <p className="text-sm text-gray-600">By {item.author}</p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-2">
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {item.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {item.duration}
                          </Badge>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          item.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-purple-50">
                              {tag}
                            </Badge>
                          ))
                        )}
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        {item.content_type === 'rss_feed' ? 'Browse Feed' :
                         currentItemType === 'podcasts' || currentItemType === 'video_courses' || currentItemType === 'shows_movies' ? 'Play' : 
                         currentItemType === 'games' || currentItemType === 'interactive_stories' ? 'Launch' : 
                         'Read'} →
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Content Viewer Modal */}
        {viewingContent && (
          <ContentViewer 
            item={viewingContent}
            itemType={currentItemType}
            onClose={() => setViewingContent(null)}
          />
        )}
      </div>
    );
  }

  if (selectedCategory) {
    const category = PLAYGROUND_CATEGORIES.find(c => c.id === selectedCategory);
    
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
                onClick={() => setSelectedCategory(null)}
              >
                ← Back to Playground
              </Button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">{category.title}</h1>
                  <p className="text-purple-100 text-lg">{category.description}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="cu-container cu-page">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.items.map((item, index) => {
              const Icon = item.icon;
              
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="cu-card h-full hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-300"
                    onClick={() => {
                      setSelectedItem(item);
                      loadContentForItem(category.id, item.title);
                    }}
                  >
                    <CardHeader>
                      <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full">
                        Explore →
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white py-16 sm:py-20 md:py-24 -mt-14 pt-28 sm:-mt-16 sm:pt-32 md:-mt-20 md:pt-36">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Welcome to the <span className="text-yellow-400">Playground</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-100 mb-8 sm:mb-10 max-w-3xl mx-auto px-4">
              Your creative workspace for building, learning, and exploring.
              Design projects, discover knowledge, and enjoy interactive experiences.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="cu-container cu-page">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLAYGROUND_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card 
                  className="cu-card h-full cursor-pointer hover:shadow-2xl transition-all border-2 hover:border-purple-300 group"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardHeader className={`${category.bgColor} border-b-2 ${category.borderColor}`}>
                    <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900">{category.title}</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {category.items.map(item => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.title} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="cu-card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="py-8 text-center">
              <Rocket className="w-12 h-12 mx-auto text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Something Amazing is Coming
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The Playground is being built to give you an immersive environment for creativity, 
                learning, and entertainment. Click on a category above to explore what's planned.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}