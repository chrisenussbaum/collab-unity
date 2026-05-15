import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { PublicNav, PublicFooter } from "@/components/public/PublicLayout";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "collabunity@collabunity.io",
        subject: `[Contact Form] ${formData.subject}`,
        body: `New contact form submission:\n\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`.trim()
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setIsSubmitted(false);
      }, 4000);
    } catch (error) {
      toast.error("Failed to send message. Email us directly at collabunity@collabunity.io");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans antialiased">
      <PublicNav currentPage="Contact" />

      {/* Hero */}
      <div className="pt-28 pb-6 text-center px-4">
        <p className="text-xs font-semibold text-[#5B47DB] uppercase tracking-widest mb-3">Get in Touch</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-3">Contact Us</h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </div>

      {/* Form Card */}
      <div className="max-w-[640px] mx-auto px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8 sm:p-10">
          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-gray-500">Thank you for reaching out. We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name</Label>
                  <Input id="name" placeholder="Your name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required className="rounded-xl border-gray-200 focus:border-[#5B47DB] focus:ring-[#5B47DB]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} required className="rounded-xl border-gray-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700">Subject</Label>
                <Input id="subject" placeholder="What's this about?" value={formData.subject} onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))} required className="rounded-xl border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message</Label>
                <Textarea id="message" placeholder="Tell us more..." rows={6} value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} required className="resize-none rounded-xl border-gray-200" />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#5B47DB] hover:bg-[#4A37C0] text-white rounded-full py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Message</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Alt contact */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Prefer email? Reach us directly at{" "}
            <a href="mailto:collabunity@collabunity.io" className="text-[#5B47DB] font-medium hover:underline">
              collabunity@collabunity.io
            </a>
          </p>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}