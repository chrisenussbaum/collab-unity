import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { File, Folder, ChevronRight, ChevronDown, X, FileText, Image, Video, Music, Archive, Code } from 'lucide-react';

// Helper function to get file icon
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return <Image className="w-4 h-4 text-blue-500" />;
  }
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
    return <Video className="w-4 h-4 text-purple-500" />;
  }
  if (['mp3', 'wav', 'ogg'].includes(ext)) {
    return <Music className="w-4 h-4 text-pink-500" />;
  }
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
    return <Archive className="w-4 h-4 text-yellow-500" />;
  }
  if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb'].includes(ext)) {
    return <Code className="w-4 h-4 text-green-500" />;
  }
  return <FileText className="w-4 h-4 text-gray-500" />;
};

// File tree item component
const FileTreeItem = ({ file, onSelect, onDelete, selectedFile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFolder = file.type === 'folder';
  const isSelected = selectedFile?.path === file.path;

  if (isFolder) {
    return (
      <div className="ml-2">
        <div
          className={`flex items-center space-x-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-100 group ${
            isSelected ? 'bg-purple-50' : ''
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <Folder className="w-4 h-4 text-yellow-500" />
          <span className="text-sm flex-1">{file.name}</span>
        </div>
        {isExpanded && file.children && (
          <div className="ml-4">
            {file.children.map((child, idx) => (
              <FileTreeItem
                key={idx}
                file={child}
                onSelect={onSelect}
                onDelete={onDelete}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer hover:bg-gray-100 group ml-2 ${
        isSelected ? 'bg-purple-50' : ''
      }`}
      onClick={() => onSelect(file)}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <span className="ml-4">{getFileIcon(file.name)}</span>
        <span className="text-sm truncate">{file.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file);
        }}
      >
        <X className="w-3 h-3 text-red-500" />
      </Button>
    </div>
  );
};

export default function FileExplorer({ files, selectedFile, onFileSelect, onFileDelete, onUploadClick }) {
  return (
    <div className="w-64 bg-white border-r flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Files</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onUploadClick}
          className="h-7 w-7"
        >
          <File className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {files.length === 0 ? (
          <div className="text-center py-8">
            <File className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs text-gray-500 mb-3">No files yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadClick}
              className="text-xs"
            >
              Upload Files
            </Button>
          </div>
        ) : (
          files.map((file, idx) => (
            <FileTreeItem
              key={idx}
              file={file}
              onSelect={onFileSelect}
              onDelete={onFileDelete}
              selectedFile={selectedFile}
            />
          ))
        )}
      </div>
    </div>
  );
}