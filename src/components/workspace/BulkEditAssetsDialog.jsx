import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import TagInput from "./TagInput";

export default function BulkEditAssetsDialog({ isOpen, onClose, selectedAssets, allExistingTags, onSave }) {
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagMode, setTagMode] = useState("add"); // "add" | "replace"
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ category: category || null, tags, tagMode });
    setIsSaving(false);
    setCategory("");
    setTags([]);
    setTagMode("add");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedAssets.length} Asset{selectedAssets.length !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            Leave a field blank to keep each asset's existing value.
          </p>

          {/* Selected assets preview */}
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {selectedAssets.map(a => (
              <Badge key={a.id} variant="outline" className="text-xs">{a.asset_name}</Badge>
            ))}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Set Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="— keep existing —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>— keep existing —</SelectItem>
                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Documentation">Documentation</SelectItem>
                <SelectItem value="Code">Code</SelectItem>
                <SelectItem value="Media">Media</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Tags</label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTagMode("add")}
                  className={`px-2 py-0.5 rounded-full border transition-colors ${tagMode === "add" ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 text-gray-500 hover:border-purple-400"}`}
                >
                  Add to existing
                </button>
                <button
                  type="button"
                  onClick={() => setTagMode("replace")}
                  className={`px-2 py-0.5 rounded-full border transition-colors ${tagMode === "replace" ? "bg-purple-600 text-white border-purple-600" : "border-gray-300 text-gray-500 hover:border-purple-400"}`}
                >
                  Replace all
                </button>
              </div>
            </div>
            <TagInput tags={tags} onChange={setTags} allExistingTags={allExistingTags} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            className="cu-button"
            onClick={handleSave}
            disabled={isSaving || (!category && tags.length === 0)}
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : `Apply to ${selectedAssets.length} Asset${selectedAssets.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}