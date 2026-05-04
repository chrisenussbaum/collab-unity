import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Loader2, FolderUp, File as FileIcon, CheckCircle } from "lucide-react";
import { UploadFile, InvokeLLM } from "@/integrations/Core";
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
    title: { type: "string", description: "A clear, specific project title extracted or inferred from the file(s)" },
    description: { type: "string", description: "A detailed project description summarizing goals, purpose, and scope. Max 500 characters." },
    project_type: { type: "string", enum: ["Personal", "Collaborative"], description: "Whether this is a solo or team project" },
    classification: { type: "string", enum: ["educational", "career_development", "hobby", "business", "nonprofit", "startup"] },
    industry: { type: "string", enum: ["technology", "healthcare", "finance", "education", "e_commerce_retail", "entertainment_media", "art_design", "science_research", "social_good", "other"] },
    area_of_interest: { type: "string", description: "Short area/field tag, max 20 characters (e.g. 'Web Dev', 'Marketing', 'AI/ML')" },
    location: { type: "string", description: "Project location if mentioned, e.g. 'Remote' or 'New York, NY'" },
    skills_needed: { type: "array", items: { type: "string" }, description: "Specific skills needed or demonstrated in this project (e.g. React, Figma, Python, Copywriting)" },
    tools_needed: { type: "array", items: { type: "string" }, description: "Tools, platforms, or software used or needed (e.g. GitHub, Notion, Figma, Slack)" },
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
      // Upload all files in parallel
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await UploadFile({ file });
          return { name: file.name, url: file_url };
        })
      );

      const fileUrls = uploadResults.map(f => f.url);

      // Use InvokeLLM with all file URLs so AI can read full content of every file
      const data = await InvokeLLM({
        prompt: `You are analyzing uploaded project files to help a user structure their project on a collaboration platform.

Carefully read ALL the provided files — these may include project briefs, documents, images, spreadsheets, notes, or design files.

Based on the full content of all files, extract and infer the following project details as accurately and specifically as possible:
- A clear project title
- A rich, detailed description of the project (goals, purpose, scope) — max 500 characters
- Whether it's a Personal or Collaborative project
- The most fitting classification (educational, career_development, hobby, business, nonprofit, startup)
- The industry it belongs to
- A short area-of-interest tag (max 20 chars)
- Location if mentioned (or "Remote" if distributed/online)
- A comprehensive list of specific skills needed or demonstrated
- A comprehensive list of tools, platforms, and software used or needed

Be specific and detailed — don't give generic answers. Base everything on the actual file content.`,
        file_urls: fileUrls,
        response_json_schema: EXTRACT_SCHEMA,
      });

      if (data) {
        onImportComplete({
          title: data.title || "",
          description: (data.description || "").substring(0, 500),
          project_type: data.project_type || "",
          classification: data.classification || "",
          industry: data.industry || "",
          area_of_interest: (data.area_of_interest || "").substring(0, 20),
          location: data.location || "",
          skills_needed: data.skills_needed || [],
          tools_needed: data.tools_needed || [],
          importedFileUrls: uploadResults,
        });
        toast.success("Project details extracted successfully!");
      } else {
        toast.error("Couldn't extract project details. Try a different file or fill in manually.");
        onImportComplete({ importedFileUrls: uploadResults });
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