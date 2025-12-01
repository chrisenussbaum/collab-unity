import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, ArrowLeft, Monitor, Smartphone, Upload, X, FileText, Image as ImageIcon, Video, Plus, FileCode, ChevronLeft, ChevronRight, Columns2, Rows2, Wand2 } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import CodePlaygroundPresence, { getUserColor } from './CodePlaygroundPresence';
import MonacoEditor from './MonacoEditor';
import { getPublicUserProfiles } from "@/functions/getPublicUserProfiles";

const LANGUAGE_OPTIONS = [
  { value: 'html', label: 'HTML', color: 'orange', ext: 'html', defaultCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>' },
  { value: 'css', label: 'CSS', color: 'blue', ext: 'css', defaultCode: 'body {\n  font-family: Arial, sans-serif;\n  padding: 20px;\n  background: #f5f5f5;\n}' },
  { value: 'javascript', label: 'JavaScript', color: 'yellow', ext: 'js', defaultCode: '// JavaScript code\nconsole.log("Hello World!");' },
  { value: 'typescript', label: 'TypeScript', color: 'blue', ext: 'ts', defaultCode: '// TypeScript code\nconst message: string = "Hello World!";\nconsole.log(message);' },
  { value: 'jsx', label: 'React (JSX)', color: 'cyan', ext: 'jsx', defaultCode: 'import React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World!</h1>\n    </div>\n  );\n}\n\nexport default App;' },
  { value: 'tsx', label: 'React TypeScript (TSX)', color: 'cyan', ext: 'tsx', defaultCode: 'import React from "react";\n\ninterface Props {\n  title?: string;\n}\n\nconst App: React.FC<Props> = ({ title = "Hello World!" }) => {\n  return (\n    <div>\n      <h1>{title}</h1>\n    </div>\n  );\n};\n\nexport default App;' },
  { value: 'python', label: 'Python', color: 'green', ext: 'py', defaultCode: '# Python code\nprint("Hello World!")' },
  { value: 'java', label: 'Java', color: 'red', ext: 'java', defaultCode: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World!");\n  }\n}' },
];

export default function CodePlayground({ 
  codeProject, 
  project, 
  currentUser,
  onClose,
  onSave,
  isReadOnly = false
}) {
  const [title, setTitle] = useState(codeProject?.title || '');
  const [files, setFiles] = useState([]);
  const [activeFiles, setActiveFiles] = useState([]);
  const [activeHtmlFile, setActiveHtmlFile] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('html');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(codeProject?.updated_date || null);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [layout, setLayout] = useState('horizontal');
  const [isFilesSidebarCollapsed, setIsFilesSidebarCollapsed] = useState(false);
  // Collaboration state
  const [collaborators, setCollaborators] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  const iframeRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const updateTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (codeProject?.content) {
      try {
        const parsed = JSON.parse(codeProject.content);
        if (parsed.files && Array.isArray(parsed.files)) {
          setFiles(parsed.files);
          const firstHtml = parsed.files.find(f => f.type === 'code' && f.language === 'html');
          if (firstHtml) {
            setActiveFiles([firstHtml]);
            setActiveHtmlFile(firstHtml);
          }
        }

      } catch (error) {
        console.error("Error parsing saved code:", error);
        initializeDefaultFiles();
      }
    } else {
      initializeDefaultFiles();
    }
  }, [codeProject]);

  // Initialize collaborators from project
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!project?.collaborator_emails || project.collaborator_emails.length === 0) return;
      
      try {
        const { data: profiles } = await getPublicUserProfiles({ 
          emails: project.collaborator_emails 
        });
        
        const collabsWithStatus = (profiles || []).map(profile => ({
          ...profile,
          isOnline: profile.email === currentUser?.email, // Only current user is initially online
          activeFile: null
        }));
        
        setCollaborators(collabsWithStatus);
      } catch (error) {
        console.error("Error loading collaborators:", error);
      }
    };
    
    loadCollaborators();
  }, [project?.collaborator_emails, currentUser?.email]);

  // Polling for real-time updates (simulated - in production use WebSocket)
  useEffect(() => {
    if (!codeProject?.id || isReadOnly) return;

    const pollForUpdates = async () => {
      try {
        const latestProject = await base44.entities.ProjectIDE.filter({ id: codeProject.id });
        if (latestProject && latestProject.length > 0) {
          const latest = latestProject[0];
          
          // Check if someone else updated the content
          if (latest.last_modified_by !== currentUser?.email && 
              latest.updated_date !== lastSaved) {
            try {
              const parsed = JSON.parse(latest.content);
              
              // Merge remote changes - simple last-write-wins for now
              // In production, use operational transformation or CRDT
              if (parsed.files) {
                // Only update if we don't have unsaved changes
                if (!hasUnsavedChanges) {
                  setFiles(parsed.files);
                }
              }
              
              
              // Update collaborator presence
              if (parsed.presence) {
                setCollaborators(prev => prev.map(collab => ({
                  ...collab,
                  isOnline: parsed.presence.some(p => p.email === collab.email),
                  activeFile: parsed.presence.find(p => p.email === collab.email)?.activeFile
                })));
                
                // Update remote cursors
                setRemoteCursors(parsed.presence
                  .filter(p => p.email !== currentUser?.email && p.cursor)
                  .map(p => ({
                    email: p.email,
                    name: collaborators.find(c => c.email === p.email)?.full_name,
                    ...p.cursor
                  }))
                );
              }
            } catch (e) {
              console.error("Error parsing remote content:", e);
            }
          }
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollForUpdates, 3000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [codeProject?.id, currentUser?.email, isReadOnly, lastSaved, hasUnsavedChanges]);

  // Broadcast presence when active file changes
  useEffect(() => {
    if (!codeProject?.id || isReadOnly) return;
    
    broadcastPresence();
  }, [activeFiles, codeProject?.id]);

  const broadcastPresence = async () => {
    if (!codeProject?.id || isReadOnly) return;
    
    try {
      const currentContent = codeProject.content ? JSON.parse(codeProject.content) : {};
      const presence = currentContent.presence || [];
      
      // Update or add current user's presence
      const myPresence = {
        email: currentUser?.email,
        activeFile: activeFiles[0]?.name,
        lastSeen: new Date().toISOString(),
        cursor: null // Will be updated on cursor move
      };
      
      const updatedPresence = [
        ...presence.filter(p => p.email !== currentUser?.email),
        myPresence
      ].filter(p => {
        // Remove stale presence (> 30 seconds old)
        const lastSeen = new Date(p.lastSeen);
        return (Date.now() - lastSeen.getTime()) < 30000;
      });
      
      // Save presence without triggering full save
      const updatedContent = JSON.stringify({
        ...currentContent,
        files,
        presence: updatedPresence
      });
      
      await base44.entities.ProjectIDE.update(codeProject.id, {
        content: updatedContent,
        last_modified_by: currentUser.email
      });
    } catch (error) {
      console.error("Error broadcasting presence:", error);
    }
  };

  const handleCursorChange = useCallback((cursorData) => {
    if (!codeProject?.id || isReadOnly) return;
    
    // Debounced cursor update
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    updateTimerRef.current = setTimeout(async () => {
      try {
        const currentContent = codeProject.content ? JSON.parse(codeProject.content) : {};
        const presence = currentContent.presence || [];
        
        const updatedPresence = presence.map(p => 
          p.email === currentUser?.email 
            ? { ...p, cursor: cursorData, lastSeen: new Date().toISOString() }
            : p
        );
        
        if (!updatedPresence.some(p => p.email === currentUser?.email)) {
          updatedPresence.push({
            email: currentUser?.email,
            activeFile: activeFiles[0]?.name,
            lastSeen: new Date().toISOString(),
            cursor: cursorData
          });
        }
        
        const updatedContent = JSON.stringify({
          ...currentContent,
          presence: updatedPresence
        });
        
        await base44.entities.ProjectIDE.update(codeProject.id, {
          content: updatedContent
        });
      } catch (error) {
        // Silently fail cursor updates
      }
    }, 200);
  }, [codeProject, currentUser, activeFiles, isReadOnly]);

  // Handle Monaco save shortcut
  useEffect(() => {
    const handleMonacoSave = () => {
      handleSave(false);
    };
    
    window.addEventListener('monaco-save', handleMonacoSave);
    return () => window.removeEventListener('monaco-save', handleMonacoSave);
  }, [files, title]);

  const initializeDefaultFiles = () => {
    const defaultFiles = [
      {
        id: Date.now(),
        name: 'index.html',
        type: 'code',
        language: 'html',
        code: LANGUAGE_OPTIONS.find(l => l.value === 'html').defaultCode,
        size: 0
      }
    ];
    setFiles(defaultFiles);
    setActiveFiles([defaultFiles[0]]);
    setActiveHtmlFile(defaultFiles[0]);
  };

  useEffect(() => {
    if (hasUnsavedChanges && !isReadOnly) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, files, title, isReadOnly]);

  useEffect(() => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    updateTimerRef.current = setTimeout(() => {
      updatePreview();
    }, 300);

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [activeHtmlFile, files]);

  const updatePreview = () => {
    if (!iframeRef.current || !activeHtmlFile) return;

    const iframeElement = iframeRef.current;
    
    const updateContent = () => {
      try {
        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document;
        if (!iframeDoc) return;

        let htmlContent = activeHtmlFile.code || '';

        const cssFiles = files.filter(f => f.type === 'code' && f.language === 'css');
        let cssContent = '';
        cssFiles.forEach(cssFile => {
          cssContent += cssFile.code || '';
        });

        const jsFiles = files.filter(f => f.type === 'code' && ['javascript', 'typescript', 'jsx', 'tsx'].includes(f.language));
        let jsContent = '';
        jsFiles.forEach(jsFile => {
          jsContent += jsFile.code || '';
        });

        // Replace file references with actual URLs for assets
        const assetFiles = files.filter(f => f.type === 'asset');
        assetFiles.forEach(file => {
          const fileName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const patterns = [
            new RegExp(`src=["'](?:\.{1,2}/)?(?:[^"']*/)?(${fileName})["']`, 'gi'),
            new RegExp(`href=["'](?:\.{1,2}/)?(?:[^"']*/)?(${fileName})["']`, 'gi'),
            new RegExp(`url\\(["']?(?:\.{1,2}/)?(?:[^)"']*/)?(${fileName})["']?\\)`, 'gi'),
          ];
          
          patterns.forEach(pattern => {
            htmlContent = htmlContent.replace(pattern, (match) => {
              if (match.includes('src=')) return `src="${file.url}"`;
              if (match.includes('href=')) return `href="${file.url}"`;
              if (match.includes('url(')) return `url('${file.url}')`;
              return match;
            });
            cssContent = cssContent.replace(pattern, (match) => {
              if (match.includes('url(')) return `url('${file.url}')`;
              return match;
            });
          });
        });

        // Handle internal navigation to other HTML files
        const internalHtmlFiles = files.filter(f => f.type === 'code' && f.language === 'html');
        internalHtmlFiles.forEach(file => {
          const fileName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkPattern = new RegExp(`href=["'](?:\.{1,2}/)?(?:[^"']*/)?(${fileName})["']`, 'gi');
          
          htmlContent = htmlContent.replace(linkPattern, `href="#" data-internal-page="${file.name}"`);
        });

        const hasHtmlTag = /<html/i.test(htmlContent);
        const hasHeadTag = /<head/i.test(htmlContent);
        const hasBodyTag = /<body/i.test(htmlContent);

        const navigationScript = `
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'A' && e.target.hasAttribute('data-internal-page')) {
    e.preventDefault();
    const pageName = e.target.getAttribute('data-internal-page');
    window.parent.postMessage({ type: 'navigate', page: pageName }, '*');
  }
});
`;

        let documentContents;

        if (hasHtmlTag && hasHeadTag && hasBodyTag) {
          documentContents = htmlContent
            .replace(/<\/head>/i, `<style>\n${cssContent}\n</style>\n</head>`)
            .replace(/<\/body>/i, `<script>\ntry {\n${jsContent}\n} catch (error) {\nconsole.error('JS Error:', error);\n}\n${navigationScript}\n</script>\n</body>`);
        } else {
          const bodyContent = htmlContent.replace(/<\/?html[^>]*>|<\/?head[^>]*>|<\/?body[^>]*>/gi, '');
          
          documentContents = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssContent}</style>
</head>
<body>
${bodyContent}
<script>
try{${jsContent}}catch(e){console.error('JS Error:',e);}
${navigationScript}
</script>
</body>
</html>`;
        }

        iframeDoc.open();
        iframeDoc.write(documentContents);
        iframeDoc.close();
      } catch (error) {
        console.error("Error updating preview:", error);
      }
    };

    if (iframeElement.contentDocument?.readyState === 'complete') {
      updateContent();
    } else {
      iframeElement.onload = updateContent;
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'navigate' && event.data?.page) {
        const targetFile = files.find(f => 
          f.type === 'code' && 
          f.language === 'html' && 
          f.name === event.data.page
        );
        
        if (targetFile) {
          setActiveHtmlFile(targetFile);
          toast.success(`Navigated to ${targetFile.name}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files]);

  const handleCreateNewFile = () => {
    if (isReadOnly) return;

    if (!newFileName.trim()) {
      toast.error("Please enter a file name");
      return;
    }

    const langOption = LANGUAGE_OPTIONS.find(l => l.value === newFileType);
    const fileName = newFileName.trim().includes('.') 
      ? newFileName.trim() 
      : `${newFileName.trim()}.${langOption.ext}`;

    if (files.some(f => f.name === fileName)) {
      toast.error("A file with this name already exists");
      return;
    }

    const newFile = {
      id: Date.now(),
      name: fileName,
      type: 'code',
      language: newFileType,
      code: langOption.defaultCode,
      size: langOption.defaultCode.length
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFiles([newFile]);
    if (newFileType === 'html') {
      setActiveHtmlFile(newFile);
    }
    setNewFileName('');
    setShowNewFileDialog(false);
    setHasUnsavedChanges(true);
    toast.success(`Created ${fileName}`);
  };

  const handleFileUpload = async (e) => {
    if (isReadOnly) return;

    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    setIsUploadingFile(true);
    try {
      const uploadPromises = uploadedFiles.map(async (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const isCodeFile = ['html', 'css', 'js', 'htm', 'ts', 'tsx', 'jsx', 'py', 'java'].includes(ext);

        if (isCodeFile) {
          const text = await file.text();
          let language = ext;
          if (ext === 'htm') language = 'html';
          else if (ext === 'js') language = 'javascript';
          else if (ext === 'ts') language = 'typescript';
          else if (ext === 'tsx') language = 'tsx';
          else if (ext === 'jsx') language = 'jsx';
          else if (ext === 'py') language = 'python';
          else if (ext === 'java') language = 'java';
          
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'code',
            language,
            code: text,
            size: file.size
          };
        } else {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'asset',
            url: file_url,
            size: file.size
          };
        }
      });

      const newFiles = await Promise.all(uploadPromises);
      setFiles(prev => [...prev, ...newFiles]);
      setHasUnsavedChanges(true);
      
      const codeFilesCount = newFiles.filter(f => f.type === 'code').length;
      const assetFilesCount = newFiles.filter(f => f.type === 'asset').length;
      
      if (codeFilesCount > 0 && assetFilesCount > 0) {
        toast.success(`Uploaded ${codeFilesCount} code + ${assetFilesCount} asset(s)`);
      } else if (codeFilesCount > 0) {
        toast.success(`Uploaded ${codeFilesCount} code file(s)`);
      } else {
        toast.success(`Uploaded ${assetFilesCount} asset(s)`);
      }
      
      setShowUploadDialog(false);
      
      const firstNewHtml = newFiles.find(f => f.type === 'code' && f.language === 'html');
      if (firstNewHtml && !activeHtmlFile) {
        setActiveFiles([firstNewHtml]);
        setActiveHtmlFile(firstNewHtml);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (file) => {
    if (file.type !== 'code') return;
    
    if (activeFiles.length < 2 && !activeFiles.find(f => f.id === file.id)) {
      setActiveFiles(prev => [...prev, file]);
    } else if (!activeFiles.find(f => f.id === file.id)) {
      setActiveFiles(prev => [file, prev[1]]);
    }
    
    if (file.language === 'html') {
      setActiveHtmlFile(file);
    }
  };

  const handleCloseEditor = (fileId) => {
    setActiveFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileDelete = (file) => {
    if (isReadOnly) return;

    if (window.confirm(`Delete ${file.name}?`)) {
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setActiveFiles(prev => prev.filter(f => f.id !== file.id));
      if (activeHtmlFile?.id === file.id) {
        const remainingHtmlFiles = files.filter(f => f.type === 'code' && f.language === 'html' && f.id !== file.id);
        setActiveHtmlFile(remainingHtmlFiles[0] || null);
      }
      setHasUnsavedChanges(true);
    }
  };

  const handleCodeChange = (fileId, newCode) => {
    if (isReadOnly) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, code: newCode } : f
    ));
    setActiveFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, code: newCode } : f
    ));
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e) => {
    if (isReadOnly) return;

    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (isReadOnly) return;

    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }

    setIsSaving(true);
    try {
      const codeContent = JSON.stringify({ files });

      const codeData = {
        project_id: project.id,
        ide_type: 'code_playground',
        title: title.trim(),
        content: codeContent,
        last_modified_by: currentUser.email,
        is_active: true
      };

      if (codeProject?.id) {
        await base44.entities.ProjectIDE.update(codeProject.id, codeData);
      } else {
        const newCode = await base44.entities.ProjectIDE.create(codeData);
        if (onSave) {
          onSave(newCode);
        }
      }

      setHasUnsavedChanges(false);
      setLastSaved(new Date().toISOString());
      
      if (!isAutoSave) {
        toast.success("Saved");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isReadOnly) return;

    if (!codeProject?.id) return;

    setIsDeleting(true);
    try {
      await base44.entities.ProjectIDE.delete(codeProject.id);
      toast.success("Deleted");
      if (onClose) onClose(true);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleClose = () => {
    if (isReadOnly) {
      if (onClose) onClose(true);
      return;
    }

    if (hasUnsavedChanges) {
      const confirmClose = window.confirm("Unsaved changes. Save before closing?");
      if (confirmClose) {
        handleSave().then(() => {
          if (onClose) onClose(true);
        });
        return;
      }
    }
    if (onClose) onClose(true);
  };

  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const date = new Date(lastSaved);
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    return `Saved ${Math.floor(diffMins / 60)}h ago`;
  };

  const getFileIcon = (file) => {
    if (file.type === 'asset') {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      }
      if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
        return <Video className="w-4 h-4 text-purple-500" />;
      }
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
    return <FileCode className="w-4 h-4 text-green-500" />;
  };

  const codeFiles = files.filter(f => f.type === 'code');
  const assetFiles = files.filter(f => f.type === 'asset');
  const htmlFiles = files.filter(f => f.type === 'code' && f.language === 'html');

  return (
    <>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Delete "{title}"? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">File Name</label>
              <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="my-file" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">File Type</label>
              <Select value={newFileType} onValueChange={setNewFileType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label} (.{lang.ext})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateNewFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">Upload code files (HTML, CSS, JS) or assets (images, videos)</p>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploadingFile} className="w-full">
              {isUploadingFile ? 'Uploading...' : 'Select Files'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {!isReadOnly && (
                <Button variant="ghost" size="icon" onClick={handleClose}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Project Title"
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0"
                readOnly={isReadOnly}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Collaborator Presence */}
              <CodePlaygroundPresence 
                collaborators={collaborators}
                currentUser={currentUser}
                activeFile={activeFiles[0]?.name}
              />
              
              <div className="w-px h-5 bg-gray-200 mx-2" />
              
              {!isReadOnly && lastSaved && <span className="text-xs text-gray-500 hidden md:inline">{getLastSavedText()}</span>}
              {!isReadOnly && hasUnsavedChanges && <Badge variant="outline" className="text-xs">Unsaved</Badge>}
              {isReadOnly && (
                <Badge className="bg-blue-100 text-blue-700">Read Only</Badge>
              )}

              {/* Layout Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')}
                title={layout === 'horizontal' ? 'Switch to vertical layout' : 'Switch to horizontal layout'}
              >
                {layout === 'horizontal' ? <Rows2 className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
              </Button>
              
              {!isReadOnly && codeProject?.id && (
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              {!isReadOnly && (
                <Button onClick={() => handleSave(false)} disabled={isSaving || !hasUnsavedChanges} size="sm">
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex ${layout === 'vertical' ? 'flex-col' : 'flex-row'} overflow-hidden`}>
          {/* Files + Editors Section */}
          <div className={`flex ${layout === 'vertical' ? 'w-full h-1/2 border-b' : 'w-1/2 border-r'}`}>
            {/* Files Sidebar */}
            {!isFilesSidebarCollapsed && (
              <div className="w-48 flex-shrink-0 bg-white border-r flex flex-col">
                <div className="p-2 border-b">
                  <h3 className="font-semibold text-xs mb-2">Files</h3>
                  {!isReadOnly && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setShowNewFileDialog(true)} className="flex-1 text-xs px-2 py-1">
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)} className="flex-1 text-xs px-2 py-1">
                        <Upload className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-auto p-1">
                  {codeFiles.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-500 mb-1 px-1">CODE</div>
                      {codeFiles.map(file => (
                        <div
                          key={file.id}
                          className={`group flex items-center justify-between py-1 px-1.5 rounded cursor-pointer hover:bg-gray-100 ${
                            activeFiles.find(f => f.id === file.id) ? 'bg-purple-50' : ''
                          }`}
                          onClick={() => handleFileSelect(file)}
                        >
                          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                            {getFileIcon(file)}
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileDelete(file);
                              }}
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {assetFiles.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-1 px-1">ASSETS</div>
                      {assetFiles.map(file => (
                        <div
                          key={file.id}
                          className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-gray-100"
                        >
                          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                            {getFileIcon(file)}
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              onClick={() => handleFileDelete(file)}
                            >
                              <X className="w-3 h-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {files.length === 0 && (
                    <div className="text-center py-6">
                      <FileCode className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                      <p className="text-xs text-gray-500">No files</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collapse Toggle for Files */}
            {!isReadOnly && (
              <div className="w-4 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center justify-center group" onClick={() => setIsFilesSidebarCollapsed(!isFilesSidebarCollapsed)}>
                {isFilesSidebarCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-gray-500 group-hover:text-gray-700" />
                ) : (
                  <ChevronLeft className="w-3 h-3 text-gray-500 group-hover:text-gray-700" />
                )}
              </div>
            )}

            {/* Editors Section - Split View Support */}
            <div className="flex-1 flex overflow-hidden">
              {activeFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
                  <div className="text-center">
                    <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No file selected</p>
                    {!isReadOnly && <p className="text-xs text-gray-500 mt-1">Click a file to edit</p>}
                  </div>
                </div>
              ) : (
                activeFiles.map((file, index) => {
                  // Find collaborators editing this file
                  const editingCollabs = remoteCursors.filter(c => c.fileId === file.id);
                  
                  return (
                    <div key={file.id} className={`flex-1 flex flex-col ${index > 0 ? 'border-l' : ''}`}>
                      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b flex-shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium truncate">{file.name}</span>
                          <Badge className="text-xs flex-shrink-0">{LANGUAGE_OPTIONS.find(l => l.value === file.language)?.label}</Badge>
                          {/* Show who's editing this file */}
                          {editingCollabs.length > 0 && (
                            <div className="flex items-center -space-x-1">
                              {editingCollabs.slice(0, 3).map(collab => (
                                <div 
                                  key={collab.email}
                                  className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center"
                                  style={{ 
                                    backgroundColor: getUserColor(collab.email).bg,
                                    color: getUserColor(collab.email).text
                                  }}
                                  title={`${collab.name || collab.email} is editing`}
                                >
                                  {(collab.name || collab.email)?.[0]}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => {
                                const event = new CustomEvent('monaco-format');
                                window.dispatchEvent(event);
                              }}
                              title="Format code (Shift+Alt+F)"
                            >
                              <Wand2 className="w-3 h-3" />
                            </Button>
                          )}
                          {!isReadOnly && activeFiles.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 flex-shrink-0"
                              onClick={() => handleCloseEditor(file.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <MonacoEditor
                          value={file.code}
                          language={file.language}
                          onChange={(newCode) => handleCodeChange(file.id, newCode)}
                          readOnly={isReadOnly}
                          height="100%"
                          onCursorChange={handleCursorChange}
                          remoteCursors={remoteCursors}
                          fileId={file.id}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className={`flex flex-col ${layout === 'vertical' ? 'w-full h-1/2' : 'w-1/2'}`}>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium flex-shrink-0">Preview</span>
                {htmlFiles.length > 1 && (
                  <Select value={activeHtmlFile?.id.toString()} onValueChange={(val) => {
                    const file = htmlFiles.find(f => f.id.toString() === val);
                    if (file) setActiveHtmlFile(file);
                  }}>
                    <SelectTrigger className="h-7 text-xs max-w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {htmlFiles.map(f => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewMode(previewMode === 'desktop' ? 'mobile' : 'desktop')}>
                  {previewMode === 'desktop' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-white flex items-center justify-center p-4 overflow-auto">
              <div className={`h-full transition-all ${previewMode === 'mobile' ? 'w-[375px] max-h-[667px] border-8 border-gray-800 rounded-[2rem]' : 'w-full'}`}>
                <iframe
                  ref={iframeRef}
                  className={`w-full h-full bg-white ${previewMode === 'mobile' ? 'rounded-[1.2rem]' : ''}`}
                  sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                />
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          {showChat && !isReadOnly && (
            <div className={`${layout === 'vertical' ? 'w-full h-48 border-t' : 'w-64 flex-shrink-0'}`}>
              <CodePlaygroundChat
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                currentUser={currentUser}
                collaborators={collaborators}
                isMinimized={isChatMinimized}
                onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}