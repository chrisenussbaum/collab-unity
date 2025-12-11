import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2,
  Download,
  Briefcase,
  Users,
  CheckSquare,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { generateProfilePDF } from "@/functions/generateProfilePDF";

export default function GenerateResumeDialog({ 
  isOpen, 
  onClose, 
  profileUser,
  username 
}) {
  const [existingResume, setExistingResume] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const resumeInputRef = useRef(null);

  const generationSteps = [
    { label: 'Gathering profile data...', icon: FileText },
    { label: 'Analyzing project contributions...', icon: Briefcase },
    { label: 'Compiling tasks, notes & assets...', icon: CheckSquare },
    { label: 'Organizing skills & tools...', icon: Wrench },
    { label: 'Formatting resume...', icon: Download },
  ];

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      return;
    }

    setExistingResume(file);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  const removeResume = () => {
    setExistingResume(null);
  };

  const simulateProgress = () => {
    return new Promise((resolve) => {
      let step = 0;
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        
        if (progress >= 100) {
          progress = 100;
          step++;
          
          if (step < generationSteps.length - 1) {
            setGenerationStep(step);
            progress = 0;
          }
        }
        
        setGenerationProgress(Math.min(progress, 100));
        
        if (step >= generationSteps.length - 1 && progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 300);
    });
  };

  const handleGenerate = async () => {
    if (!profileUser || !username) {
      toast.error("Profile information not available");
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress(0);

    try {
      // Start progress simulation
      const progressPromise = simulateProgress();

      // Convert existing resume to base64 if provided
      let existingResumeBase64 = null;
      if (existingResume) {
        existingResumeBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(existingResume);
        });
      }

      // Call the enhanced backend function
      const { data } = await generateProfilePDF({ 
        username,
        existingResumeBase64,
        existingResumeType: existingResume?.type,
        includeDeepScrape: true
      });
      
      // Wait for progress animation to complete
      await progressPromise;
      
      // Download the PDF
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profileUser.full_name || 'profile'}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success("Resume generated successfully!");
      onClose();
    } catch (error) {
      console.error("Error generating resume:", error);
      toast.error("Failed to generate resume. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
      setGenerationProgress(0);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setExistingResume(null);
      setGenerationStep(0);
      setGenerationProgress(0);
      onClose();
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ref={resumeInputRef}
        onChange={handleResumeUpload}
        className="hidden"
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Generate Resume
            </DialogTitle>
            <DialogDescription>
              Create a professional resume combining your profile with your Collab Unity projects and contributions.
            </DialogDescription>
          </DialogHeader>

          {!isGenerating ? (
            <div className="space-y-6 py-4">
              {/* Existing Resume Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Existing Resume (Optional)
                </Label>
                
                {existingResume ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">{existingResume.name}</p>
                        <p className="text-xs text-green-600">
                          {(existingResume.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeResume}
                      className="text-green-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => resumeInputRef.current?.click()}
                    className="w-full border-dashed h-20 flex flex-col gap-1"
                    disabled={isUploading}
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload your current resume
                    </span>
                    <span className="text-xs text-gray-400">PDF or Word (max 10MB)</span>
                  </Button>
                )}
              </div>

              {/* What will be included */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-purple-900 text-sm">Your resume will include:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Contact & Summary</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Education</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Project Experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Detailed Contributions</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Top Skills</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Certifications</span>
                  </div>
                </div>
                
                {existingResume && (
                  <div className="pt-2 border-t border-purple-200">
                    <div className="flex items-center gap-2 text-xs text-purple-800 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Your uploaded resume content will be included</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6">
              {/* Generation Progress */}
              <div className="space-y-4">
                {generationSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === generationStep;
                  const isComplete = index < generationStep;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 transition-all ${
                        isActive ? 'text-purple-700' : 
                        isComplete ? 'text-green-600' : 
                        'text-gray-400'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-purple-100' :
                        isComplete ? 'bg-green-100' :
                        'bg-gray-100'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-center text-gray-500">
                  Step {generationStep + 1} of {generationSteps.length}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {!isGenerating && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate}
                  className="cu-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Resume
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}