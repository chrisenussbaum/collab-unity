import React, { useState, useEffect } from "react";
import { Project, CommunityTool } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ExternalLink, Search, Trash2, Loader2, Check, Link as LinkIcon, Plug } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_TOOLS } from "../constants";
import { base44 } from "@/api/base44Client";

// Base44 App Connectors with proper URLs for favicon fetching
const BASE44_CONNECTORS = [
  {
    name: "Salesforce",
    integration_type: "salesforce",
    url: "https://www.salesforce.com",
    description: "Automate and sync CRM records.",
    category: "CRM",
    scopes: ["api", "refresh_token", "offline_access"]
  },
  {
    name: "Slack",
    integration_type: "slack",
    url: "https://slack.com",
    description: "Send updates and notifications to your team.",
    category: "Communication",
    scopes: ["chat:write", "channels:read", "users:read"]
  },
  {
    name: "Notion",
    integration_type: "notion",
    url: "https://www.notion.so",
    description: "Organize and sync knowledge or project data.",
    category: "Productivity",
    scopes: ["read_content", "update_content"]
  },
  {
    name: "Google Calendar",
    integration_type: "googlecalendar",
    url: "https://calendar.google.com",
    description: "Manage your schedule and calendar events.",
    category: "Productivity",
    scopes: ["https://www.googleapis.com/auth/calendar"]
  },
  {
    name: "Google Drive",
    integration_type: "googledrive",
    url: "https://drive.google.com",
    description: "Export and back up app-generated files.",
    category: "Productivity",
    scopes: ["https://www.googleapis.com/auth/drive.file"]
  },
  {
    name: "Google Sheets",
    integration_type: "googlesheets",
    url: "https://sheets.google.com",
    description: "Sync and manage spreadsheet data.",
    category: "Productivity",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  },
  {
    name: "Google Slides",
    integration_type: "googleslides",
    url: "https://slides.google.com",
    description: "Create and edit Google Slides presentations.",
    category: "Productivity",
    scopes: ["https://www.googleapis.com/auth/presentations"]
  },
  {
    name: "Google Docs",
    integration_type: "googledocs",
    url: "https://docs.google.com",
    description: "Create and edit documents collaboratively in real-time with your team.",
    category: "Documentation",
    scopes: ["https://www.googleapis.com/auth/documents"]
  },
  {
    name: "HubSpot",
    integration_type: "hubspot",
    url: "https://www.hubspot.com",
    description: "Sync customer data, automate marketing workflows, and enhance sales productivity.",
    category: "CRM",
    scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write"]
  },
  {
    name: "LinkedIn",
    integration_type: "linkedin",
    url: "https://www.linkedin.com",
    description: "Post updates and manage your professional profile.",
    category: "Social",
    scopes: ["openid", "profile", "email", "w_member_social"]
  },
  {
    name: "TikTok",
    integration_type: "tiktok",
    url: "https://www.tiktok.com",
    description: "Read user profile info and stats.",
    category: "Social",
    scopes: ["user.info.basic", "user.info.profile"]
  }
];

// Tool descriptions for integration cards
const TOOL_DESCRIPTIONS = {
  "Slack": "Enhance productivity by centralizing notifications and enabling seamless team communication.",
  "Trello": "Organize tasks with visual boards for flexible project management and collaboration.",
  "Jira": "Track issues and manage agile workflows for software development teams.",
  "GitHub": "Host and review code, manage projects, and collaborate on software development.",
  "VS Code": "Write, debug, and deploy code with a powerful and extensible code editor.",
  "Miro": "Collaborate visually with interactive whiteboards for brainstorming and planning.",
  "Discord": "Connect with your community through voice, video, and text channels.",
  "Airtable": "Build flexible databases and spreadsheets for organizing any type of information.",
  "HubSpot": "Sync customer data, automate marketing workflows, and enhance sales productivity.",
  "Microsoft Office": "Create documents, spreadsheets, and presentations with the industry-standard suite.",
  "Adobe Premiere Pro": "Edit professional video content with industry-leading editing tools.",
  "Adobe Photoshop": "Design and edit images with the world's most powerful image editing software.",
  "Adobe Illustrator": "Create vector graphics and illustrations for any medium.",
  "Sketch": "Design user interfaces and prototypes with powerful vector design tools.",
  "Asana": "Manage work, projects, and tasks to help teams orchestrate their work.",
  "Monday.com": "Build apps that can read and write data from your project boards.",
  "Notion": "Combine notes, docs, and wikis in one flexible workspace for your team.",
  "Figma": "Design, prototype, and collaborate on interfaces in real-time.",
  "Google Docs": "Create and edit documents collaboratively in real-time with your team.",
  "Zoom": "Host video meetings and webinars for remote team collaboration.",
  "Google Meet": "Connect with team members through secure video conferencing.",
  "Microsoft Teams": "Chat, meet, call, and collaborate in one unified platform.",
  "Salesforce": "Manage customer relationships and sales pipelines effectively.",
  "Canva": "Create stunning graphics and designs with easy-to-use templates.",
  "Linear": "Streamline issue tracking and project planning for software teams.",
  "ClickUp": "Manage tasks, docs, goals, and more in one productivity platform.",
  "Basecamp": "Organize projects and communicate with your team in one place.",
  "Dropbox": "Store, sync, and share files securely across devices and teams.",
  "Google Drive": "Store and access files anywhere with cloud storage and file backup.",
  "AWS": "Build and deploy scalable applications with cloud computing services.",
  "Vercel": "Deploy and host web applications with global edge network delivery.",
  "Netlify": "Build, deploy, and scale modern web projects with ease.",
  "Heroku": "Deploy, manage, and scale applications in the cloud.",
  "Firebase": "Build and run apps with Google's mobile and web development platform.",
  "Supabase": "Build apps with an open-source Firebase alternative and Postgres database.",
  "MongoDB": "Store and manage data with a flexible, document-based database.",
  "PostgreSQL": "Manage data with a powerful, open-source relational database.",
  "Stripe": "Accept payments and manage business finances online.",
  "Mailchimp": "Create and send marketing emails and automated campaigns.",
  "Intercom": "Communicate with customers through messaging and support tools.",
  "Zendesk": "Provide customer service and support through multiple channels.",
  "Loom": "Record and share video messages with your team asynchronously.",
  "Calendly": "Schedule meetings without the back-and-forth emails.",
  "Typeform": "Create engaging forms and surveys with beautiful designs.",
  "Webflow": "Design and build professional websites visually without code.",
  "WordPress": "Create and manage websites and blogs with the popular CMS.",
  "Shopify": "Build and run an online store with ecommerce platform tools.",
  "default": "Integrate this tool to enhance your project workflow and collaboration."
};

export default function ToolsHub({ project, onProjectUpdate, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [tools, setTools] = useState(project?.project_tools || []);
  const [newToolName, setNewToolName] = useState("");
  const [newToolUrl, setNewToolUrl] = useState("");
  const [newToolCategory, setNewToolCategory] = useState("Other");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [communityTools, setCommunityTools] = useState([]);
  const [isLoadingCommunityTools, setIsLoadingCommunityTools] = useState(false);
  const [isSavingCommunityTool, setIsSavingCommunityTool] = useState(false);

  useEffect(() => {
    setTools(project?.project_tools || []);
  }, [project]);

  // Utility function to handle rate limits with exponential backoff
  const withRetry = async (apiCall, maxRetries = 5, baseDelay = 2000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
          console.warn(`Rate limit hit, retrying in ${(delay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  // Load community tools on component mount
  useEffect(() => {
    loadCommunityTools();
  }, []);

  const loadCommunityTools = async () => {
    setIsLoadingCommunityTools(true);
    try {
      // Add initial delay to prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const approvedTools = await withRetry(() => CommunityTool.filter({ is_approved: true }, '-usage_count', 50));
      setCommunityTools(approvedTools || []);
    } catch (error) {
      console.error("Error loading community tools:", error);
      // Fail silently - user can still use predefined tools
      setCommunityTools([]);
    } finally {
      setIsLoadingCommunityTools(false);
    }
  };

  // Combine predefined tools with community tools
  const allAvailableTools = [
    ...ALL_TOOLS,
    ...communityTools.map(ct => ({
      name: ct.name,
      url: ct.url,
      category: ct.category || "Other",
      description: `Community tool (used ${ct.usage_count || 0} times)`,
      isCommunityTool: true,
      communityToolId: ct.id
    }))
  ];

  const categories = ["all", ...new Set(allAvailableTools.map(t => t.category))].sort();

  const filteredPredefinedTools = allAvailableTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const notAlreadyAdded = !tools.some(t => t.name.toLowerCase() === tool.name.toLowerCase());
    return matchesSearch && matchesCategory && notAlreadyAdded;
  });

  const getToolIcon = (toolName) => {
    const name = toolName.toLowerCase();
    const iconMap = {
      figma: "🎨",
      slack: "💬",
      trello: "📋",
      jira: "🔷",
      notion: "📝",
      github: "🐙",
      "vs code": "💻",
      "google docs": "📄",
      "google maps": "🗺️",
      miro: "🖼️",
      discord: "🎮",
      asana: "✅",
      zoom: "📹",
      "google meet": "📞",
      teams: "👥",
      salesforce: "☁️",
      hubspot: "🔶",
      canva: "🖌️",
      airtable: "📊",
      monday: "📆",
      linear: "⚡",
      clickup: "✓",
      dropbox: "📦",
      "google drive": "🗂️",
      aws: "☁️",
      vercel: "▲",
      netlify: "🌐",
      heroku: "🟣",
      firebase: "🔥",
      supabase: "⚡",
      mongodb: "🍃",
      postgresql: "🐘",
      stripe: "💳",
      mailchimp: "📧",
      intercom: "💬",
      zendesk: "🎧",
      loom: "📹",
      calendly: "📅",
      typeform: "📝",
      webflow: "🌊",
      wordpress: "📰",
      shopify: "🛍️",
      adobe: "🔴",
      sketch: "💎",
      basecamp: "🏕️"
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key)) return icon;
    }
    return "🔧";
  };

  const getToolDescription = (toolName) => {
    return TOOL_DESCRIPTIONS[toolName] || TOOL_DESCRIPTIONS["default"];
  };

  const getFaviconUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${urlObject.hostname}`;
    } catch (e) {
      return null;
    }
  };

  const updateProjectTools = async (updatedTools, successMessage) => {
    try {
      await Project.update(project.id, { project_tools: updatedTools });
      setTools(updatedTools);
      toast.success(successMessage);
      
      // Notify parent to update project state for tab persistence
      if (onProjectUpdate) {
        onProjectUpdate();
      }
    } catch (error) {
      console.error("Error updating tools:", error);
      toast.error("Failed to update tools");
      setTools(project?.project_tools || []);
      throw error;
    }
  };

  const saveAsCommunityTool = async (toolName, toolUrl, category) => {
    try {
      setIsSavingCommunityTool(true);
      
      // Check if this tool already exists in community tools (case-insensitive)
      const existingCommunityTools = await CommunityTool.filter({});
      const exists = existingCommunityTools.some(ct => 
        ct.name.toLowerCase() === toolName.toLowerCase() && 
        ct.url.toLowerCase() === toolUrl.toLowerCase()
      );

      if (exists) {
        // Tool already exists, increment usage count
        const existingTool = existingCommunityTools.find(ct => 
          ct.name.toLowerCase() === toolName.toLowerCase() && 
          ct.url.toLowerCase() === toolUrl.toLowerCase()
        );
        
        if (existingTool) {
          await CommunityTool.update(existingTool.id, {
            usage_count: (existingTool.usage_count || 0) + 1
          });
        }
      } else {
        // Create new community tool
        await CommunityTool.create({
          name: toolName,
          url: toolUrl,
          category: category,
          icon: getToolIcon(toolName),
          usage_count: 1,
          is_approved: true
        });
        
        // Reload community tools to include the new one
        await loadCommunityTools();
        
        toast.success(`${toolName} saved as a community tool for everyone to use!`);
      }
    } catch (error) {
      console.error("Error saving community tool:", error);
      // Don't throw error - tool is still added to project even if community save fails
      toast.info("Tool added to project. Community save will be retried.");
    } finally {
      setIsSavingCommunityTool(false);
    }
  };

  const handleAddTool = async () => {
    if (!newToolName.trim() || !newToolUrl.trim()) {
      toast.error("Please provide both tool name and URL");
      return;
    }

    if (!newToolUrl.startsWith('http://') && !newToolUrl.startsWith('https://')) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    const toolExists = tools.some(t => t.name.toLowerCase() === newToolName.trim().toLowerCase());
    if (toolExists) {
      toast.error("This tool has already been added");
      return;
    }

    const newTool = {
      name: newToolName.trim(),
      url: newToolUrl.trim(),
      icon: getToolIcon(newToolName.trim())
    };

    const updatedTools = [...tools, newTool];
    
    try {
      // Save to project
      await updateProjectTools(updatedTools, "Tool added successfully!");
      
      // Save as community tool (async, doesn't block)
      saveAsCommunityTool(newToolName.trim(), newToolUrl.trim(), newToolCategory);
      
      // Clear form
      setNewToolName("");
      setNewToolUrl("");
      setNewToolCategory("Other");
    } catch (error) {
      // Error already handled by updateProjectTools
    }
  };

  const handleAddPredefinedTool = async (tool) => {
    const newTool = {
      name: tool.name,
      url: tool.url,
      icon: getToolIcon(tool.name)
    };
    const updatedTools = [...tools, newTool];
    
    try {
      await updateProjectTools(updatedTools, `${tool.name} added to your tools!`);
      
      // If it's a community tool, increment usage count
      if (tool.isCommunityTool && tool.communityToolId) {
        try {
          const communityTool = await CommunityTool.filter({ id: tool.communityToolId });
          if (communityTool.length > 0) {
            await CommunityTool.update(tool.communityToolId, {
              usage_count: (communityTool[0].usage_count || 0) + 1
            });
          }
        } catch (error) {
          console.error("Error updating community tool usage:", error);
          // Don't show error to user - tool is still added
        }
      }
    } catch (error) {
      // Error already handled by updateProjectTools
    }
  };

  const handleDelete = async (indexToDelete) => {
    const toolToDelete = tools[indexToDelete];
    setDeletingIndex(indexToDelete);
    const updatedTools = tools.filter((_, i) => i !== indexToDelete);
    try {
      await updateProjectTools(updatedTools, `${toolToDelete.name} removed successfully!`);
    } catch (error) {
      // Error already handled by updateProjectTools
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Tools</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isCollaborator
              ? "Add and manage tools your team uses for collaboration"
              : "View tools used by the project team"}
          </p>
          {isLoadingCommunityTools && (
            <p className="text-xs text-purple-600 mt-1 flex items-center">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading community tools...
            </p>
          )}
        </div>
        {isCollaborator && (
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} variant="outline">
            {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showAddForm ? "Cancel" : "Add Tool"}
          </Button>
        )}
      </div>

      {/* Base44 App Connectors Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Plug className="w-4 h-4 mr-2 text-purple-600" />
            App Connectors
          </h4>
          <Badge variant="secondary" className="text-xs">
            {BASE44_CONNECTORS.length} Available
          </Badge>
        </div>
        <p className="text-xs text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-100">
          💡 These integrations connect directly with your accounts. Add them to your project tools below to track which services your team uses.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BASE44_CONNECTORS.map((connector) => (
            <Card 
              key={connector.integration_type}
              className="bg-gray-50 hover:bg-white hover:shadow-md border hover:border-purple-200 transition-all cursor-pointer"
              onClick={() => {
                // Add connector as a regular tool
                const toolExists = tools.some(t => t.name.toLowerCase() === connector.name.toLowerCase());
                if (!toolExists) {
                  const newTool = {
                    name: connector.name,
                    url: connector.url,
                    icon: getToolIcon(connector.name)
                  };
                  const updatedTools = [...tools, newTool];
                  updateProjectTools(updatedTools, `${connector.name} added to your tools!`);
                } else {
                  toast.info(`${connector.name} is already in your tools`);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm flex-shrink-0 overflow-hidden">
                    {getFaviconUrl(connector.url) ? (
                      <img 
                        src={getFaviconUrl(connector.url)} 
                        alt={connector.name}
                        className="w-6 h-6"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span className={`text-xl ${getFaviconUrl(connector.url) ? 'hidden' : 'block'}`}>{getToolIcon(connector.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                      {connector.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {connector.description}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        const toolExists = tools.some(t => t.name.toLowerCase() === connector.name.toLowerCase());
                        if (!toolExists) {
                          const newTool = {
                            name: connector.name,
                            url: connector.url,
                            icon: getToolIcon(connector.name)
                          };
                          const updatedTools = [...tools, newTool];
                          updateProjectTools(updatedTools, `${connector.name} added to your tools!`);
                        } else {
                          toast.info(`${connector.name} is already in your tools`);
                        }
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add to Tools
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Integrated Tools Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Custom Tools ({tools.length})</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {tools.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                No tools integrated yet. Click "Add Tool" to get started.
              </p>
            ) : (
              tools.map((tool, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group"
                >
                  <Card className="bg-gray-50 hover:bg-white hover:shadow-md transition-all border-2 border-gray-100 hover:border-purple-200 h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm flex-shrink-0 overflow-hidden">
                          {getFaviconUrl(tool.url) ? (
                            <img 
                              src={getFaviconUrl(tool.url)} 
                              alt={tool.name}
                              className="w-6 h-6"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span className={`text-xl ${getFaviconUrl(tool.url) ? 'hidden' : 'block'}`}>{tool.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                            {tool.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                            {getToolDescription(tool.name)}
                          </p>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Open Tool
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      </div>

                      {/* Integrated badge */}
                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5">
                          <Check className="w-2.5 h-2.5 mr-0.5" />
                          Integrated
                        </Badge>
                      </div>

                      {/* Delete button */}
                      {isCollaborator && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          disabled={deletingIndex === index}
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 hover:text-red-600 shadow-sm h-7 w-7 border"
                        >
                          {deletingIndex === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Tools Section */}
      {showAddForm && isCollaborator && (
        <Card className="cu-card border-2 border-dashed border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Plus className="w-5 h-5 mr-2 text-purple-600" />
              Add Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Custom Tool */}
            <div className="space-y-4 p-4 bg-white rounded-lg">
              <h4 className="font-medium text-gray-900">Add Custom Tool</h4>
              <p className="text-xs text-gray-600">
                Custom tools are automatically saved for the entire platform to use!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toolName">Tool Name</Label>
                  <Input
                    id="toolName"
                    placeholder="e.g., Slack, Figma, Google Maps..."
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toolUrl">Tool URL</Label>
                  <Input
                    id="toolUrl"
                    placeholder="https://..."
                    value={newToolUrl}
                    onChange={(e) => setNewToolUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTool()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toolCategory">Category</Label>
                <select
                  id="toolCategory"
                  value={newToolCategory}
                  onChange={(e) => setNewToolCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="Communication">Communication</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Button 
                onClick={handleAddTool} 
                variant="outline" 
                size="sm" 
                className="w-full"
                disabled={isSavingCommunityTool}
              >
                {isSavingCommunityTool ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding & Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Tool
                  </>
                )}
              </Button>
            </div>

            {/* Predefined Tools */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Browse Tools</h4>
                <Badge variant="secondary">
                  {filteredPredefinedTools.length} available
                  {communityTools.length > 0 && ` (${communityTools.length} community)`}
                </Badge>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tools Grid - Integration Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
                {filteredPredefinedTools.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 col-span-full">
                    No tools found matching your search.
                  </p>
                ) : (
                  filteredPredefinedTools.map((tool, idx) => (
                    <Card 
                      key={idx} 
                      className="bg-gray-50 hover:bg-white hover:shadow-md transition-all border hover:border-purple-200 cursor-pointer group"
                      onClick={() => handleAddPredefinedTool(tool)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border shadow-sm flex-shrink-0 overflow-hidden">
                            {getFaviconUrl(tool.url) ? (
                              <img 
                                src={getFaviconUrl(tool.url)} 
                                alt={tool.name}
                                className="w-6 h-6"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <span className={`text-xl ${getFaviconUrl(tool.url) ? 'hidden' : 'block'}`}>{getToolIcon(tool.name)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">
                                {tool.name}
                              </h4>
                              {tool.isCommunityTool && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-2 flex-shrink-0">
                                  Community
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                              {getToolDescription(tool.name)}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-8 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddPredefinedTool(tool);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Integrate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}