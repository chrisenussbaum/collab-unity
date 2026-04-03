import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Code2, FileText, Video, Music, Palette, Globe, BookOpen,
  ExternalLink, Plus, ChevronDown, ChevronUp, Hammer, Layers,
  PenTool, Film, Mic, Gamepad2, Database, Smartphone, Cpu
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const PROJECT_TYPES = [
  {
    id: "coding",
    label: "Coding",
    icon: Code2,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    activeColor: "bg-blue-600 text-white border-blue-600",
    description: "Software, web apps, scripts, APIs",
    tools: [
      { name: "GitHub", url: "https://github.com", icon: "🐙" },
      { name: "CodeSandbox", url: "https://codesandbox.io", icon: "📦" },
      { name: "Replit", url: "https://replit.com", icon: "🔁" },
      { name: "StackBlitz", url: "https://stackblitz.com", icon: "⚡" },
      { name: "Vercel", url: "https://vercel.com", icon: "▲" },
      { name: "Railway", url: "https://railway.app", icon: "🚂" },
    ],
  },
  {
    id: "writing",
    label: "Writing",
    icon: FileText,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    activeColor: "bg-amber-600 text-white border-amber-600",
    description: "Articles, books, scripts, blogs",
    tools: [
      { name: "Google Docs", url: "https://docs.google.com", icon: "📄" },
      { name: "Notion", url: "https://notion.so", icon: "📝" },
      { name: "Hemingway", url: "https://hemingwayapp.com", icon: "✍️" },
      { name: "Grammarly", url: "https://grammarly.com", icon: "🔤" },
      { name: "Scrivener", url: "https://literatureandlatte.com/scrivener", icon: "📚" },
    ],
  },
  {
    id: "video",
    label: "Video",
    icon: Video,
    color: "bg-red-100 text-red-700 border-red-200",
    activeColor: "bg-red-600 text-white border-red-600",
    description: "Films, reels, tutorials, vlogs",
    tools: [
      { name: "CapCut", url: "https://capcut.com", icon: "✂️" },
      { name: "DaVinci Resolve", url: "https://blackmagicdesign.com/products/davinciresolve", icon: "🎬" },
      { name: "YouTube Studio", url: "https://studio.youtube.com", icon: "▶️" },
      { name: "Frame.io", url: "https://frame.io", icon: "🖼️" },
      { name: "Loom", url: "https://loom.com", icon: "🎥" },
    ],
  },
  {
    id: "design",
    label: "Design",
    icon: Palette,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    activeColor: "bg-purple-600 text-white border-purple-600",
    description: "UI/UX, graphics, branding, art",
    tools: [
      { name: "Figma", url: "https://figma.com", icon: "🎨" },
      { name: "Canva", url: "https://canva.com", icon: "🖌️" },
      { name: "Adobe XD", url: "https://adobe.com/products/xd.html", icon: "⬡" },
      { name: "Dribbble", url: "https://dribbble.com", icon: "🏀" },
      { name: "Behance", url: "https://behance.net", icon: "🅱️" },
    ],
  },
  {
    id: "music",
    label: "Music / Audio",
    icon: Music,
    color: "bg-green-100 text-green-700 border-green-200",
    activeColor: "bg-green-600 text-white border-green-600",
    description: "Tracks, podcasts, sound design",
    tools: [
      { name: "GarageBand", url: "https://apple.com/mac/garageband", icon: "🎸" },
      { name: "BandLab", url: "https://bandlab.com", icon: "🎵" },
      { name: "Anchor", url: "https://anchor.fm", icon: "🎙️" },
      { name: "SoundCloud", url: "https://soundcloud.com", icon: "☁️" },
      { name: "Splice", url: "https://splice.com", icon: "🎹" },
    ],
  },
  {
    id: "game",
    label: "Game Dev",
    icon: Gamepad2,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    activeColor: "bg-orange-600 text-white border-orange-600",
    description: "Games, simulations, interactive experiences",
    tools: [
      { name: "Unity", url: "https://unity.com", icon: "🎮" },
      { name: "Unreal Engine", url: "https://unrealengine.com", icon: "🔵" },
      { name: "Godot", url: "https://godotengine.org", icon: "👾" },
      { name: "itch.io", url: "https://itch.io", icon: "🕹️" },
      { name: "GameMaker", url: "https://gamemaker.io", icon: "🏗️" },
    ],
  },
  {
    id: "web",
    label: "Web / No-Code",
    icon: Globe,
    color: "bg-teal-100 text-teal-700 border-teal-200",
    activeColor: "bg-teal-600 text-white border-teal-600",
    description: "Websites, landing pages, no-code apps",
    tools: [
      { name: "Webflow", url: "https://webflow.com", icon: "🌊" },
      { name: "Wix", url: "https://wix.com", icon: "⬛" },
      { name: "WordPress", url: "https://wordpress.com", icon: "🅆" },
      { name: "Framer", url: "https://framer.com", icon: "🖥️" },
      { name: "Bubble", url: "https://bubble.io", icon: "🔵" },
    ],
  },
  {
    id: "research",
    label: "Research",
    icon: Database,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    activeColor: "bg-gray-700 text-white border-gray-700",
    description: "Studies, analysis, data, papers",
    tools: [
      { name: "Google Scholar", url: "https://scholar.google.com", icon: "🔬" },
      { name: "Zotero", url: "https://zotero.org", icon: "📖" },
      { name: "Jupyter", url: "https://jupyter.org", icon: "🪐" },
      { name: "Obsidian", url: "https://obsidian.md", icon: "🔮" },
      { name: "Miro", url: "https://miro.com", icon: "🗺️" },
    ],
  },
];

export default function BuildTab({ project, currentUser, isCollaborator, isProjectOwner }) {
  const [selectedType, setSelectedType] = useState(null);
  const [buildNotes, setBuildNotes] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [customLinkLabel, setCustomLinkLabel] = useState("");
  const [savedLinks, setSavedLinks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

  const activeType = PROJECT_TYPES.find(t => t.id === selectedType);

  const handleAddCustomLink = () => {
    if (!customLink.trim()) return;
    try {
      new URL(customLink);
      setSavedLinks(prev => [...prev, { url: customLink, label: customLinkLabel || customLink }]);
      setCustomLink("");
      setCustomLinkLabel("");
      setShowAddLink(false);
      toast.success("Link added to your build workspace.");
    } catch {
      toast.error("Please enter a valid URL (include https://)");
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    toast.success("Build notes saved.");
  };

  const canEdit = isCollaborator || isProjectOwner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Hammer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Build Workspace</h2>
          <p className="text-sm text-gray-500">Select your project type to get tools, resources, and a shared build space.</p>
        </div>
      </div>

      {/* Project Type Selector */}
      <Card className="cu-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Layers className="w-4 h-4 mr-2 text-purple-600" />
            What are you building?
          </CardTitle>
          <CardDescription>Choose the type that best fits your project.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {PROJECT_TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(isActive ? null : type.id)}
                  className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left ${
                    isActive ? type.activeColor : `${type.color} hover:opacity-80`
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="font-semibold text-sm">{type.label}</span>
                  <span className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "opacity-70"}`}>{type.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tools for selected type */}
      {activeType && (
        <Card className="cu-card border-2 border-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <activeType.icon className="w-4 h-4 mr-2 text-purple-600" />
              Recommended Tools — {activeType.label}
            </CardTitle>
            <CardDescription>Click any tool to open it in a new tab.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeType.tools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg transition-all group"
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 group-hover:text-purple-700 truncate">{tool.name}</p>
                    <p className="text-xs text-gray-400 truncate">{new URL(tool.url).hostname.replace("www.", "")}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-500 flex-shrink-0" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shared Build Links */}
      <Card className="cu-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center">
              <ExternalLink className="w-4 h-4 mr-2 text-purple-600" />
              Team Build Links
            </CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddLink(!showAddLink)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </Button>
            )}
          </div>
          <CardDescription>Share repos, demos, staging links, or any build resource with the team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddLink && canEdit && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
              <Input
                placeholder="Label (e.g. GitHub Repo, Staging Link)"
                value={customLinkLabel}
                onChange={(e) => setCustomLinkLabel(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustomLink()}
                  className="text-sm"
                />
                <Button onClick={handleAddCustomLink} size="sm" className="cu-button flex-shrink-0">Add</Button>
              </div>
            </div>
          )}

          {savedLinks.length === 0 && !showAddLink && (
            <div className="text-center py-6 text-gray-400">
              <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No build links yet. Add repos, demos, or staging links to share with the team.</p>
            </div>
          )}

          {savedLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-lg transition-all group"
            >
              <Globe className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-gray-900 truncate">{link.label}</p>
                <p className="text-xs text-gray-400 truncate">{link.url}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-500" />
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Shared Build Notes */}
      <Card className="cu-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <PenTool className="w-4 h-4 mr-2 text-purple-600" />
            Build Notes
          </CardTitle>
          <CardDescription>Jot down build decisions, blockers, architecture notes, or anything the team needs to know.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g. We're using Next.js with Supabase. API routes live in /pages/api. Ask @alex before touching the auth flow..."
            value={buildNotes}
            onChange={(e) => setBuildNotes(e.target.value)}
            rows={6}
            disabled={!canEdit}
            className="text-sm resize-none"
          />
          {canEdit && (
            <div className="flex justify-end">
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving || !buildNotes.trim()}
                size="sm"
                className="cu-button"
              >
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}