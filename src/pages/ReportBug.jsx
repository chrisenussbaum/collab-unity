import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Bug, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PAGE_OPTIONS = [
  { value: "Feed", label: "Feed" },
  { value: "Discover", label: "Discover" },
  { value: "MyProjects", label: "My Projects" },
  { value: "CreateProject", label: "Create Project" },
  { value: "ProjectDetail", label: "Project Detail" },
  { value: "UserProfile", label: "User Profile" },
  { value: "Sync", label: "Sync (Messages)" },
  { value: "Notifications", label: "Notifications" },
  { value: "ProjectTemplates", label: "Project Templates" },
  { value: "Advertise", label: "Advertise" },
  { value: "AdminVerificationPanel", label: "Admin Panel" },
  { value: "SupportCU", label: "Support CU" },
  { value: "Other", label: "Other" }
];

export default function ReportBug({ currentUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    page_name: "",
    custom_page_url: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a bug title.");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please describe the bug.");
      return;
    }
    if (!formData.page_name) {
      toast.error("Please select which page the bug occurred on.");
      return;
    }

    setIsSubmitting(true);
    try {
      const browserInfo = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height}`;
      
      let pageUrl = "";
      if (formData.page_name === "Other") {
        pageUrl = formData.custom_page_url || window.location.href;
      } else {
        pageUrl = `${window.location.origin}${createPageUrl(formData.page_name)}`;
      }
      
      await base44.entities.Bug.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        page_url: pageUrl,
        browser_info: browserInfo,
        reporter_email: currentUser?.email || 'anonymous',
        reporter_name: currentUser?.full_name || 'Anonymous User',
        status: 'pending',
        priority: 'medium'
      });

      setSubmitted(true);
      toast.success("Bug report submitted successfully!");
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast.error("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your bug report has been submitted. We'll review it and work on a fix as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  title: "",
                  description: "",
                  page_name: "",
                  custom_page_url: ""
                });
              }}
              variant="outline"
            >
              Report Another Bug
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
        
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bug className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Report a Bug
            </h1>
            <p className="text-gray-600">
              Help us improve Collab Unity by reporting issues you encounter
            </p>
          </div>

          <Card className="cu-card">
            <CardHeader>
              <CardTitle>Bug Details</CardTitle>
              <CardDescription>
                Please provide as much detail as possible to help us identify and fix the issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Bug Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Unable to upload project logo"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened, what you expected to happen, and the steps to reproduce the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={8}
                    className="resize-none text-base"
                  />
                  <p className="text-xs text-gray-500">
                    Include any error messages, screenshots descriptions, or relevant details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page_name">Which page did this occur on? *</Label>
                  <Select 
                    value={formData.page_name} 
                    onValueChange={(value) => setFormData({ ...formData, page_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a page..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {PAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    This helps us identify where the issue occurred
                  </p>
                </div>

                {formData.page_name === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom_page_url">Custom Page URL (Optional)</Label>
                    <Input
                      id="custom_page_url"
                      placeholder="Enter the page URL if not listed above..."
                      value={formData.custom_page_url}
                      onChange={(e) => setFormData({ ...formData, custom_page_url: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> The more details you provide, the easier it is for us to fix the issue. Thank you for helping improve Collab Unity!
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full cu-button"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Bug Report
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}