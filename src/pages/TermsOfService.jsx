import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfService() {
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
            <Link to={createPageUrl("Welcome")} className="flex items-center space-x-3">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms of Service</h1>
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
                      Welcome to Collab Unity ("we," "our," or "the Platform"). By accessing or using Collab Unity,
                      you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
                      please do not use our Platform.
                    </p>
                    <p className="mt-2">
                      Collab Unity is a collaborative platform that connects creators, professionals, and innovators
                      to work together on meaningful projects. These Terms govern your use of our website, services,
                      and all related features.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">2. Acceptance of Terms</h2>
                    <p>
                      By creating an account, accessing, or using Collab Unity, you acknowledge that you have read,
                      understood, and agree to be bound by these Terms and our Privacy Policy. You represent that you
                      are at least 13 years of age. If you are under 18, you must have parental or guardian consent
                      to use the Platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">3.1 Account Creation</h3>
                    <p>
                      To use certain features of Collab Unity, you must create an account. You agree to provide accurate,
                      current, and complete information during registration and to update such information to keep it accurate.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">3.2 Account Security</h3>
                    <p>
                      You are responsible for maintaining the confidentiality of your account credentials and for all
                      activities that occur under your account. You agree to notify us immediately of any unauthorized
                      use of your account.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">3.3 Account Termination</h3>
                    <p>
                      You may terminate your account at any time by contacting us. We reserve the right to suspend or
                      terminate your account if you violate these Terms or engage in conduct that we deem harmful to
                      the Platform or other users.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">4. User Conduct</h2>
                    <p>
                      By using Collab Unity, you agree to conduct yourself in a respectful and lawful manner.
                      You agree NOT to:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Post or share content that is illegal, harmful, threatening, abusive, harassing, defamatory,
                        vulgar, obscene, or otherwise objectionable</li>
                      <li>Engage in hate speech, discrimination, or harassment based on race, ethnicity, religion,
                        gender, sexual orientation, disability, or any other protected characteristic</li>
                      <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity</li>
                      <li>Upload, post, or transmit any content that infringes upon the intellectual property rights of others</li>
                      <li>Interfere with or disrupt the Platform or servers, or violate any requirements, procedures,
                        policies, or regulations of networks connected to the Platform</li>
                      <li>Use the Platform for any commercial solicitation without our prior written consent</li>
                      <li>Collect or harvest any personally identifiable information from other users</li>
                      <li>Use automated scripts, bots, or scrapers to access the Platform</li>
                      <li>Attempt to gain unauthorized access to any portion of the Platform</li>
                      <li>Post spam, unsolicited advertisements, or promotional materials</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">5. Content and Intellectual Property</h2>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">5.1 User-Generated Content</h3>
                    <p>
                      You retain ownership of all content you create, upload, or share on Collab Unity ("User Content"),
                      including projects, posts, comments, images, videos, and other materials. By posting User Content,
                      you grant Collab Unity a non-exclusive, worldwide, royalty-free, sublicensable license to use,
                      reproduce, modify, adapt, publish, and display such content for the purpose of operating and
                      improving the Platform.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">5.2 Platform Content</h3>
                    <p>
                      All content provided by Collab Unity, including but not limited to text, graphics, logos, icons,
                      images, software, and the Platform's design, is the property of Collab Unity or its licensors and
                      is protected by copyright, trademark, and other intellectual property laws. You may not use, copy,
                      reproduce, or distribute any Platform content without our express written permission.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">5.3 Content Responsibility</h3>
                    <p>
                      You are solely responsible for your User Content and the consequences of posting it. We do not
                      endorse any User Content or opinion expressed by any user. We reserve the right, but are not
                      obligated, to remove or modify any User Content that violates these Terms or that we deem
                      inappropriate.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">5.4 Copyright Infringement</h3>
                    <p>
                      We respect intellectual property rights. If you believe that your work has been copied in a way
                      that constitutes copyright infringement, please contact us with detailed information about the
                      alleged infringement.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">6. Project Collaboration</h2>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">6.1 Project Ownership</h3>
                    <p>
                      The creator of a project ("Project Owner") retains ownership and control over their project.
                      Project Owners are responsible for managing collaborators, setting project goals, and determining
                      how contributions are used.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.2 Collaborator Rights</h3>
                    <p>
                      Collaborators retain ownership of their individual contributions to a project. By contributing
                      to a project, collaborators grant the Project Owner a license to use their contributions within
                      the scope of the project. Specific intellectual property arrangements should be agreed upon
                      between Project Owners and collaborators outside of the Platform.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">6.3 Dispute Resolution</h3>
                    <p>
                      Collab Unity is not responsible for disputes between Project Owners and collaborators. We encourage
                      users to communicate clearly and establish agreements regarding intellectual property, compensation,
                      and credit before beginning collaboration.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">7. Advertising and Promotions</h2>
                    <p>
                      Collab Unity may display advertisements on the Platform. Advertisers are responsible for ensuring
                      that their ads comply with all applicable laws and regulations. We reserve the right to reject,
                      modify, or remove any advertisement at our discretion.
                    </p>
                    <p className="mt-2">
                      Paid promotional opportunities may be available. Users who wish to advertise must agree to our
                      advertising policies and guidelines.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">8. Disclaimers and Limitation of Liability</h2>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">8.1 No Warranty</h3>
                    <p>
                      THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                      OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                      PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED,
                      ERROR-FREE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">8.2 Limitation of Liability</h3>
                    <p>
                      TO THE FULLEST EXTENT PERMITTED BY LAW, COLLAB UNITY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                      SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
                      DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Your access to or use of (or inability to access or use) the Platform</li>
                      <li>Any conduct or content of any third party on the Platform</li>
                      <li>Any content obtained from the Platform</li>
                      <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">8.3 User Interactions</h3>
                    <p>
                      You are solely responsible for your interactions with other users. We reserve the right, but have
                      no obligation, to monitor disputes between you and other users. We disclaim all liability for user
                      interactions and the actions or inactions of other users.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">9. Indemnification</h2>
                    <p>
                      You agree to indemnify, defend, and hold harmless Collab Unity, its officers, directors, employees,
                      and agents from and against any claims, liabilities, damages, losses, and expenses, including
                      reasonable legal fees, arising out of or in any way connected with:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Your access to or use of the Platform</li>
                      <li>Your User Content</li>
                      <li>Your violation of these Terms</li>
                      <li>Your violation of any third-party rights</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">10. Privacy</h2>
                    <p>
                      Your privacy is important to us. Please review our Privacy Policy, which explains how we collect,
                      use, and protect your personal information. By using Collab Unity, you consent to our collection
                      and use of your information as described in the Privacy Policy.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">11. Modifications to Terms</h2>
                    <p>
                      We reserve the right to modify these Terms at any time. We will notify users of material changes
                      by posting the updated Terms on the Platform and updating the "Last Updated" date. Your continued
                      use of the Platform after the effective date of the revised Terms constitutes your acceptance of
                      the changes. We encourage you to review these Terms periodically.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">12. Termination</h2>
                    <p>
                      We may terminate or suspend your account and access to the Platform immediately, without prior notice
                      or liability, for any reason, including but not limited to a breach of these Terms. Upon termination,
                      your right to use the Platform will immediately cease.
                    </p>
                    <p className="mt-2">
                      All provisions of these Terms which by their nature should survive termination shall survive, including
                      but not limited to ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">13. Governing Law and Jurisdiction</h2>
                    <p>
                      These Terms shall be governed by and construed in accordance with the laws of the United States and
                      the State of California, without regard to its conflict of law provisions. Any legal action or
                      proceeding arising out of or related to these Terms or the Platform shall be brought exclusively in
                      the state or federal courts located in California, and you consent to the personal jurisdiction of
                      such courts.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">14. Dispute Resolution</h2>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">14.1 Informal Resolution</h3>
                    <p>
                      In the event of any dispute, you agree to first contact us to attempt to resolve the dispute informally.
                      We will attempt to resolve the dispute through good faith negotiations.
                    </p>

                    <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-3">14.2 Arbitration</h3>
                    <p>
                      If we cannot resolve the dispute informally, any controversy or claim arising out of or relating to
                      these Terms or the Platform shall be settled by binding arbitration in accordance with the commercial
                      arbitration rules of the American Arbitration Association. The arbitration shall be conducted in
                      California, and judgment on the award may be entered in any court having jurisdiction.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">15. Severability</h2>
                    <p>
                      If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
                      limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in
                      full force and effect and enforceable.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">16. Entire Agreement</h2>
                    <p>
                      These Terms, together with the Privacy Policy, constitute the entire agreement between you and Collab
                      Unity regarding the use of the Platform and supersede any prior agreements between you and Collab Unity
                      relating to your use of the Platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">17. Contact Information</h2>
                    <p>
                      If you have any questions about these Terms, please contact us at:
                    </p>
                    <p className="mt-2 font-medium">
                      Collab Unity Support<br />
                      Email: collabunity@collabunity.io
                    </p>
                  </section>

                  <section className="border-t pt-6 mt-8">
                    <p className="text-sm text-gray-600">
                      By using Collab Unity, you acknowledge that you have read, understood, and agree to be bound by
                      these Terms of Service.
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