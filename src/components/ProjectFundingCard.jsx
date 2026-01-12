import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, ExternalLink, Edit2, CreditCard, Zap } from 'lucide-react';
import { toast } from "sonner";
import { Project } from "@/entities/all";
import StripeCheckout from './StripeCheckout';

const FUNDING_PLATFORMS = {
  paypal: {
    name: 'PayPal',
    baseUrl: 'https://paypal.me/',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg',
    color: 'text-blue-600'
  },
  venmo: {
    name: 'Venmo',
    baseUrl: 'https://venmo.com/',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Venmo_logo.svg',
    color: 'text-blue-500'
  },
  cashapp: {
    name: 'CashApp',
    baseUrl: 'https://cash.app/$',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Square_Cash_app_logo.svg',
    color: 'text-green-600'
  }
};

const ProjectFundingCard = ({ project, projectOwner, canEdit = false, onUpdate }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFundingDialog, setShowFundingDialog] = useState(false);
  
  const [editedFunding, setEditedFunding] = useState({
    paypal_link: project?.paypal_link || '',
    venmo_link: project?.venmo_link || '',
    cashapp_link: project?.cashapp_link || ''
  });

  // Check if the project has any funding links
  const activeFundingLinks = Object.entries(FUNDING_PLATFORMS).filter(([key]) => {
    const linkKey = `${key}_link`;
    return project?.[linkKey];
  });

  const hasFundingLinks = activeFundingLinks.length > 0;

  const handleEdit = () => {
    setEditedFunding({
      paypal_link: project?.paypal_link || '',
      venmo_link: project?.venmo_link || '',
      cashapp_link: project?.cashapp_link || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Project.update(project.id, {
        paypal_link: editedFunding.paypal_link.trim() || null,
        venmo_link: editedFunding.venmo_link.trim() || null,
        cashapp_link: editedFunding.cashapp_link.trim() || null
      });
      
      toast.success("Funding links updated successfully!");
      setIsEditDialogOpen(false);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating funding links:", error);
      toast.error("Failed to update funding links. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedFunding(prev => ({ ...prev, [field]: value }));
  };

  const getFullUrl = (platform, username) => {
    if (!username) return null;
    return `${FUNDING_PLATFORMS[platform].baseUrl}${username}`;
  };

  // If no funding links and user can't edit, don't render anything
  if (!hasFundingLinks && !canEdit) {
    return null;
  }

  return (
    <>
      <Card className="cu-card">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Project Funding
            </CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8"
              >
                <Edit2 className="w-4 h-4 text-purple-600" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {!canEdit && (
            <Button
              onClick={() => setShowFundingDialog(true)}
              className="w-full mb-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Fund This Project
            </Button>
          )}

          {hasFundingLinks ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Alternative Payment Methods</p>
              {activeFundingLinks.map(([key, platform]) => {
                const linkKey = `${key}_link`;
                const username = project[linkKey];
                const fullUrl = getFullUrl(key, username);
                
                return (
                  <a
                    key={key}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={platform.icon} 
                        alt={platform.name} 
                        className="w-5 h-5"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <CreditCard className={`w-5 h-5 ${platform.color} hidden`} />
                      <span className={`font-medium text-sm ${platform.color}`}>
                        {platform.name}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </a>
                );
              })}
            </div>
          ) : canEdit ? (
            <p className="text-sm text-gray-500 text-center py-2">
              No funding links added yet
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project Funding</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Add your usernames for payment platforms. Leave fields empty to remove them.
            </p>
            
            {Object.entries(FUNDING_PLATFORMS).map(([key, platform]) => {
              const linkKey = `${key}_link`;
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={linkKey} className="text-sm font-medium flex items-center">
                    <img 
                      src={platform.icon} 
                      alt={platform.name} 
                      className="w-4 h-4 mr-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline-block';
                      }}
                    />
                    <CreditCard className={`w-4 h-4 mr-2 ${platform.color} hidden`} />
                    {platform.name}
                  </Label>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                      {platform.baseUrl}
                    </span>
                    <Input
                      id={linkKey}
                      placeholder="username"
                      value={editedFunding[linkKey]}
                      onChange={(e) => handleInputChange(linkKey, e.target.value)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="cu-button"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stripe Funding Dialog */}
      <Dialog open={showFundingDialog} onOpenChange={setShowFundingDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Fund "{project?.title}"
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="stripe" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Card Payment
              </TabsTrigger>
              <TabsTrigger value="external" className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Other Methods
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stripe" className="mt-4">
              <StripeCheckout
                projectId={project?.id}
                projectTitle={project?.title}
                onSuccess={() => {
                  setShowFundingDialog(false);
                  if (onUpdate) onUpdate();
                }}
                onCancel={() => setShowFundingDialog(false)}
              />
            </TabsContent>

            <TabsContent value="external" className="mt-4">
              {hasFundingLinks ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Support this project through these payment platforms:
                  </p>
                  {activeFundingLinks.map(([key, platform]) => {
                    const linkKey = `${key}_link`;
                    const username = project[linkKey];
                    const fullUrl = getFullUrl(key, username);
                    
                    return (
                      <a
                        key={key}
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <img 
                            src={platform.icon} 
                            alt={platform.name} 
                            className="w-6 h-6"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <CreditCard className={`w-6 h-6 ${platform.color} hidden`} />
                          <div>
                            <span className={`font-medium ${platform.color} block`}>
                              {platform.name}
                            </span>
                            <span className="text-xs text-gray-500">@{username}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">
                    No alternative payment methods available for this project.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Use the Card Payment tab to fund via Stripe.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectFundingCard;