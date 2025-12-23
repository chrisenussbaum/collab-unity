import React from "react";
import PublicPageLayout from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Zap, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Support() {
  const handleVenmoRedirect = () => {
    window.open('https://venmo.com/chrisenussbaum', '_blank', 'noopener,noreferrer');
  };

  return (
    <PublicPageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Heart className="w-10 h-10 text-white" />
            </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Support Collab Unity
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Help us build a platform where collaboration thrives and ideas become reality
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <Card className="cu-card border-2 border-purple-200">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl sm:text-3xl font-bold mb-3">
                  Your Support Makes a Difference
                </CardTitle>
                <CardDescription className="text-base">
                  Every contribution helps us improve the platform and create a better experience for everyone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Platform Development</h3>
                    <p className="text-sm text-gray-600">
                      Fund new features, bug fixes, and performance improvements
                    </p>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Community Growth</h3>
                    <p className="text-sm text-gray-600">
                      Help us reach more creators and build a stronger community
                    </p>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl">
                    <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Free For Everyone</h3>
                    <p className="text-sm text-gray-600">
                      Keep Collab Unity free and accessible to all creators
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white text-center mt-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">Ready to Support?</h3>
                  <p className="mb-6 text-sm sm:text-base text-purple-100">
                    Your contribution of any amount helps keep Collab Unity running and improving
                  </p>
                  <Button
                    onClick={handleVenmoRedirect}
                    className="bg-white text-purple-600 hover:bg-gray-100 font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto w-full sm:w-auto"
                    size="lg"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Donate via Venmo
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-purple-200 mt-4">@chrisenussbaum</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Note:</strong> Collab Unity is an independent project created to help people collaborate and bring ideas to life.
                  </p>
                  <p className="text-sm text-gray-600">
                    Your support goes directly toward server costs, development, and making this platform the best it can be. Thank you!
                  </p>
                </div>
              </CardContent>
            </Card>
        </motion.div>
      </div>
    </PublicPageLayout>
  );
}