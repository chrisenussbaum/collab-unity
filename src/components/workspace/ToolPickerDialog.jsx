import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, Plus, Wrench, Loader2 } from "lucide-react";
import { getFaviconUrl } from "@/components/feed/appLibraryService";

// Curated catalog of popular tools — favicon shown in picker, emoji stored for the icon field
const CURATED_TOOLS = [
  { name: "Slack", url: "https://slack.com", emoji: "💬", category: "Communication" },
  { name: "Discord", url: "https://discord.com", emoji: "🎮", category: "Communication" },
  { name: "Zoom", url: "https://zoom.us", emoji: "📹", category: "Communication" },
  { name: "Google Meet", url: "https://meet.google.com", emoji: "📹", category: "Communication" },
  { name: "Microsoft Teams", url: "https://teams.microsoft.com", emoji: "💬", category: "Communication" },
  { name: "Figma", url: "https://figma.com", emoji: "🎨", category: "Design" },
  { name: "Canva", url: "https://canva.com", emoji: "🖌️", category: "Design" },
  { name: "Framer", url: "https://framer.com", emoji: "🎨", category: "Design" },
  { name: "Adobe XD", url: "https://adobe.com/products/xd", emoji: "🎨", category: "Design" },
  { name: "Sketch", url: "https://sketch.com", emoji: "🎨", category: "Design" },
  { name: "GitHub", url: "https://github.com", emoji: "🐙", category: "Development" },
  { name: "GitLab", url: "https://gitlab.com", emoji: "🦊", category: "Development" },
  { name: "VS Code", url: "https://code.visualstudio.com", emoji: "💻", category: "Development" },
  { name: "Cursor", url: "https://cursor.com", emoji: "💻", category: "Development" },
  { name: "Replit", url: "https://replit.com", emoji: "💻", category: "Development" },
  { name: "Docker", url: "https://docker.com", emoji: "🐳", category: "Development" },
  { name: "Vercel", url: "https://vercel.com", emoji: "▲", category: "Development" },
  { name: "Netlify", url: "https://netlify.com", emoji: "🌐", category: "Development" },
  { name: "Stack Overflow", url: "https://stackoverflow.com", emoji: "📚", category: "Development" },
  { name: "Trello", url: "https://trello.com", emoji: "📋", category: "Project Management" },
  { name: "Asana", url: "https://asana.com", emoji: "✅", category: "Project Management" },
  { name: "Jira", url: "https://atlassian.com/software/jira", emoji: "🔷", category: "Project Management" },
  { name: "ClickUp", url: "https://clickup.com", emoji: "✓", category: "Project Management" },
  { name: "Linear", url: "https://linear.app", emoji: "⚡", category: "Project Management" },
  { name: "Notion", url: "https://notion.so", emoji: "📝", category: "Project Management" },
  { name: "Monday", url: "https://monday.com", emoji: "📆", category: "Project Management" },
  { name: "Google Docs", url: "https://docs.google.com", emoji: "📄", category: "Productivity" },
  { name: "Google Sheets", url: "https://sheets.google.com", emoji: "📊", category: "Productivity" },
  { name: "Airtable", url: "https://airtable.com", emoji: "📊", category: "Productivity" },
  { name: "Webflow", url: "https://webflow.com", emoji: "🌊", category: "No-Code" },
  { name: "Bubble", url: "https://bubble.io", emoji: "🫧", category: "No-Code" },
  { name: "WordPress", url: "https://wordpress.com", emoji: "📝", category: "No-Code" },
  { name: "Shopify", url: "https://shopify.com", emoji: "🛍️", category: "No-Code" },
  { name: "Google Analytics", url: "https://analytics.google.com", emoji: "📈", category: "Analytics" },
  { name: "ChatGPT", url: "https://chat.openai.com", emoji: "🤖", category: "AI Tools" },
  { name: "Claude", url: "https://claude.ai", emoji: "🤖", category: "AI Tools" },
  { name: "Midjourney", url: "https://midjourney.com", emoji: "🎨", category: "AI Tools" },
  { name: "Google Drive", url: "https://drive.google.com", emoji: "📁", category: "File Storage" },
  { name: "Dropbox", url: "https://dropbox.com", emoji: "📦", category: "File Storage" },
  { name: "OneDrive", url: "https://onedrive.live.com", emoji: "☁️", category: "File Storage" },
  { name: "Loom", url: "https://loom.com", emoji: "📹", category: "Video" },
  { name: "YouTube", url: "https://youtube.com", emoji: "▶️", category: "Video" },
  { name: "Stripe", url: "https://stripe.com", emoji: "💳", category: "Payments" },
  { name: "Zapier", url: "https://zapier.com", emoji: "⚡", category: "Automation" },
  { name: "Calendly", url: "https://calendly.com", emoji: "📅", category: "Scheduling" },
  { name: "Typeform", url: "https://typeform.com", emoji: "📝", category: "Forms" },
];

export default function ToolPickerDialog({ open, onOpenChange, existingTools = [], onAddTools, saving }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(new Set());
      setCustomUrl("");
    }
  }, [open]);

  const existingUrls = useMemo(
    () => new Set((existingTools || []).map((t) => t.url)),
    [existingTools]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURATED_TOOLS;
    return CURATED_TOOLS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (url) => {
    if (existingUrls.has(url)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  // Auto-derive a name from a custom URL
  const customName = useMemo(() => {
    if (!customUrl.trim()) return "";
    try {
      return new URL(customUrl).hostname.replace(/^www\./, "").split(".")[0];
    } catch {
      return "";
    }
  }, [customUrl]);

  const customValid = useMemo(() => {
    if (!customUrl.trim()) return false;
    try {
      new URL(customUrl);
      return true;
    } catch {
      return false;
    }
  }, [customUrl]);

  const totalCount = selected.size + (customValid ? 1 : 0);

  const handleAdd = () => {
    const tools = [];
    for (const url of selected) {
      const t = CURATED_TOOLS.find((x) => x.url === url);
      if (t) tools.push({ name: t.name, url: t.url, icon: t.emoji });
    }
    if (customValid) {
      tools.push({ name: customName || "Custom Tool", url: customUrl.trim(), icon: "🔧" });
    }
    if (!tools.length) return;
    onAddTools(tools);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wrench className="w-4 h-4 text-purple-500" /> Add Project Tools
          </DialogTitle>
          <DialogDescription>
            Search popular tools or paste a custom URL to add to your project workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="pl-8 text-sm h-9"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto grid grid-cols-2 gap-1.5 pr-1">
          {filtered.map((t) => {
            const isExisting = existingUrls.has(t.url);
            const isSelected = selected.has(t.url);
            const favicon = getFaviconUrl(t.url);
            return (
              <button
                key={t.url}
                onClick={() => toggle(t.url)}
                disabled={isExisting}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-purple-400 bg-purple-50 ring-1 ring-purple-200"
                    : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                } ${isExisting ? "opacity-40 cursor-default" : ""}`}
              >
                {favicon ? (
                  <img src={favicon} alt="" className="w-5 h-5 rounded flex-shrink-0" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center text-sm">{t.emoji}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{t.category}</p>
                </div>
                {isExisting ? (
                  <Check className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-2 text-center text-xs text-gray-400 py-6">
              No matches — add a custom tool below.
            </p>
          )}
        </div>

        {/* Custom URL entry */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Add a custom tool
          </p>
          <div className="flex gap-2 items-center">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://your-tool.com"
              className="text-sm h-9 flex-1"
            />
            {customValid && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                {getFaviconUrl(customUrl) && (
                  <img src={getFaviconUrl(customUrl)} alt="" className="w-4 h-4 rounded" />
                )}
                <span className="text-xs text-gray-600 capitalize">{customName}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="cu-button"
            onClick={handleAdd}
            disabled={saving || totalCount === 0}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" />
                {totalCount > 0
                  ? `Add ${totalCount} tool${totalCount !== 1 ? "s" : ""}`
                  : "Add tools"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}