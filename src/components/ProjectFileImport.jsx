import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Loader2, FolderUp, File as FileIcon, CheckCircle } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { toast } from "sonner";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Project title extracted from the file(s)" },
    description: { type: "string", description: "Project description (max 500 chars)" },
    project_type: { type: "string", enum: ["Personal", "Collaborative"] },
    classification: { type: "string", enum: ["educational", "career_development", "hobby", "business", "nonprofit", "startup"] },
    industry: { type: "string", enum: ["technology", "healthcare", "finance", "education", "e_commerce_retail", "entertainment_media", "art_design", "science_research", "social_good", "other"] },
    area_of_interest: { type: "string", description: "Short area tag, max 20 chars" },
    skills_needed: { type: "array", items: { type: "string" } },
    tools_needed: { type: "array", items: { type: "string" } },
  }
};

export default function ProjectFileImport({ onImportComplete, onBack }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 20MB)`);
        return false;
      }
      return true;
    });
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    if (file.type.includes("word")) return "📝";
    if (file.type.includes("sheet") || file.type.includes("csv")) return "📊";
    if (file.type === "application/json") return "🗂️";
    return "📁";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error("Please add at least one file.");
      return;
    }
    setIsProcessing(true);
    try {
      // Upload all files and extract from the first processable one
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await UploadFile({ file });
        uploadedUrls.push({ name: file.name, url: file_url });
      }

      // Use the first uploaded file for extraction
      const primaryUrl = uploadedUrls[0].url;
      const result = await ExtractDataFromUploadedFile({
        file_url: primaryUrl,
        json_schema: EXTRACT_SCHEMA,
      });

      if (result.status === "success" && result.output) {
        const data = Array.isArray(result.output) ? result.output[0] : result.output;
        onImportComplete({
          title: data.title || "",
          description: (data.description || "").substring(0, 500),
          project_type: data.project_type || "",
          classification: data.classification || "",
          industry: data.industry || "",
          area_of_interest: (data.area_of_interest || "").substring(0, 20),
          skills_needed: data.skills_needed || [],
          tools_needed: data.tools_needed || [],
          importedFileUrls: uploadedUrls,
        });
        toast.success("Project details extracted successfully!");
      } else {
        toast.error("Couldn't extract project details. Try a different file or fill in manually.");
        onImportComplete({ importedFileUrls: uploadedUrls });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to process files. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="cu-card">
      <CardContent className="p-6 space-y-5">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back
        </button>

        <div>
          <h2 className="text-xl font-bold text-gray-900">Import from files</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload project docs, briefs, spreadsheets, or images — we'll read them and auto-populate your project details.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
          }`}
          onClick={() => fileInputRef.current.click()}
        >
          <FolderUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">Drag & drop files here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">PDF, Word, TXT, Markdown, JSON, CSV, Excel, Images — up to 20MB each</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory=""
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        <Button
          variant="outline"
          className="w-full border-dashed border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-700"
          onClick={() => folderInputRef.current.click()}
        >
          <FolderUp className="w-4 h-4 mr-2" />
          Upload a Folder
        </Button>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {files.map((file) => (
                <div key={file.name} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0">{getFileIcon(file)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(file.name)} className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleProcess}
          disabled={isProcessing || files.length === 0}
          className="w-full cu-button py-5"
        >
          {isProcessing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Analyzing files...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />Import & Build Project</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}