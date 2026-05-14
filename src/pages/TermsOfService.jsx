import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg";

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="text-[15px] text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function TermsOfService() {
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
          <Shield className="w-6 h-6 text-[#5B47DB]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400">Last Updated: November 26, 2025</p>
      </div>

      {/* Content */}
      <div className="max-w-[720px] mx-auto px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8 sm:p-12">
          <Section title="1. Introduction">
            <p>Welcome to Collab Unity ("we," "our," or "the Platform"). By accessing or using Collab Unity, you agree to be bound by these Terms of Service. If you do not agree, please do not use our Platform.</p>
            <p>Collab Unity is a collaborative platform that connects creators, professionals, and innovators to work together on meaningful projects. These Terms govern your use of our website, services, and all related features.</p>
          </Section>

          <Section title="2. Acceptance of Terms">
            <p>By creating an account or using Collab Unity, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You represent that you are at least 13 years of age. Users under 18 must have parental or guardian consent.</p>
          </Section>

          <Section title="3. User Accounts">
            <p><strong>3.1 Account Creation:</strong> To use certain features, you must create an account and provide accurate, current, and complete information during registration.</p>
            <p><strong>3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>
            <p><strong>3.3 Account Termination:</strong> You may terminate your account by contacting us. We reserve the right to suspend or terminate your account if you violate these Terms.</p>
          </Section>

          <Section title="4. User Conduct">
            <p>By using Collab Unity, you agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Post content that is illegal, harmful, harassing, defamatory, or otherwise objectionable</li>
              <li>Engage in hate speech or discrimination based on any protected characteristic</li>
              <li>Impersonate any person or entity</li>
              <li>Upload content that infringes upon intellectual property rights</li>
              <li>Interfere with or disrupt the Platform or servers</li>
              <li>Collect personally identifiable information from other users</li>
              <li>Use automated scripts, bots, or scrapers</li>
              <li>Post spam or unsolicited promotional materials</li>
            </ul>
          </Section>

          <Section title="5. Content and Intellectual Property">
            <p><strong>5.1 User-Generated Content:</strong> You retain ownership of content you create on Collab Unity. By posting, you grant Collab Unity a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content for Platform operations.</p>
            <p><strong>5.2 Platform Content:</strong> All content provided by Collab Unity is protected by copyright and other intellectual property laws. You may not use, copy, or distribute any Platform content without our express written permission.</p>
            <p><strong>5.3 Content Responsibility:</strong> You are solely responsible for your content. We reserve the right to remove content that violates these Terms.</p>
          </Section>

          <Section title="6. Project Collaboration">
            <p><strong>6.1 Project Ownership:</strong> The project creator retains ownership and control. Project Owners are responsible for managing collaborators and determining how contributions are used.</p>
            <p><strong>6.2 Collaborator Rights:</strong> Collaborators retain ownership of their individual contributions. Specific IP arrangements should be agreed upon between parties outside of the Platform.</p>
            <p><strong>6.3 Dispute Resolution:</strong> Collab Unity is not responsible for disputes between Project Owners and collaborators. We encourage users to communicate clearly before beginning collaboration.</p>
          </Section>

          <Section title="7. Disclaimers and Limitation of Liability">
            <p>THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, COLLAB UNITY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.</p>
          </Section>

          <Section title="8. Governing Law">
            <p>These Terms shall be governed by the laws of the United States and the State of California. Any legal action shall be brought exclusively in the state or federal courts located in California.</p>
          </Section>

          <Section title="9. Modifications">
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated by posting the updated Terms and updating the "Last Updated" date. Continued use constitutes acceptance.</p>
          </Section>

          <Section title="10. Contact Information">
            <p>If you have questions about these Terms, please contact us at:</p>
            <p className="font-medium text-gray-900 mt-2">Collab Unity — <a href="mailto:collabunity@collabunity.io" className="text-[#5B47DB] hover:underline">collabunity@collabunity.io</a></p>
          </Section>

          <div className="border-t border-gray-100 pt-6 mt-4">
            <p className="text-sm text-gray-400 text-center">By using Collab Unity, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to={createPageUrl("PrivacyPolicy")} className="text-sm text-[#5B47DB] hover:underline">View Privacy Policy →</Link>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-6 px-4 text-center bg-white">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
          <Link to={createPageUrl("Welcome")} className="hover:text-gray-600 transition-colors">Home</Link>
          <Link to={createPageUrl("Contact")} className="hover:text-gray-600 transition-colors">Contact</Link>
          <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-gray-600 transition-colors">Privacy</Link>
          <span>© 2025 Collab Unity</span>
        </div>
      </footer>
    </div>
  );
}