import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileStack, Plus, Upload, Trash2, ExternalLink, Link as LinkIcon, Download, File, Clock, FileText, MoreVertical, Edit, User as UserIcon, User } from "lucide-react";
import { AssetVersion, ActivityLog, User as UserEntity } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

// Helper component for horizontal scrolling, assuming it's not a global UI component
const HorizontalScrollContainer = ({ children }) => {
  return (
    <div className="relative">
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
        {children}
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AssetsTab({ project, currentUser, isCollaborator, isProjectOwner, projectOwnerName }) {
  const [assets, setAssets] = useState([]); // All versions fetched from DB
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // New state for edit modal
  const [editingAsset, setEditingAsset] = useState(null); // New state for asset being edited
  const [isUploading, setIsUploading] = useState(false); // Re-introduced for upload modal
  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
  const [deletingAsset, setDeletingAsset] = useState(null); // State for asset being deleted

  const [formData, setFormData] = useState({
    asset_name: "",
    category: "",
    tags: [],
    version_notes: "",
    file: null,
    link_url: ""
  });
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("all"); // New state for category filter

  // Retry logic for rate limiting
  const withRetry = async (apiCall, maxRetries = 5, baseDelay = 1500) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const fetchAssets = useCallback(async () => {
    if (!project?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await withRetry(() => AssetVersion.filter({ project_id: project.id }));
      const sortedAssets = (Array.isArray(data) ? data : []).sort((a, b) =>
        new Date(b.created_date) - new Date(a.created_date)
      );
      setAssets(sortedAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      if (error.response?.status !== 429) {
        toast.error("Failed to load assets");
      }
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const resetForm = useCallback(() => {
    setFormData({
      asset_name: "",
      category: "",
      tags: [],
      version_notes: "",
      file: null,
      link_url: ""
    });
    setNewTag("");
    setUploadType('file');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleOpenUploadDialog = useCallback(() => {
    resetForm();
    setShowUploadModal(true);
  }, [resetForm]);

  const handleCloseUploadDialog = useCallback(() => {
    setShowUploadModal(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditDialog = useCallback(() => {
    setShowEditModal(false);
    setEditingAsset(null);
    resetForm();
  }, [resetForm]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file, asset_name: prev.asset_name || file.name }));
    }
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  }, [newTag, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  }, []);

  const handleUploadAsset = async (e) => {
    e.preventDefault();

    if (!formData.asset_name.trim()) {
      toast.error("Please provide an asset name.");
      return;
    }

    if (uploadType === 'file' && !formData.file) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (uploadType === 'link' && !formData.link_url.trim()) {
      toast.error("Please provide a link URL.");
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = formData.link_url;
      let fileName = formData.asset_name;
      let fileType = "";
      let fileSize = 0;

      if (uploadType === 'file' && formData.file) {
        const { file_url } = await UploadFile({ file: formData.file });
        fileUrl = file_url;
        fileName = formData.file.name;
        fileType = formData.file.type;
        fileSize = formData.file.size;
      } else if (uploadType === 'link') {
        fileType = 'text/uri-list';
      }

      const existingVersions = assets.filter(a => a.asset_name === formData.asset_name.trim());
      const versionNumber = existingVersions.length > 0
        ? Math.max(...existingVersions.map(a => a.version_number)) + 1
        : 1;

      const newAsset = await AssetVersion.create({
        project_id: project.id,
        asset_name: formData.asset_name.trim(),
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        version_number: versionNumber,
        version_notes: formData.version_notes.trim() || (uploadType === 'file' ? 'Initial file upload' : 'Link added'),
        uploaded_by: currentUser.email,
        is_current: true,
        category: formData.category || "Uncategorized",
        tags: formData.tags || [],
        resource_type: uploadType
      });

      if (existingVersions.length > 0) {
        await Promise.all(
          existingVersions
            .filter(v => v.is_current && v.asset_name === formData.asset_name.trim())
            .map(v => AssetVersion.update(v.id, { is_current: false }))
        );
      }

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'asset_uploaded',
        action_description: `uploaded ${uploadType === 'file' ? 'a new file' : 'a new link'}: ${formData.asset_name} (v${newAsset.version_number})`,
        entity_type: 'asset',
        entity_id: newAsset.id,
        metadata: { category: formData.category, resource_type: uploadType, asset_name: formData.asset_name, version_number: newAsset.version_number }
      });

      handleCloseUploadDialog();
      fetchAssets();

    } catch (error) {
      console.error("Error uploading asset:", error);
      toast.error("Failed to upload asset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditAsset = useCallback((asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_name: asset.asset_name,
      category: asset.category || "",
      tags: asset.tags || [],
      version_notes: asset.version_notes || "",
      file: null,
      link_url: asset.file_url
    });
    setShowEditModal(true);
  }, []);

  const handleUpdateAsset = async (e) => {
    e.preventDefault();

    if (!formData.asset_name.trim()) {
      toast.error("Please provide an asset name.");
      return;
    }
    if (!editingAsset) {
      toast.error("No asset selected for editing.");
      return;
    }

    try {
      await AssetVersion.update(editingAsset.id, {
        asset_name: formData.asset_name.trim(),
        category: formData.category || "Uncategorized",
        tags: formData.tags || [],
        version_notes: formData.version_notes.trim() || editingAsset.version_notes
      });

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'asset_updated',
        action_description: `updated asset details: ${formData.asset_name} (v${editingAsset.version_number})`,
        entity_type: 'asset',
        entity_id: editingAsset.id,
        metadata: { asset_name: formData.asset_name, category: formData.category, tags: formData.tags, version_number: editingAsset.version_number }
      });

      handleCloseEditDialog();
      fetchAssets();

    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error("Failed to update asset.");
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;

    try {
      await AssetVersion.delete(deletingAsset.id);

      await ActivityLog.create({
        project_id: project.id,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        action_type: 'asset_deleted',
        action_description: `deleted asset: ${deletingAsset.asset_name} (v${deletingAsset.version_number})`,
        entity_type: 'asset',
        entity_id: deletingAsset.id,
        metadata: { asset_name: deletingAsset.asset_name, version_number: deletingAsset.version_number }
      });

      setDeletingAsset(null); // Close the dialog
      fetchAssets();

    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset.");
    }
  };

  const categories = [...new Set(assets.map(asset => asset.category || "Uncategorized"))].filter(Boolean).sort();

  const filteredAssets = assets.filter(asset =>
    selectedCategory === "all" || (asset.category || "Uncategorized") === selectedCategory
  );

  if (!project) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Project not found</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6 text-center">
          <FileStack className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Sign In to View Assets</h3>
          <p className="text-gray-600 mb-4">Please sign in to view project assets.</p>
          <Button onClick={() => UserEntity.login()} className="cu-button">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading assets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isCollaborator) {
    return (
      <Card className="cu-card">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <FileStack className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Read-Only Access</h3>
            <p className="text-gray-600 mb-4">
              You're viewing this project's assets. Join the project to contribute and manage assets.
            </p>
          </div>

          {/* Read-only assets display */}
          {assets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No assets have been uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map(asset => {
                const isFile = asset.resource_type === 'file';
                return (
                  <Card key={asset.id} className="cu-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {asset.resource_type === 'link' ? (
                            <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <File className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{asset.asset_name}</h4>
                            {asset.version_notes && (
                              <p className="text-sm text-gray-600 mt-1">{asset.version_notes}</p>
                            )}
                            {asset.category && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {asset.category}
                              </Badge>
                            )}
                            {asset.version_number && (
                              <Badge variant="secondary" className="mt-2 text-xs ml-2">
                                v{asset.version_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <a
                          href={asset.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 flex-shrink-0"
                        >
                          {isFile ? (
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              <span>Download</span>
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              <span>View</span>
                            </Button>
                          )}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="cu-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <FileStack className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600" />
            Project Assets
          </CardTitle>
          {isCollaborator && (
            <Button onClick={handleOpenUploadDialog} className="cu-button w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Category Filter */}
          <div className="mb-6">
            <HorizontalScrollContainer>
              <div className="flex space-x-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className={`whitespace-nowrap ${selectedCategory === "all" ? "bg-purple-600 text-white" : ""}`}
                >
                  All ({assets.length})
                </Button>
                {categories.map((cat) => {
                  const count = assets.filter(a => (a.category || "Uncategorized") === cat).length;
                  return (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap ${selectedCategory === cat ? "bg-purple-600 text-white" : ""}`}
                    >
                      {cat} ({count})
                    </Button>
                  );
                })}
              </div>
            </HorizontalScrollContainer>
          </div>

          {/* Assets List */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <FileStack className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">
                {selectedCategory === "all" ? "No assets uploaded yet" : `No assets in "${selectedCategory}" category.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <AnimatePresence>
                {filteredAssets.map((asset) => {
                  const isFile = asset.resource_type === 'file';
                  const Icon = isFile ? FileText : ExternalLink;

                  return (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="cu-card hover:shadow-md transition-shadow">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col space-y-3">
                            {/* Header Row - Icon and Title */}
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900 break-words leading-tight">
                                  {asset.asset_name}
                                  {asset.is_current && (
                                    <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                                      Current
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 break-all mt-0.5">
                                  {asset.file_name}
                                </p>
                              </div>
                            </div>

                            {/* Badges Row */}
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {asset.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {asset.category}
                                </Badge>
                              )}
                              {asset.resource_type && (
                                <Badge variant="outline" className="text-xs">
                                  {asset.resource_type === 'file' ? 'File' : 'Link'} Asset
                                </Badge>
                              )}
                              {asset.tags && asset.tags.length > 0 && asset.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Version Notes */}
                            {asset.version_notes && (
                              <p className="text-xs sm:text-sm text-gray-600 break-words leading-relaxed">
                                {asset.version_notes}
                              </p>
                            )}

                            {/* Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pt-2 border-t border-gray-100">
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                {asset.file_size && isFile && (
                                  <div className="flex items-center">
                                    <File className="w-3 h-3 mr-1" />
                                    <span>{formatFileSize(asset.file_size)}</span>
                                  </div>
                                )}
                                 <div className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    <span>{asset.uploaded_by?.split('@')[0]}</span>
                                  </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>{formatDistanceToNow(new Date(asset.created_date), { addSuffix: true })}</span>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              {isCollaborator && (
                                <div className="flex items-center space-x-2 justify-end">
                                  {isFile ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                        onClick={() => window.open(asset.file_url, '_blank')}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        <span>Download</span>
                                    </Button>
                                  ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 sm:flex-none"
                                        onClick={() => window.open(asset.file_url, '_blank')}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        <span>View</span>
                                    </Button>
                                  )}
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit Details</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => setDeletingAsset(asset)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete Asset</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadAsset} className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={uploadType === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadType('file')}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={uploadType === 'link' ? 'default' : 'outline'}
                onClick={() => setUploadType('link')}
                className="flex-1"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Add Link
              </Button>
            </div>

            {uploadType === 'file' ? (
              <div>
                <label className="block text-sm font-medium mb-1">Select File *</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  required
                  className="file:cu-button"
                />
                {formData.file && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {formData.file.name}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Link URL *</label>
                <Input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="https://example.com/resource"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Asset Name *</label>
              <Input
                value={formData.asset_name}
                onChange={(e) => setFormData(prev => ({ ...prev, asset_name: e.target.value }))}
                placeholder="e.g., Project Logo, Design Mockup"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Version Notes</label>
              <Textarea
                value={formData.version_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, version_notes: e.target.value }))}
                placeholder="What's new about this asset?"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uncategorized">None</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                  <SelectItem value="Code">Code</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseUploadDialog} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="cu-button">
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateAsset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Asset Name *</label>
              <Input
                value={formData.asset_name}
                onChange={(e) => setFormData(prev => ({ ...prev, asset_name: e.target.value }))}
                placeholder="e.g., Project Logo, Design Mockup"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Version Notes</label>
              <Textarea
                value={formData.version_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, version_notes: e.target.value }))}
                placeholder="Update notes for this asset"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Uncategorized">None</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                  <SelectItem value="Code">Code</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
                Cancel
              </Button>
              <Button type="submit" className="cu-button">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAsset} onOpenChange={() => setDeletingAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to delete the asset "<span className="font-semibold">{deletingAsset?.asset_name}</span>" (Version {deletingAsset?.version_number})? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAsset(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAsset}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}