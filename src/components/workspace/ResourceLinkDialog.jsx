import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
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
import { Link2, Loader2 } from "lucide-react";
import { getFaviconUrl } from "@/components/feed/appLibraryService";
import { toast } from "sonner";

export default function ResourceLinkDialog({
  open,
  onOpenChange,
  project,
  currentUser,
  onSaved,
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl("");
      setTitle("");
      setCategory("");
      setSaving(false);
    }
  }, [open]);

  const favicon = useMemo(() => (url.trim() ? getFaviconUrl(url) : null), [url]);
  const autoTitle = useMemo(() => {
    if (!url.trim()) return "";
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }, [url]);

  const urlValid = useMemo(() => {
    if (!url.trim()) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  const handleSave = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast.error("URL is required");
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      toast.error("Enter a valid URL (include https://)");
      return;
    }
    setSaving(true);
    try {
      const assetName = title.trim() || autoTitle || trimmedUrl;
      const existing = await base44.entities.AssetVersion.filter({
        project_id: project.id,
        asset_name: assetName,
      });
      const versionNumber =
        existing.length > 0
          ? Math.max(...existing.map((a) => a.version_number || 1)) + 1
          : 1;
      await base44.entities.AssetVersion.create({
        project_id: project.id,
        asset_name: assetName,
        file_url: trimmedUrl,
        file_name: assetName,
        resource_type: "link",
        version_number: versionNumber,
        uploaded_by: currentUser?.email,
        is_current: true,
        category: category.trim() || "Link",
        tags: [],
      });
      toast.success("Resource link saved to Assets!");
      window.dispatchEvent(new CustomEvent('assetsUpdated', { detail: { projectId: project.id } }));
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to save resource");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-purple-500" /> Add Resource Link
          </DialogTitle>
          <DialogDescription>
            Save an article, doc, or video URL to your project Assets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">URL *</label>
            <div className="relative mt-1">
              {favicon && (
                <img
                  src={favicon}
                  alt=""
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded"
                />
              )}
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className={`text-sm h-9 ${favicon ? "pl-8" : ""}`}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={autoTitle || "Resource title"}
              className="text-sm h-9 mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Category</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Research, Inspiration, Docs"
              className="text-sm h-9 mt-1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="cu-button"
            onClick={handleSave}
            disabled={saving || !urlValid}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 mr-1" /> Save to Assets
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}