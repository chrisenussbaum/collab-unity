import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Lock } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="text-[15px] text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans antialiased">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200">
        <div className="max-w-[980px] mx-auto px-6 flex items-center justify-between h-14">
          <Link to={createPageUrl("Welcome")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Collab Unity" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-sm font-semibold text-gray-900">Collab Unity</span>
          </Link>
          <Link to={createPageUrl("Welcome")} className="flex items-center gap-1.5 text-[13px] text-[#5B47DB] font-medium hover:text-[#4A37C0] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="pt-28 pb-6 text-center px-4">
        <div className="w-12 h-12 bg-[#5B47DB]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-[#5B47DB]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400">Last Updated: November 26, 2025</p>
      </div>

      {/* Content */}
      <div className="max-w-[720px] mx-auto px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8 sm:p-12">

          <Section title="1. Introduction">
            <p>Welcome to Collab Unity. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform.</p>
            <p>By accessing or using Collab Unity, you agree to this Privacy Policy. If you do not agree, please do not use our Platform.</p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong>2.1 Information You Provide:</strong> When you register or use the Platform, we may collect your name, email address, username, profile picture, bio, location, skills, interests, education history, social media links, project information, messages, and payment details for marketplace transactions.</p>
            <p><strong>2.2 Automatically Collected:</strong> We may collect usage data (pages visited, clicks, searches), device information (IP address, browser type, operating system), general geographic location, and cookies/tracking data.</p>
            <p><strong>2.3 From Third Parties:</strong> We may receive information from social media platforms (if you connect them) or authentication services (if you use third-party login).</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, operate, and improve the Platform</li>
              <li>Personalize your experience and recommendations</li>
              <li>Facilitate collaboration between users</li>
              <li>Enable marketplace operations and transactions</li>
              <li>Power AI features like resume generation and project suggestions</li>
              <li>Send notifications, updates, and respond to inquiries</li>
              <li>Detect and prevent fraud and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. How We Share Your Information">
            <p><strong>4.1 Public Information:</strong> Your profile, public projects, and Feed posts are publicly visible by default. You can control some visibility settings in your privacy preferences.</p>
            <p><strong>4.2 With Collaborators:</strong> When you collaborate on projects, your information is shared with other project collaborators.</p>
            <p><strong>4.3 Service Providers:</strong> We may share your information with trusted third-party providers (hosting, analytics, payment processors, email services, AI providers) who are contractually obligated to protect your data.</p>
            <p><strong>4.4 Legal Requirements:</strong> We may disclose your information if required by law or valid government requests.</p>
            <p><strong>4.5 With Your Consent:</strong> We may share your information for any other purpose with your explicit consent.</p>
          </Section>

          <Section title="5. Cookies and Tracking">
            <p>We use cookies and similar tracking technologies to enhance your experience. You can control cookie preferences through your browser settings, though disabling cookies may affect certain Platform features. We use essential, performance, functional, and advertising cookies.</p>
          </Section>

          <Section title="6. Your Privacy Rights">
            <p><strong>Access & Portability:</strong> You may request a copy of your personal data.</p>
            <p><strong>Correction:</strong> You can update profile information anytime in your account settings.</p>
            <p><strong>Deletion:</strong> You may request deletion of your personal information by contacting us.</p>
            <p><strong>Opt-Out:</strong> You can opt out of promotional communications in your notification settings.</p>
            <p><strong>California (CCPA):</strong> California residents have the right to know, delete, and opt-out of the sale of personal information. We do not sell your personal information.</p>
            <p><strong>Europe (GDPR):</strong> EEA/UK users have rights to access, rectify, erase, restrict processing, and data portability under GDPR.</p>
            <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:collabunity@collabunity.io" className="text-[#5B47DB] hover:underline">collabunity@collabunity.io</a>.</p>
          </Section>

          <Section title="7. Data Security">
            <p>We implement appropriate technical and organizational security measures including encryption in transit and at rest, secure authentication, regular security assessments, and incident response procedures. However, no method of internet transmission is 100% secure.</p>
          </Section>

          <Section title="8. Data Retention">
            <p>We retain your personal information as long as necessary to fulfill the purposes outlined in this policy or as required by law. When you delete your account, we delete or anonymize your data except where retention is required by law.</p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>Collab Unity is not intended for children under 13. We do not knowingly collect information from children under 13. Users between 13 and 18 require parental consent. Contact us immediately if you believe a child has provided us with their information.</p>
          </Section>

          <Section title="10. International Data Transfers">
            <p>Collab Unity is based in the United States. If you access the Platform from outside the US, your information may be transferred to and processed in the United States. By using the Platform, you consent to this transfer.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy and updating the "Last Updated" date. Your continued use of the Platform after changes constitutes acceptance.</p>
          </Section>

          <Section title="12. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p className="font-medium text-gray-900 mt-2">Collab Unity Privacy Team — <a href="mailto:collabunity@collabunity.io" className="text-[#5B47DB] hover:underline">collabunity@collabunity.io</a></p>
          </Section>

          <div className="border-t border-gray-100 pt-6 mt-4">
            <p className="text-sm text-gray-400 text-center">By using Collab Unity, you acknowledge that you have read and understood this Privacy Policy.</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to={createPageUrl("TermsOfService")} className="text-sm text-[#5B47DB] hover:underline">View Terms of Service →</Link>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-6 px-4 text-center bg-white">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
          <Link to={createPageUrl("Welcome")} className="hover:text-gray-600 transition-colors">Home</Link>
          <Link to={createPageUrl("Contact")} className="hover:text-gray-600 transition-colors">Contact</Link>
          <Link to={createPageUrl("TermsOfService")} className="hover:text-gray-600 transition-colors">Terms</Link>
          <span>© 2025 Collab Unity</span>
        </div>
      </footer>
    </div>
  );
}