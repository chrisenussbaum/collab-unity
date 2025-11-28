
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lightbulb, Users, Code, Heart, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const navigate = useNavigate();

  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  const values = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We believe in the power of creative ideas and collaborative innovation to solve real-world problems."
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a supportive, inclusive community where everyone can contribute and grow together."
    },
    {
      icon: Code,
      title: "Learning",
      description: "Fostering continuous learning through hands-on project experience and peer collaboration."
    },
    {
      icon: Heart,
      title: "Passion",
      description: "Empowering people to work on projects they're truly passionate about with like-minded collaborators."
    }
  ];

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
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={handleAuth}
                className="text-gray-700 hover:text-purple-600"
              >
                Log In
              </Button>
              <Button
                onClick={handleAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">About Collab Unity</h1>
                <p className="text-gray-600">Where Ideas Happen</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="cu-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-purple-600" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700">
                <p className="text-lg leading-relaxed">
                  Collab Unity is a project-oriented collaboration platform designed to bring creators, 
                  learners, and innovators together. We believe that the best projects happen when 
                  passionate people unite around a shared vision.
                </p>
                <p className="leading-relaxed">
                  Our platform provides all the tools you need to find collaborators, manage projects, 
                  and bring your ideas to life—whether you're building a startup, learning new skills, 
                  working on a hobby project, or creating something for social good.
                </p>
                <p className="leading-relaxed">
                  We're committed to making collaboration accessible, efficient, and enjoyable for 
                  everyone, regardless of their background or experience level.
                </p>
              </CardContent>
            </Card>

            <Card className="cu-card mb-6">
              <CardHeader>
                <CardTitle>Our Core Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {values.map((value, index) => {
                    const Icon = value.icon;
                    return (
                      <motion.div
                        key={value.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-start space-x-4"
                      >
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{value.title}</h3>
                          <p className="text-sm text-gray-600">{value.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="cu-card mb-6">
              <CardHeader>
                <CardTitle>What Makes Us Different</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-purple-600 mt-1">1</Badge>
                    <div>
                      <h4 className="font-semibold mb-1">Project-First Approach</h4>
                      <p className="text-sm">Everything revolves around bringing your projects to life, not just networking.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-purple-600 mt-1">2</Badge>
                    <div>
                      <h4 className="font-semibold mb-1">Built-in Tools</h4>
                      <p className="text-sm">Integrated IDEs, task management, file sharing, and communication—all in one place.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-purple-600 mt-1">3</Badge>
                    <div>
                      <h4 className="font-semibold mb-1">Learning-Focused</h4>
                      <p className="text-sm">Grow your skills through hands-on collaboration with talented peers and curated resources.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge className="bg-purple-600 mt-1">4</Badge>
                    <div>
                      <h4 className="font-semibold mb-1">Free & Open</h4>
                      <p className="text-sm">Core features are free forever. We believe great collaboration shouldn't have a price tag.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cu-card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to start collaborating?
                </h3>
                <p className="text-gray-700 mb-6 max-w-xl mx-auto">
                  Join hundreds of creators building amazing projects together. 
                  Whether you have an idea or want to contribute to existing projects, Collab Unity is the place to be.
                </p>
                <Button onClick={handleAuth} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Started Now
                </Button>
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
              <Link to={createPageUrl("About")} className="hover:text-white transition-colors">
                About
              </Link>
              <Link to={createPageUrl("Demos")} className="hover:text-white transition-colors">
                Demos
              </Link>
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
