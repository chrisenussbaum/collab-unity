import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import EditPortfolioItemDialog from "../portfolio/EditPortfolioItemDialog";

export default function EditPortfolioModal({ isOpen, onClose, portfolioItems, onSave }) {
  const [editedPortfolio, setEditedPortfolio] = useState(portfolioItems || []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  useEffect(() => { setEditedPortfolio(portfolioItems || []); }, [portfolioItems]);

  const handleOpenAddEdit = (index = null) => { setEditingIndex(index); setIsItemDialogOpen(true); };

  const handleSaveItem = (itemData) => {
    const updated = [...editedPortfolio];
    if (editingIndex !== null) updated[editingIndex] = itemData; else updated.push(itemData);
    setEditedPortfolio(updated);
    setIsItemDialogOpen(false);
    setEditingIndex(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try { await onSave(editedPortfolio); onClose(); }
    catch { toast.error("Failed to save portfolio."); }
    finally { setIsSaving(false); }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>Showcase your best work and completed projects</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button variant="outline" onClick={() => handleOpenAddEdit(null)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />Add Portfolio Item
            </Button>
            {editedPortfolio.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    {item.role && <p className="text-sm text-gray-600">{item.role}</p>}
                    {item.completion_date && <p className="text-xs text-gray-500 mt-1">{item.completion_date}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenAddEdit(index)}><Edit className="w-4 h-4 text-gray-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditedPortfolio(editedPortfolio.filter((_, i) => i !== index))}><X className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{item.description}</p>
                {item.technologies && item.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.technologies.slice(0, 5).map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tech}</Badge>
                    ))}
                    {item.technologies.length > 5 && <Badge variant="outline" className="text-xs">+{item.technologies.length - 5}</Badge>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">{isSaving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditPortfolioItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => { setIsItemDialogOpen(false); setEditingIndex(null); }}
        item={editingIndex !== null ? editedPortfolio[editingIndex] : null}
        onSave={handleSaveItem}
      />
    </>
  );
}