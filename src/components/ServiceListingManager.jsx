import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, X, DollarSign, Briefcase } from "lucide-react";
import { toast } from "sonner";
import ArrayInputWithSearch from "./ArrayInputWithSearch";

export default function ServiceListingManager({ currentUser, isOwner }) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    rate: { type: "hourly", amount: 0, currency: "USD" },
    skills_offered: [],
    portfolio_links: [],
    availability_status: "available"
  });

  useEffect(() => {
    if (currentUser) {
      loadListings();
    }
  }, [currentUser]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const serviceListings = await base44.entities.ServiceListing.filter({
        provider_email: currentUser.email
      });
      setListings(serviceListings || []);
    } catch (error) {
      console.error("Error loading service listings:", error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (listing = null) => {
    if (listing) {
      setEditingListing(listing);
      setFormData({
        title: listing.title,
        description: listing.description,
        rate: listing.rate || { type: "hourly", amount: 0, currency: "USD" },
        skills_offered: listing.skills_offered || [],
        portfolio_links: listing.portfolio_links || [],
        availability_status: listing.availability_status || "available"
      });
    } else {
      setEditingListing(null);
      setFormData({
        title: "",
        description: "",
        rate: { type: "hourly", amount: 0, currency: "USD" },
        skills_offered: [],
        portfolio_links: [],
        availability_status: "available"
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please provide a title and description.");
      return;
    }

    setIsSaving(true);
    try {
      const listingData = {
        ...formData,
        provider_email: currentUser.email
      };

      if (editingListing) {
        await base44.entities.ServiceListing.update(editingListing.id, listingData);
        toast.success("Service listing updated successfully!");
      } else {
        await base44.entities.ServiceListing.create(listingData);
        toast.success("Service listing created successfully!");
      }

      await loadListings();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving service listing:", error);
      toast.error("Failed to save service listing.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (listingId) => {
    if (!confirm("Are you sure you want to delete this service listing?")) return;

    try {
      await base44.entities.ServiceListing.delete(listingId);
      toast.success("Service listing deleted successfully!");
      await loadListings();
    } catch (error) {
      console.error("Error deleting service listing:", error);
      toast.error("Failed to delete service listing.");
    }
  };

  const addPortfolioLink = () => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: [...prev.portfolio_links, { title: "", url: "" }]
    }));
  };

  const updatePortfolioLink = (index, field, value) => {
    setFormData(prev => {
      const newLinks = [...prev.portfolio_links];
      newLinks[index] = { ...newLinks[index], [field]: value };
      return { ...prev, portfolio_links: newLinks };
    });
  };

  const removePortfolioLink = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio_links: prev.portfolio_links.filter((_, i) => i !== index)
    }));
  };

  if (!isOwner) return null;

  return (
    <>
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
              Service Offerings
            </CardTitle>
            <Button
              size="sm"
              onClick={() => handleOpenDialog()}
              className="cu-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Loading service listings...</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-4">
              {listings.map(listing => (
                <div key={listing.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{listing.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{listing.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {listing.rate && (
                          <Badge className="bg-green-100 text-green-700">
                            <DollarSign className="w-3 h-3" />
                            ${listing.rate.amount}/{listing.rate.type === "hourly" ? "hr" : listing.rate.type}
                          </Badge>
                        )}
                        <Badge 
                          className={
                            listing.availability_status === "available" ? "bg-green-100 text-green-700" :
                            listing.availability_status === "busy" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {listing.availability_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(listing)}
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {listing.skills_offered && listing.skills_offered.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {listing.skills_offered.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                      {listing.skills_offered.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{listing.skills_offered.length - 5}</Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-3">
                Offer your services to earn income
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDialog()}
                className="text-purple-600 border-purple-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Service Listing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingListing ? "Edit" : "Create"} Service Listing</DialogTitle>
            <DialogDescription>
              Showcase your services to attract clients and collaborators
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service-title">Service Title *</Label>
              <Input
                id="service-title"
                placeholder="e.g., UI/UX Design Services, Frontend Development"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="service-description">Description *</Label>
              <Textarea
                id="service-description"
                placeholder="Describe your service offering, experience, and what makes you unique..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rate-type">Rate Type</Label>
                <Select
                  value={formData.rate.type}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    rate: { ...formData.rate, type: value }
                  })}
                >
                  <SelectTrigger id="rate-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rate-amount">Rate Amount ($)</Label>
                <Input
                  id="rate-amount"
                  type="number"
                  placeholder="0"
                  value={formData.rate.amount}
                  onChange={(e) => setFormData({
                    ...formData,
                    rate: { ...formData.rate, amount: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Availability Status</Label>
              <Select
                value={formData.availability_status}
                onValueChange={(value) => setFormData({ ...formData, availability_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Skills Offered</Label>
              <ArrayInputWithSearch
                title=""
                items={formData.skills_offered}
                onAdd={(skill) => setFormData({ ...formData, skills_offered: [...formData.skills_offered, skill] })}
                onRemove={(skill) => setFormData({ ...formData, skills_offered: formData.skills_offered.filter(s => s !== skill) })}
                placeholder="Add skills..."
                type="skills"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Portfolio Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPortfolioLink}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Link
                </Button>
              </div>
              {formData.portfolio_links.map((link, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="Link title (optional)"
                    value={link.title}
                    onChange={(e) => updatePortfolioLink(index, "title", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updatePortfolioLink(index, "url", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePortfolioLink(index)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">
              {isSaving ? "Saving..." : (editingListing ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}