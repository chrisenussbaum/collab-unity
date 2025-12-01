import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Users, TrendingUp, Target, Rocket, Download, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ExecutiveSummary() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50">
      {/* Header - Screen Only */}
      <header className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Feed")} className="flex items-center space-x-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold text-gray-900">Collab Unity</span>
            </Link>
            <Button onClick={handlePrint} className="cu-button">
              <Download className="w-4 h-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Executive Summary Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <style>{`
          @media print {
            body { 
              font-size: 11pt;
              line-height: 1.4;
            }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:break-after-page { page-break-after: always; }
            .print\\:break-inside-avoid { page-break-inside: avoid; }
            .max-w-5xl { max-width: 100%; }
            .px-4, .sm\\:px-6, .lg\\:px-8 { padding-left: 0.5in; padding-right: 0.5in; }
            h1 { font-size: 24pt; margin-bottom: 0.5in; }
            h2 { font-size: 16pt; margin-top: 0.25in; margin-bottom: 0.15in; }
            h3 { font-size: 13pt; margin-top: 0.2in; margin-bottom: 0.1in; }
            p { margin-bottom: 0.1in; }
            .cu-card { box-shadow: none; border: 1px solid #e5e7eb; }
          }
        `}</style>

        {/* Cover Section */}
        <div className="text-center mb-12 print:mb-8">
          <div className="w-20 h-20 cu-gradient rounded-full flex items-center justify-center mx-auto mb-6 print:hidden">
            <Lightbulb className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Collab Unity
          </h1>
          <p className="text-xl text-gray-600 mb-2">Executive Summary</p>
          <p className="text-sm text-gray-500">Updated: December 2024</p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 print:text-[9pt]">
            <strong>CONFIDENTIAL:</strong> This document contains proprietary information. Do not disseminate without express written consent.
          </div>
        </div>

        {/* Page 1 Content */}
        <div className="space-y-8 print:space-y-6">
          {/* Vision Statement */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Rocket className="w-6 h-6 mr-3 text-purple-600" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-3">
              <p className="text-lg font-medium text-gray-900">
                Where Ideas Happen
              </p>
              <p>
                Collab Unity is revolutionizing professional development by creating a platform where individuals 
                <strong> show, not tell</strong> their capabilities. We connect students, young professionals, and seasoned 
                experts through meaningful collaborative projects that build real-world experience, demonstrable skills, 
                and professional portfolios that stand out to employers and industry leaders.
              </p>
            </CardContent>
          </Card>

          {/* The Problem */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Target className="w-6 h-6 mr-3 text-purple-600" />
                The Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">The Problem</h3>
                <p>
                  Students and young professionals face unprecedented challenges entering the workforce. Economic 
                  uncertainties—from the 2008 recession to the COVID-19 pandemic—have proven that traditional networking 
                  and application methods are insufficient. The average person changes careers 3-7 times in their lifetime, 
                  yet most struggle to demonstrate their true capabilities through resumes alone. Research shows that 64% 
                  of business leaders prioritize retraining current workforce to fill skill gaps, while one-third of workers 
                  seriously consider quitting their jobs every quarter due to lack of growth opportunities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Our Solution</h3>
                <p>
                  Collab Unity provides a professional project collaboration platform where users gain hands-on experience, 
                  build comprehensive portfolios, and connect with a global network of professionals. Unlike LinkedIn's 
                  job-posting focus or freelance platforms' transactional nature, we offer structured workflows, AI-powered 
                  project assistance, integrated development environments, real-time collaboration tools, and educational 
                  resources that transform ideas into reality while building demonstrable skills.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Market Opportunity */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <Users className="w-6 h-6 mr-3 text-purple-600" />
                Target Market
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <p>
                Our platform serves a diverse ecosystem of users and organizations:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-1">Students & Young Professionals</h4>
                  <p className="text-sm">Ages 18-25 seeking to build skills, portfolios, and stand out to employers</p>
                  <p className="text-xs text-purple-600 mt-2">Market: ~25 million individuals</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Educational Institutions</h4>
                  <p className="text-sm">High schools and universities seeking real-world learning platforms</p>
                  <p className="text-xs text-blue-600 mt-2">Market: ~35 million students</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-1">Seasoned Professionals</h4>
                  <p className="text-sm">Established workforce members exploring new skills and collaboration</p>
                  <p className="text-xs text-green-600 mt-2">Market: ~155 million professionals</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-1">Organizations</h4>
                  <p className="text-sm">Startups, businesses, nonprofits, and recruiters seeking talent</p>
                  <p className="text-xs text-orange-600 mt-2">Market: Entire workforce segment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Page Break for Print */}
          <div className="print:break-after-page"></div>

          {/* Platform Evolution & Current State */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-purple-600" />
                Platform Evolution & Current State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">From Concept to Reality (2021-2024)</h3>
                <p>
                  Founded in early 2021 by Chris Nussbaum (Product Management & UX), Chris Caudill (Software Engineering), 
                  and Finn Kelln (Business & Finance), Collab Unity evolved from an initial concept for freelance collaboration 
                  into a comprehensive professional development platform. The original vision—to help users "show, not tell" 
                  their skills—remains our core philosophy.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2024-2025: Advanced Platform Features</h3>
                <p>
                  Today, Collab Unity offers a sophisticated suite of collaboration tools including:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                  <li><strong>Integrated Project Workspaces:</strong> Real-time discussion boards, task management, asset versioning, and collaborative ideation tools</li>
                  <li><strong>Code Playgrounds:</strong> Built-in IDEs for web development with live preview and version control</li>
                  <li><strong>AI Project Assistant:</strong> Intelligent task generation, learning resource recommendations, and contextual search</li>
                  <li><strong>Rich User Profiles:</strong> Portfolio showcases, skill endorsements, peer reviews, and PDF resume generation</li>
                  <li><strong>Advanced Discovery:</strong> AI-powered matching algorithms connecting users with relevant projects and collaborators</li>
                  <li><strong>Social Feed:</strong> Project updates, status posts, and community engagement with integrated advertising</li>
                  <li><strong>Real-time Communication:</strong> Direct messaging, team discussions, and collaborative presence indicators</li>
                  <li><strong>Project Templates:</strong> Pre-structured guides with phases, deliverables, and best practices</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Competitive Advantages */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Why Collab Unity Wins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">vs. LinkedIn</h4>
                  <p className="text-sm">
                    Beyond job postings and networking—we provide the workspace, tools, and structure to actually 
                    <em> do the work</em> that builds your portfolio, not just list past achievements.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">vs. Freelance Platforms</h4>
                  <p className="text-sm">
                    We emphasize collaborative learning and skill development, not just transactional gig work. 
                    Users build relationships and portfolios, not just complete one-off tasks.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">vs. Social Networks</h4>
                  <p className="text-sm">
                    Professional environment designed for meaningful work, not casual social interaction. 
                    Every feature serves career development and project success.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">vs. FindCollabs</h4>
                  <p className="text-sm">
                    Beyond coding hackathons—we support all project types across industries with comprehensive 
                    tools for planning, execution, and showcase.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200 mt-4">
                <p className="font-semibold text-purple-900 mb-2">Our Unique Value Proposition:</p>
                <p className="text-sm text-purple-800">
                  Collab Unity is the only platform that combines professional networking, project collaboration tools, 
                  skill development resources, and portfolio building in one integrated ecosystem—all designed to help 
                  users prove their value through action, not just words.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Model & Revenue */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Business Model & Growth Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Revenue Streams</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-medium">Contextual Advertising</p>
                      <p className="text-xs text-gray-600">Targeted ads integrated into feed and project pages</p>
                    </div>
                    <span className="text-purple-600 font-semibold">Primary</span>
                  </div>
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <p className="font-medium">Premium Subscriptions</p>
                      <p className="text-xs text-gray-600">Ad-free experience and enhanced features ($5/month)</p>
                    </div>
                    <span className="text-purple-600 font-semibold">Growing</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Enterprise Partnerships</p>
                      <p className="text-xs text-gray-600">Custom solutions for universities and businesses</p>
                    </div>
                    <span className="text-purple-600 font-semibold">Future</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Strategic Partnerships</h3>
                <p className="text-sm">
                  Rather than compete, we aim to partner with industry leaders. Future integration opportunities with 
                  LinkedIn (professional credentials), GitHub (code repositories), educational platforms, and recruiting 
                  firms will expand our reach and value proposition while maintaining our unique focus on collaborative 
                  project execution.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Technology Infrastructure</h3>
                <p className="text-sm">
                  Built on modern web technologies (React, Base44 Backend-as-a-Service) with cloud-based infrastructure 
                  ensuring scalability, reliability, and minimal operational overhead. No physical office required—fully 
                  remote operation keeps costs low while serving a global user base 24/7.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Growth Trajectory */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Growth Trajectory & Future Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2025-2026: Platform Maturation</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>
                    <strong>User Acquisition:</strong> Aggressive digital marketing through Google Ads, social media, 
                    and university partnerships targeting 100,000+ active users by end of 2026
                  </li>
                  <li>
                    <strong>Feature Enhancement:</strong> Advanced AI recommendations, video collaboration, mobile apps, 
                    and enhanced workspace tools based on user feedback
                  </li>
                  <li>
                    <strong>Monetization Optimization:</strong> Refined advertising algorithms, premium tier expansion, 
                    and pilot enterprise programs with universities
                  </li>
                  <li>
                    <strong>Community Building:</strong> Curated project templates, mentorship programs, success stories, 
                    and recognition systems to drive engagement
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2027-2028: Scale & Partnerships</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>
                    <strong>Educational Integration:</strong> Formal partnerships with universities and coding bootcamps 
                    to integrate Collab Unity into curricula as a capstone project platform
                  </li>
                  <li>
                    <strong>Recruiter Network:</strong> Verified employer accounts with direct access to project portfolios, 
                    creating a new channel for talent discovery beyond traditional resumes
                  </li>
                  <li>
                    <strong>Geographic Expansion:</strong> International user growth with localized content, regional 
                    communities, and cross-border collaboration features
                  </li>
                  <li>
                    <strong>API & Integrations:</strong> Public API allowing integration with LinkedIn, GitHub, Behance, 
                    and other professional platforms to create a unified career presence
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Long-term Vision (2029+)</h3>
                <p className="text-sm">
                  Establish Collab Unity as the <strong>definitive platform for professional development through 
                  collaborative work</strong>. Partner with major employers to recognize Collab Unity project portfolios 
                  as equivalent to traditional work experience. Expand into corporate team collaboration, enabling 
                  distributed teams to work on internal projects using our proven tools and workflows. Explore acquisition 
                  opportunities or strategic investments to accelerate growth while maintaining our mission-driven focus.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Financial Outlook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Original Projections (2022-2024)</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-xs text-gray-600">Year 1 (2022)</p>
                      <p className="font-bold text-lg text-gray-900">$40,232</p>
                      <p className="text-xs text-green-600">36% profit margin</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Year 2 (2023)</p>
                      <p className="font-bold text-lg text-gray-900">$81,100</p>
                      <p className="text-xs text-green-600">38% profit margin</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Year 3 (2024)</p>
                      <p className="font-bold text-lg text-gray-900">$152,500</p>
                      <p className="text-xs text-green-600">8% profit margin</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Revised Strategy (2025+)</h3>
                <p className="text-sm">
                  <strong>Cost Structure:</strong> Platform migration to modern infrastructure reduced operational costs 
                  while improving performance and scalability. Marketing focus shifted to organic growth through content 
                  marketing, community building, and strategic partnerships, reducing customer acquisition costs.
                </p>
                <p className="text-sm mt-2">
                  <strong>Investment Priorities:</strong> User experience enhancement, AI/ML capabilities, mobile development, 
                  and strategic hires in product management and developer relations. Founders continue reinvesting profits 
                  for accelerated growth while maintaining lean operations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Path to Profitability</h3>
                <p className="text-sm">
                  With organic user growth, optimized infrastructure, and diversified revenue streams, Collab Unity is 
                  positioned for sustainable profitability by 2026. Key metrics: user engagement (projects created, 
                  collaboration hours), retention rates, advertising CTR, premium conversion, and employer partnership growth.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Competitive Positioning */}
          <Card className="cu-card print:break-inside-avoid">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Market Position & Differentiation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">The Collab Unity Advantage</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Holistic Collaboration Environment:</strong> Unlike platforms that focus on single aspects 
                      (networking, portfolios, or gig work), we provide end-to-end project execution tools—from ideation 
                      to launch—all in one place.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Learning-First Philosophy:</strong> Safe environment to experiment, fail, and grow. Projects 
                      aren't just deliverables—they're educational experiences with built-in guidance and resources.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Demonstrable Results:</strong> Employers see actual work products, collaboration history, 
                      peer reviews, and skill application—far more credible than self-reported resume bullets.
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Recession-Resistant Model:</strong> Digital-first, no physical infrastructure, and provides 
                      value regardless of economic conditions—when jobs are scarce, skill-building becomes more critical.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="cu-card border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 print:break-inside-avoid">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">The Future of Professional Development</h3>
              <p className="text-gray-700 mb-4">
                Collab Unity represents a paradigm shift in how people build careers, develop skills, and prove their 
                value to the world. By providing the tools, community, and structure for meaningful collaborative work, 
                we're creating a platform where <strong>no idea is too small and limitations don't exist</strong>.
              </p>
              <p className="text-sm text-gray-600 italic">
                "We believe that the best way to predict your future is to create it—together."
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-12 print:mt-8 pb-8">
            <p>For more information or partnership inquiries:</p>
            <p className="font-medium text-gray-700 mt-1">collabunity@collabunity.io</p>
            <p className="mt-4 text-xs">© 2024 Collab Unity. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}