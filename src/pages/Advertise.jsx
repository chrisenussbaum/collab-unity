import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Building, Heart, GraduationCap, User, ArrowRight, ShieldCheck, CheckCircle, Sparkles, Target, TrendingUp, Megaphone } from 'lucide-react';

const promotionCategories = [
  {
    icon: Building,
    title: "For Businesses",
    description: "Reach a targeted audience of innovators, tech talent, and potential partners. Showcase your brand, products, and services to the right collaborators.",
    cta: "Promote Your Business",
    color: "purple",
    benefits: ["Targeted Reach", "Brand Visibility", "Lead Generation"]
  },
  {
    icon: Heart,
    title: "For Nonprofits",
    description: "Amplify your cause, recruit skilled volunteers, and connect with individuals passionate about making a difference in the community.",
    cta: "Share Your Mission",
    color: "pink",
    benefits: ["Volunteer Recruitment", "Community Engagement", "Mission Awareness"]
  },
  {
    icon: GraduationCap,
    title: "For Education",
    description: "Attract prospective students, showcase campus projects, and build bridges with industry leaders for research and career opportunities.",
    cta: "Showcase Your Institution",
    color: "blue",
    benefits: ["Student Recruitment", "Industry Partnerships", "Research Collaboration"]
  },
  {
    icon: User,
    title: "For Collaborators",
    description: "Promote your personal brand, highlight your unique skills, and attract exciting project opportunities. Stand out from the crowd.",
    cta: "Boost Your Profile",
    color: "indigo",
    benefits: ["Personal Branding", "Project Opportunities", "Network Growth"]
  }
];

const colorSchemes = {
  purple: { 
    bg: "bg-purple-50", 
    text: "text-purple-800", 
    button: "bg-purple-600 hover:bg-purple-700",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "bg-purple-600"
  },
  pink: { 
    bg: "bg-pink-50", 
    text: "text-pink-800", 
    button: "bg-pink-600 hover:bg-pink-700",
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    icon: "bg-pink-600"
  },
  blue: { 
    bg: "bg-blue-50", 
    text: "text-blue-800", 
    button: "bg-blue-600 hover:bg-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "bg-blue-600"
  },
  indigo: { 
    bg: "bg-indigo-50", 
    text: "text-indigo-800", 
    button: "bg-indigo-600 hover:bg-indigo-700",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "bg-indigo-600"
  }
};

export default function Advertise() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 py-12 sm:py-16 md:py-20 -mt-14 pt-24 sm:-mt-16 sm:pt-28 md:-mt-20 md:pt-32">
        <div className="cu-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Megaphone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Amplify Your Reach
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
              Connect with a vibrant community of creators, innovators, and leaders on Collab Unity.
            </p>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm font-semibold">
              Simple Process
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">A streamlined, secure process that ensures trustworthy and effective promotions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Select Your Category", desc: "Choose the promotion type that best fits your goals.", icon: Target },
              { step: 2, title: "Create Your Ad", desc: "Design a compelling ad with our easy-to-use tools.", icon: Megaphone },
              { step: 3, title: "Get Verified & Go Live", desc: "Quick security check to ensure community safety.", icon: ShieldCheck }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative mb-6">
                    <div className="flex items-center justify-center w-20 h-20 cu-gradient text-white rounded-2xl shadow-lg">
                      <Icon className="w-10 h-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Promotion Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm font-semibold">
            Choose Your Path
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Promotion Categories</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Select the category that best represents your goals and audience.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {promotionCategories.map((cat, index) => {
            const Icon = cat.icon;
            const colors = colorSchemes[cat.color];
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex"
              >
                <Card className={`cu-card flex flex-col w-full ${colors.bg} border-2 hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 rounded-xl ${colors.icon} shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <CardTitle className={`text-2xl ${colors.text}`}>{cat.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow pt-0">
                    <p className="text-gray-700 leading-relaxed mb-6">{cat.description}</p>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
                        Key Benefits
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {cat.benefits.map((benefit, idx) => (
                          <Badge key={idx} className={`${colors.badge} border px-3 py-1`}>
                            <CheckCircle className="w-3 h-3 mr-1.5" />
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Link 
                      to={createPageUrl(`CreateAd?type=${cat.color === 'purple' ? 'business' : cat.color === 'pink' ? 'nonprofit' : cat.color === 'blue' ? 'education' : 'collaborator'}`)} 
                      className="mt-auto"
                    >
                      <Button className={`w-full ${colors.button} text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200`}>
                        {cat.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}