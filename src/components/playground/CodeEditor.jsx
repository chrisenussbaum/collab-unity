import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Code, 
  Play, 
  Save, 
  Share2, 
  Plus, 
  X, 
  File, 
  Eye,
  Trash2,
  FolderPlus,
  Download,
  Upload,
  Loader2,
  RefreshCw,
  Folder,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion } from '@codemirror/autocomplete';

export default function CodeEditor({ currentUser, onBack }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareTags, setShareTags] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [currentFolderForUpload, setCurrentFolderForUpload] = useState('');
  const [previewHeight, setPreviewHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [currentUser]);

  // Auto-preview on file content change
  useEffect(() => {
    if (currentProject && selectedFile) {
      const timer = setTimeout(() => {
        runCode();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedFile?.content, currentProject?.files]);

  // Auto-save periodically when editing
  useEffect(() => {
    if (!currentProject?.id) return; // Only auto-save existing projects
    
    const autoSaveTimer = setTimeout(() => {
      saveProject(false); // Silent auto-save
    }, 5000); // Auto-save every 5 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer);
  }, [currentProject]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      const minHeight = 200;
      const maxHeight = containerRect.height - 200;
      setPreviewHeight(Math.max(minHeight, Math.min(maxHeight, newHeight)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const loadProjects = async () => {
    try {
      const userProjects = await base44.entities.CodeProject.filter({
        created_by: currentUser.email
      }, '-updated_date');
      setProjects(userProjects || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const newProjectData = {
      title: newProjectName.trim(),
      description: newProjectDescription.trim(),
      files: [
        { name: 'index.html', path: 'index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <script src="script.js"></script>\n</body>\n</html>', language: 'html' },
        { name: 'style.css', path: 'style.css', content: 'body {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\nh1 {\n  font-size: 3rem;\n  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n}', language: 'css' },
        { name: 'script.js', path: 'script.js', content: '// Your JavaScript code here\nconsole.log("Hello from Code Editor!");', language: 'javascript' }
      ],
      folders: [],
      is_public: false
    };

    try {
      // Save immediately to database
      const savedProject = await base44.entities.CodeProject.create(newProjectData);
      
      setCurrentProject(savedProject);
      setSelectedFile(savedProject.files[0]);
      setShowNewProjectDialog(false);
      setNewProjectName("");
      setNewProjectDescription("");
      
      // Auto-run code for new project
      setTimeout(() => runCode(), 100);
      toast.success("Project created and saved!");
      
      // Reload projects list
      await loadProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const addNewFile = async (folderPath = '') => {
    const fileName = prompt(`Enter file name ${folderPath ? `in ${folderPath}/` : ''}(e.g., main.js, styles.css):`);
    if (!fileName) return;

    const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const extension = fileName.split('.').pop().toLowerCase();

    let language = 'javascript';
    let defaultContent = '';

    if (extension === 'html' || extension === 'htm') {
      language = 'html';
      defaultContent = '<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>';
    } else if (extension === 'css') {
      language = 'css';
      defaultContent = '/* Your CSS styles here */\n';
    } else {
      language = 'javascript';
      defaultContent = '// Your JavaScript code here\n';
    }

    const newFile = {
      name: fileName,
      path: fullPath,
      content: defaultContent,
      language
    };

    setCurrentProject(prev => ({
      ...prev,
      files: [...prev.files, newFile]
    }));
    setSelectedFile(newFile);
    
    // Auto-save after adding file
    if (currentProject?.id) {
      await saveProject(false);
    }
    
    toast.success(`${fileName} added!`);
  };

  const uploadImageFile = (folderPath = '') => {
    setCurrentFolderForUpload(folderPath);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const fileName = file.name;
      const fullPath = currentFolderForUpload ? `${currentFolderForUpload}/${fileName}` : fileName;
      
      const newFile = {
        name: fileName,
        path: fullPath,
        content: file_url,
        language: 'image'
      };

      setCurrentProject(prev => ({
        ...prev,
        files: [...prev.files, newFile]
      }));
      setSelectedFile(newFile);
      toast.success(`${fileName} uploaded!`);
      setCurrentFolderForUpload('');
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const addNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    const folderPath = newFolderName.trim();
    
    if (currentProject.folders?.includes(folderPath)) {
      toast.error("Folder already exists");
      return;
    }

    setCurrentProject(prev => ({
      ...prev,
      folders: [...(prev.folders || []), folderPath]
    }));
    setExpandedFolders(prev => ({ ...prev, [folderPath]: true }));
    setShowNewFolderDialog(false);
    setNewFolderName("");
    
    // Auto-save after adding folder
    if (currentProject?.id) {
      await saveProject(false);
    }
    
    toast.success(`Folder "${folderPath}" created!`);
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const getFilesByFolder = () => {
    const result = { root: [], folders: {} };
    
    currentProject.files.forEach(file => {
      const filePath = file.path || file.name;
      const parts = filePath.split('/');
      
      if (parts.length === 1) {
        result.root.push(file);
      } else {
        const folder = parts[0];
        if (!result.folders[folder]) {
          result.folders[folder] = [];
        }
        result.folders[folder].push(file);
      }
    });
    
    return result;
  };

  const deleteFile = (filePath) => {
    if (currentProject.files.length === 1) {
      toast.error("Cannot delete the last file");
      return;
    }

    const file = currentProject.files.find(f => (f.path || f.name) === filePath);
    if (!confirm(`Delete ${file.name}?`)) return;

    const updatedFiles = currentProject.files.filter(f => (f.path || f.name) !== filePath);
    setCurrentProject(prev => ({ ...prev, files: updatedFiles }));
    
    if ((selectedFile?.path || selectedFile?.name) === filePath) {
      setSelectedFile(updatedFiles[0]);
    }
    
    toast.success(`${file.name} deleted`);
  };

  const updateFileContent = (content) => {
    const selectedPath = selectedFile.path || selectedFile.name;
    setCurrentProject(prev => ({
      ...prev,
      files: prev.files.map(f => 
        (f.path || f.name) === selectedPath ? { ...f, content } : f
      )
    }));
    setSelectedFile(prev => ({ ...prev, content }));
  };

  const getLanguageExtension = (language) => {
    switch (language) {
      case 'html':
        return html();
      case 'css':
        return css();
      case 'javascript':
        return javascript();
      default:
        return javascript();
    }
  };

  const runCode = () => {
    if (!currentProject) return;
    
    setIsRunning(true);
    
    const htmlFile = currentProject.files.find(f => f.language === 'html');
    const cssFile = currentProject.files.find(f => f.language === 'css');
    const jsFile = currentProject.files.find(f => f.language === 'javascript');

    let htmlContent = htmlFile?.content || '';
    
    // Inject CSS
    if (cssFile) {
      const cssTag = `<style>${cssFile.content}</style>`;
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${cssTag}</head>`);
      } else {
        htmlContent = `${cssTag}${htmlContent}`;
      }
    }

    // Inject JS
    if (jsFile) {
      const jsTag = `<script>${jsFile.content}</script>`;
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${jsTag}</body>`);
      } else {
        htmlContent = `${htmlContent}${jsTag}`;
      }
    }

    setPreviewContent(htmlContent);
    setTimeout(() => setIsRunning(false), 500);
  };

  const saveProject = async (showToast = true) => {
    if (!currentUser) {
      toast.error("Please sign in to save projects");
      return false;
    }

    setIsSaving(true);
    try {
      const projectData = {
        title: currentProject.title,
        description: currentProject.description,
        files: currentProject.files,
        folders: currentProject.folders || [],
        tags: currentProject.tags || []
      };

      if (currentProject.id) {
        await base44.entities.CodeProject.update(currentProject.id, projectData);
        if (showToast) toast.success("Project saved!");
      } else {
        const saved = await base44.entities.CodeProject.create({
          ...projectData,
          is_public: false
        });
        setCurrentProject({ ...currentProject, id: saved.id });
        if (showToast) toast.success("Project saved!");
      }
      await loadProjects();
      return true;
    } catch (error) {
      console.error("Error saving project:", error);
      if (showToast) toast.error("Failed to save project");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProjectDetails = async () => {
    if (!editProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setCurrentProject(prev => ({
      ...prev,
      title: editProjectName.trim(),
      description: editProjectDescription.trim()
    }));

    setShowEditProjectDialog(false);
    
    if (currentProject.id) {
      await saveProject(false);
      toast.success("Project details updated!");
    }
  };

  const handleBackToProjects = async () => {
    // Auto-save before going back
    if (currentProject) {
      await saveProject(false);
    }
    setCurrentProject(null);
    setSelectedFile(null);
  };

  const capturePreview = async () => {
    if (!iframeRef.current) return null;
    
    try {
      const canvas = await html2canvas(iframeRef.current);
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error("Error capturing preview:", error);
      return null;
    }
  };

  const shareToFeed = async () => {
    if (!shareTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    try {
      // Capture preview
      const thumbnailData = await capturePreview();
      let thumbnailUrl = null;

      if (thumbnailData) {
        const blob = await (await fetch(thumbnailData)).blob();
        const file = new File([blob], 'preview.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        thumbnailUrl = file_url;
      }

      // Save or update project
      let projectId = currentProject.id;
      if (!projectId) {
        const saved = await base44.entities.CodeProject.create({
          title: currentProject.title || shareTitle.trim(),
          description: currentProject.description || shareDescription.trim(),
          files: currentProject.files,
          is_public: true,
          thumbnail_url: thumbnailUrl,
          tags: shareTags.split(',').map(t => t.trim()).filter(Boolean),
          shared_to_feed: true
        });
        projectId = saved.id;
        setCurrentProject({ ...currentProject, id: saved.id });
      } else {
        await base44.entities.CodeProject.update(projectId, {
          is_public: true,
          thumbnail_url: thumbnailUrl,
          tags: shareTags.split(',').map(t => t.trim()).filter(Boolean),
          shared_to_feed: true
        });
      }

      // Create feed post
      await base44.entities.FeedPost.create({
        post_type: 'narrative',
        title: shareTitle.trim(),
        content: shareDescription.trim() || 'Check out my code project!',
        media_attachments: thumbnailUrl ? [{
          media_url: thumbnailUrl,
          media_type: 'image'
        }] : [],
        tags: ['code', 'playground', ...shareTags.split(',').map(t => t.trim()).filter(Boolean)]
      });

      toast.success("Shared to Feed!");
      setShowShareDialog(false);
      setShareTitle("");
      setShareDescription("");
      setShareTags("");
      await loadProjects();
    } catch (error) {
      console.error("Error sharing to feed:", error);
      toast.error("Failed to share project");
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = (project) => {
    // Ensure all files have a path property
    const updatedFiles = project.files.map(file => ({
      ...file,
      path: file.path || file.name
    }));

    const updatedProject = {
      ...project,
      files: updatedFiles,
      folders: project.folders || []
    };

    setCurrentProject(updatedProject);
    setSelectedFile(updatedFiles[0]);
    
    // Auto-run preview
    setTimeout(() => runCode(), 100);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
        <Card className="cu-card bg-gray-800 border-gray-700 max-w-md">
          <CardContent className="p-8 text-center">
            <Code className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-gray-400 mb-4">
              Please sign in to use the Code Editor
            </p>
            <Button onClick={() => base44.auth.redirectToLogin()} className="cu-button">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="cu-container cu-page">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 mb-4"
                onClick={onBack}
              >
                ← Back
              </Button>
              <h1 className="text-3xl font-bold">Code Editor</h1>
              <p className="text-gray-400">Your saved projects</p>
            </div>
            <Button onClick={() => setShowNewProjectDialog(true)} className="cu-button">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="cu-card bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Code className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
                <p className="text-gray-400 mb-4">Create your first code project</p>
                <Button onClick={() => setShowNewProjectDialog(true)} className="cu-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="cu-card bg-gray-800 border-gray-700 hover:border-purple-500 cursor-pointer"
                    onClick={() => loadProject(project)}
                  >
                    {project.thumbnail_url && (
                      <img 
                        src={project.thumbnail_url} 
                        alt={project.title}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                    )}
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold mb-2">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{project.files?.length || 0} files</span>
                        {project.shared_to_feed && (
                          <Badge className="bg-purple-600 text-white">
                            <Share2 className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new code project with HTML, CSS, and JavaScript
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project Name *</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="What does your project do?"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewProject} className="cu-button">
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToProjects}
            className="text-gray-400 hover:text-white"
          >
            ← Projects
          </Button>
          <div 
            className="cursor-pointer hover:bg-gray-700/50 px-2 py-1 rounded transition-colors"
            onClick={() => {
              setEditProjectName(currentProject.title);
              setEditProjectDescription(currentProject.description || "");
              setShowEditProjectDialog(true);
            }}
          >
            <h2 className="font-bold">{currentProject.title}</h2>
            {currentProject.description && (
              <p className="text-xs text-gray-400">{currentProject.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={runCode}
            disabled={isRunning}
            className="text-green-400 hover:text-green-300"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Run
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveProject(true)}
            disabled={isSaving}
            className="text-blue-400 hover:text-blue-300"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="text-purple-400 hover:text-purple-300"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* File Explorer */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center justify-between">
            <span className="font-semibold text-sm">Files</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewFolderDialog(true)}
                className="h-6 w-6 p-0"
                title="New Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => uploadImageFile('')}
                className="h-6 w-6 p-0"
                title="Upload Image"
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addNewFile()}
                className="h-6 w-6 p-0"
                title="New File"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {(() => {
              const fileStructure = getFilesByFolder();
              const selectedPath = selectedFile?.path || selectedFile?.name;
              
              return (
                <>
                  {/* Root level files */}
                  {fileStructure.root.map((file) => {
                    const filePath = file.path || file.name;
                    return (
                      <div
                        key={filePath}
                        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors group ${
                          selectedPath === filePath
                            ? 'bg-purple-600'
                            : 'hover:bg-gray-700'
                        }`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        {currentProject.files.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(filePath);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Folders */}
                  {currentProject.folders?.map((folderPath) => (
                    <div key={folderPath}>
                      <div
                        className="flex items-center justify-between px-2 py-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => toggleFolder(folderPath)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {expandedFolders[folderPath] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <Folder className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm">{folderPath}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              uploadImageFile(folderPath);
                            }}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                            title="Upload image"
                          >
                            <Upload className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addNewFile(folderPath);
                            }}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                            title="Add file to folder"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedFolders[folderPath] && fileStructure.folders[folderPath]?.map((file) => {
                        const filePath = file.path || file.name;
                        return (
                          <div
                            key={filePath}
                            className={`flex items-center justify-between pl-8 pr-3 py-2 rounded cursor-pointer transition-colors group ${
                              selectedPath === filePath
                                ? 'bg-purple-600'
                                : 'hover:bg-gray-700'
                            }`}
                            onClick={() => setSelectedFile(file)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(filePath);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{selectedFile?.name}</span>
          </div>
          {selectedFile?.language === 'image' ? (
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
              <img 
                src={selectedFile.content} 
                alt={selectedFile.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <CodeMirror
              value={selectedFile?.content || ''}
              height="100%"
              extensions={[
                getLanguageExtension(selectedFile?.language),
                autocompletion()
              ]}
              onChange={(value) => updateFileContent(value)}
              theme="dark"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                searchKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
              className="flex-1 text-sm"
              style={{ 
                height: '100%',
                fontSize: '14px',
                fontFamily: 'Monaco, Consolas, monospace'
              }}
            />
          )}
        </div>
        </div>

        {/* Resizable Handle */}
        <div
          className="h-1 bg-gray-700 hover:bg-purple-600 cursor-ns-resize transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Preview */}
        <div 
          className="flex flex-col border-t border-gray-700 bg-gray-900"
          style={{ height: `${previewHeight}px` }}
        >
          <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Preview</span>
            
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className={`h-7 px-2 text-xs ${previewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
              >
                Desktop
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className={`h-7 px-2 text-xs ${previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
              >
                Tablet
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className={`h-7 px-2 text-xs ${previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
              >
                Mobile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={runCode}
                className="h-7 px-2 text-xs ml-2"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <div 
              className={`bg-white shadow-2xl transition-all my-4 ${
                previewMode === 'desktop' 
                  ? 'w-full mx-4' 
                  : previewMode === 'tablet'
                  ? 'w-[768px]'
                  : 'w-[375px]'
              }`}
              style={{ 
                height: previewMode === 'desktop' ? 'calc(100% - 2rem)' : '100%',
                maxHeight: previewMode === 'tablet' ? '1024px' : previewMode === 'mobile' ? '667px' : 'none'
              }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={previewContent}
                className="w-full h-full"
                title="preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your files with folders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name *</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., src, components, styles"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addNewFolder} className="cu-button">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
            <DialogDescription>
              Update your project name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name *</Label>
              <Input
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
                placeholder="What does your project do?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateProjectDetails} className="cu-button">
              Update Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Feed</DialogTitle>
            <DialogDescription>
              Share your code project with the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="My Amazing Project"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                placeholder="What makes your project special?"
                rows={3}
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={shareTags}
                onChange={(e) => setShareTags(e.target.value)}
                placeholder="javascript, css, animation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={shareToFeed} disabled={isSaving} className="cu-button">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share to Feed
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}