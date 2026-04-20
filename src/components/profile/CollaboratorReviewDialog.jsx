import React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CollaboratorReviewDialog({
  isOpen,
  onClose,
  profileUser,
  selectedProjectForReview,
  reviewFormData,
  setReviewFormData,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Collaborator</DialogTitle>
          <DialogDescription>
            Share your experience working with {profileUser?.full_name || 'this user'} on "{selectedProjectForReview?.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label className="mb-2 block">Overall Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button key={rating} type="button"
                  onClick={() => setReviewFormData(prev => ({ ...prev, overall_rating: rating }))}
                  className="focus:outline-none transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${rating <= reviewFormData.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'collaboration_quality', label: 'Collaboration Quality (1-5)' },
              { key: 'communication', label: 'Communication (1-5)' },
              { key: 'reliability', label: 'Reliability (1-5)' },
              { key: 'skill_level', label: 'Skill Level (1-5)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label className="mb-1 block text-sm">{label}</Label>
                <Input
                  type="number" min="1" max="5"
                  value={reviewFormData[key]}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                    setReviewFormData(prev => ({ ...prev, [key]: val }));
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="review-text" className="mb-2 block">Review *</Label>
            <Textarea
              id="review-text"
              value={reviewFormData.review_text}
              onChange={(e) => setReviewFormData(prev => ({ ...prev, review_text: e.target.value }))}
              rows={6} placeholder="Share your experience working with this collaborator..."
              className="resize-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="would-collaborate" checked={reviewFormData.would_collaborate_again}
              onChange={(e) => setReviewFormData(prev => ({ ...prev, would_collaborate_again: e.target.checked }))}
              className="rounded text-purple-600 focus:ring-purple-500" />
            <Label htmlFor="would-collaborate" className="cursor-pointer text-sm font-medium">
              I would collaborate with this person again
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="is-public" checked={reviewFormData.is_public}
              onChange={(e) => setReviewFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="rounded text-purple-600 focus:ring-purple-500" />
            <Label htmlFor="is-public" className="cursor-pointer text-sm font-medium">
              Make this review public on their profile
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !reviewFormData.review_text.trim()} className="cu-button">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}