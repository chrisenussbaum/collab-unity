import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function SetPriceDialog({ isOpen, onClose, project, existingListing, onSuccess }) {
  const [price, setPrice] = useState(existingListing?.price || "");
  const [priceType, setPriceType] = useState(existingListing?.price_type || "consultation");
  const [consultationDuration, setConsultationDuration] = useState(existingListing?.consultation_duration_minutes || 60);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSaving(true);
    try {
      if (existingListing) {
        await base44.entities.MarketplaceListing.update(existingListing.id, {
          price: parseFloat(price),
          price_type: priceType,
          consultation_duration_minutes: consultationDuration
        });
        toast.success("Price updated successfully!");
      } else {
        await base44.entities.MarketplaceListing.create({
          project_id: project.id,
          seller_email: project.created_by,
          price: parseFloat(price),
          price_type: priceType,
          consultation_duration_minutes: consultationDuration,
          is_available: true
        });
        toast.success("Project listed for sale!");
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving marketplace listing:", error);
      toast.error("Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveListing = async () => {
    if (!existingListing) return;

    setIsSaving(true);
    try {
      await base44.entities.MarketplaceListing.delete(existingListing.id);
      toast.success("Project removed from marketplace");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error removing listing:", error);
      toast.error("Failed to remove listing");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="line-clamp-1">Set Price for "{project?.title}"</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Price Type</Label>
            <Select value={priceType} onValueChange={setPriceType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation Fee</SelectItem>
                <SelectItem value="fixed">Fixed Project Price</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 leading-relaxed">
              {priceType === "consultation" 
                ? "Charge for consultation meetings about the project"
                : "One-time price for the entire project"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Price (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9 h-11"
              />
            </div>
          </div>

          {priceType === "consultation" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Session Duration (minutes)</Label>
              <Select 
                value={consultationDuration.toString()} 
                onValueChange={(val) => setConsultationDuration(parseInt(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          {existingListing && (
            <Button
              variant="destructive"
              onClick={handleRemoveListing}
              disabled={isSaving}
              className="w-full sm:w-auto sm:mr-auto"
            >
              Remove from Marketplace
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="cu-button w-full sm:w-auto">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              existingListing ? "Update Price" : "List Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}