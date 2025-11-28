import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50 flex flex-col">
      {/* Header - matching Welcome page */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Feed")} className="flex items-center space-x-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold text-gray-900">Collab Unity</span>
            </Link>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center mb-6 sm:mb-8">
              <div className="flex items-center">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 mr-3" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
              </div>
            </div>

            <Card className="cu-card">
              <CardHeader>
                <CardTitle className="text-lg text-gray-600">
                  Last Updated: November 26, 2025
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm sm:prose max-w-none">
                <div className="space-y-6 text-gray-700">
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                    <p>
                      Welcome to Collab Unity. We are committed to protecting your privacy and ensuring the security 
                      of your personal information. This Privacy Policy explains how we collect, use, disclose, and 
                      safeguard your information when you use our Platform.
                    </p>
                    <p className="mt-2">
                      By accessing or using Collab Unity, you agree to this Privacy Policy. If you do not agree with 
                      our policies and practices, please do not use our Platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">2.1 Information You Provide</h3>
                    <p>
                      We collect information that you voluntarily provide to us when you register, create a profile, 
                      or use certain features of the Platform, including:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><strong>Account Information:</strong> Name, email address, username, password, profile picture, 
                      cover image, and date of birth</li>
                      <li><strong>Profile Information:</strong> Bio/mission statement, location, skills, interests, 
                      tools and technologies, education history, awards and certifications, phone number, website URLs, 
                      social media links</li>
                      <li><strong>Project Information:</strong> Project titles, descriptions, images, videos, 
                      collaborator details, project updates, and related content</li>
                      <li><strong>Communication Data:</strong> Messages, comments, posts, feedback, and any other content 
                      you share on the Platform</li>
                      <li><strong>Payment Information:</strong> If applicable, payment details for premium features or 
                      advertising (processed through secure third-party payment processors)</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">2.2 Information Collected Automatically</h3>
                    <p>
                      When you access and use the Platform, we may automatically collect certain information, including:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><strong>Usage Data:</strong> Pages visited, time spent on pages, clicks, searches, and other 
                      actions taken on the Platform</li>
                      <li><strong>Device Information:</strong> IP address, browser type and version, device type, 
                      operating system, unique device identifiers</li>
                      <li><strong>Location Data:</strong> General geographic location based on IP address (not precise geolocation)</li>
                      <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar 
                      technologies to track user activity and enhance user experience</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">2.3 Information from Third Parties</h3>
                    <p>
                      We may receive information about you from third parties, such as:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Social media platforms (if you choose to connect your social media accounts)</li>
                      <li>Authentication services (if you use third-party login)</li>
                      <li>Public databases and data aggregators (for verification purposes)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
                    <p>
                      We use the information we collect for various purposes, including:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><strong>Provide and Maintain the Platform:</strong> To operate, maintain, and improve Collab Unity's 
                      features and functionality</li>
                      <li><strong>Personalize Your Experience:</strong> To customize content, recommendations, and features 
                      based on your preferences and activity</li>
                      <li><strong>Facilitate Collaboration:</strong> To connect users with projects, collaborators, and 
                      opportunities that match their interests and skills</li>
                      <li><strong>Communication:</strong> To send you notifications, updates, newsletters, and respond to 
                      your inquiries</li>
                      <li><strong>Analytics and Improvements:</strong> To analyze usage patterns, identify trends, and 
                      improve the Platform's performance and user experience</li>
                      <li><strong>Security and Fraud Prevention:</strong> To detect, prevent, and address technical issues, 
                      security threats, and fraudulent activity</li>
                      <li><strong>Legal Compliance:</strong> To comply with legal obligations, enforce our Terms of Service, 
                      and protect our rights and the rights of other users</li>
                      <li><strong>Advertising:</strong> To display relevant advertisements and measure ad effectiveness</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">4. How We Share Your Information</h2>
                    <p>
                      We may share your information in the following circumstances:
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.1 Public Information</h3>
                    <p>
                      Certain information you provide is publicly visible by default, including your profile information 
                      (name, username, profile picture, bio, location, skills, interests), public projects, and posts on 
                      the Feed. You can control some visibility settings through your privacy preferences.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.2 With Other Users</h3>
                    <p>
                      When you collaborate on projects, your information is shared with other project collaborators. 
                      Project owners can see contact information and contributions of collaborators within their projects.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.3 Service Providers</h3>
                    <p>
                      We may share your information with third-party service providers who assist us in operating the 
                      Platform, such as:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Cloud hosting and storage providers (e.g., Supabase, AWS)</li>
                      <li>Analytics providers (e.g., Google Analytics)</li>
                      <li>Payment processors (e.g., PayPal, Stripe)</li>
                      <li>Email service providers</li>
                      <li>Customer support tools</li>
                    </ul>
                    <p className="mt-2">
                      These service providers are contractually obligated to protect your information and use it only 
                      for the purposes for which it was disclosed.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.4 Business Transfers</h3>
                    <p>
                      If Collab Unity is involved in a merger, acquisition, or sale of assets, your information may be 
                      transferred as part of that transaction. We will provide notice before your information is transferred 
                      and becomes subject to a different privacy policy.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.5 Legal Requirements</h3>
                    <p>
                      We may disclose your information if required to do so by law or in response to valid requests by 
                      public authorities (e.g., court orders, subpoenas, government agencies).
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.6 Protection of Rights</h3>
                    <p>
                      We may disclose your information when we believe it is necessary to protect the rights, property, 
                      or safety of Collab Unity, our users, or others. This includes exchanging information with other 
                      companies and organizations for fraud protection and credit risk reduction.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">4.7 With Your Consent</h3>
                    <p>
                      We may share your information for any other purpose with your explicit consent.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies and Tracking Technologies</h2>
                    <p>
                      We use cookies and similar tracking technologies to enhance your experience on the Platform. 
                      Cookies are small data files stored on your device. We use the following types of cookies:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li><strong>Essential Cookies:</strong> Necessary for the Platform to function properly 
                      (e.g., authentication, security)</li>
                      <li><strong>Performance Cookies:</strong> Collect information about how you use the Platform 
                      to help us improve its performance</li>
                      <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                      <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements and track ad campaign effectiveness</li>
                    </ul>
                    <p className="mt-2">
                      You can control cookie preferences through your browser settings. However, disabling cookies may 
                      affect the functionality of certain features on the Platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Privacy Rights and Choices</h2>
                    <p>
                      Depending on your location, you may have certain rights regarding your personal information:
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.1 Access and Portability</h3>
                    <p>
                      You have the right to request access to the personal information we hold about you and receive a 
                      copy of your data in a structured, commonly used format.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.2 Correction and Update</h3>
                    <p>
                      You can update and correct your profile information at any time through your account settings.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.3 Deletion</h3>
                    <p>
                      You may request deletion of your personal information by contacting us. Please note that we may 
                      retain certain information as required by law or for legitimate business purposes.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.4 Opt-Out of Communications</h3>
                    <p>
                      You can opt out of receiving promotional emails and notifications by adjusting your notification 
                      settings or clicking the unsubscribe link in our emails. Note that you cannot opt out of essential 
                      service-related communications.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.5 Do Not Track</h3>
                    <p>
                      Some browsers have "Do Not Track" features. Currently, there is no industry standard for responding 
                      to Do Not Track signals, and we do not respond to such signals at this time.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.6 California Privacy Rights</h3>
                    <p>
                      If you are a California resident, you have additional rights under the California Consumer Privacy 
                      Act (CCPA), including the right to know what personal information we collect, the right to delete 
                      your information, and the right to opt-out of the sale of your information. We do not sell your 
                      personal information.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.7 European Privacy Rights</h3>
                    <p>
                      If you are located in the European Economic Area (EEA) or the United Kingdom, you have rights 
                      under the General Data Protection Regulation (GDPR), including the right to access, rectify, 
                      erase, restrict processing, data portability, and object to processing of your personal data.
                    </p>

                    <p className="mt-3">
                      To exercise any of these rights, please contact us at collabunity@collabunity.io.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">7. Data Security</h2>
                    <p>
                      We implement appropriate technical and organizational security measures to protect your personal 
                      information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Encryption of data in transit and at rest</li>
                      <li>Secure authentication and access controls</li>
                      <li>Regular security assessments and vulnerability testing</li>
                      <li>Employee training on data protection and security practices</li>
                      <li>Incident response and breach notification procedures</li>
                    </ul>
                    <p className="mt-2">
                      However, no method of transmission over the internet or electronic storage is 100% secure. While 
                      we strive to use commercially acceptable means to protect your information, we cannot guarantee 
                      its absolute security.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
                    <p>
                      We retain your personal information for as long as necessary to fulfill the purposes outlined in 
                      this Privacy Policy, unless a longer retention period is required or permitted by law. When 
                      determining retention periods, we consider:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>The purpose for which we collected the information</li>
                      <li>Legal, regulatory, or contractual obligations</li>
                      <li>Our legitimate business interests</li>
                      <li>Potential disputes or investigations</li>
                    </ul>
                    <p className="mt-2">
                      When you delete your account, we will delete or anonymize your personal information, except where 
                      retention is required by law or for legitimate business purposes (e.g., preventing fraud, enforcing 
                      agreements).
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
                    <p>
                      Collab Unity is not intended for children under the age of 13. We do not knowingly collect personal 
                      information from children under 13. If you are a parent or guardian and believe that your child has 
                      provided us with personal information, please contact us immediately. If we become aware that we 
                      have collected personal information from a child under 13 without verification of parental consent, 
                      we will take steps to delete that information.
                    </p>
                    <p className="mt-2">
                      Users between 13 and 18 must have parental or guardian consent to use the Platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">10. International Data Transfers</h2>
                    <p>
                      Collab Unity is based in the United States. If you access the Platform from outside the United States, 
                      your information may be transferred to, stored, and processed in the United States or other countries 
                      where our service providers operate. These countries may have data protection laws that are different 
                      from those in your country.
                    </p>
                    <p className="mt-2">
                      By using the Platform, you consent to the transfer of your information to the United States and other 
                      countries as described in this Privacy Policy. We will take appropriate safeguards to ensure that your 
                      personal information receives an adequate level of protection.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">11. Third-Party Links</h2>
                    <p>
                      The Platform may contain links to third-party websites, services, or applications that are not 
                      operated by us. This Privacy Policy does not apply to third-party services. We are not responsible 
                      for the privacy practices of these third parties. We encourage you to review the privacy policies 
                      of any third-party services before providing them with your information.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">12. Changes to This Privacy Policy</h2>
                    <p>
                      We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, 
                      legal requirements, or other factors. We will notify you of any material changes by:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Posting the updated Privacy Policy on the Platform</li>
                      <li>Updating the "Last Updated" date at the top of this page</li>
                      <li>Sending you an email notification (for significant changes)</li>
                      <li>Displaying a prominent notice on the Platform</li>
                    </ul>
                    <p className="mt-2">
                      Your continued use of the Platform after the effective date of the revised Privacy Policy constitutes 
                      your acceptance of the changes. We encourage you to review this Privacy Policy periodically.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact Us</h2>
                    <p>
                      If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                      please contact us at:
                    </p>
                    <p className="mt-2 font-medium">
                      Collab Unity Privacy Team<br />
                      Email: collabunity@collabunity.io<br />
                      Support Email: collabunity@collabunity.io
                    </p>
                    <p className="mt-2">
                      We will respond to your inquiry within a reasonable timeframe.
                    </p>
                  </section>

                  <section className="border-t pt-6 mt-8">
                    <p className="text-sm text-gray-600">
                      By using Collab Unity, you acknowledge that you have read and understood this Privacy Policy and 
                      agree to the collection, use, and disclosure of your information as described herein.
                    </p>
                  </section>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer - matching Welcome page */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold text-white">Collab Unity</span>
            </div>
            <p className="text-gray-400 mb-6">
              Where Ideas Happen
            </p>
            <div className="flex items-center justify-center flex-wrap gap-6 text-sm">
              <Link to={createPageUrl("Contact")} className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm text-center">
            © 2025 Collab Unity. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}