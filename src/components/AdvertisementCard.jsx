import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdvertisementCard({ ad }) {
  if (!ad) return null;

  const isInternalProjectLink = ad.cta_link && ad.cta_link.includes('/ProjectDetail?id=');

  const CtaButton = ({ className }) => (
    <Button className={className}>
      {ad.cta_text}
      <ArrowRight className="cu-icon-sm ml-1 sm:ml-2" />
    </Button>
  );

  const CtaWrapper = ({ children }) => {
    if (isInternalProjectLink) {
      let path = ad.cta_link;
      try {
        const url = new URL(ad.cta_link, window.location.origin);
        path = url.pathname + url.search;
      } catch (e) {
        console.warn("Could not parse internal ad link, falling back:", ad.cta_link);
      }
      return <Link to={path}>{children}</Link>;
    } else {
      return (
        <a href={ad.cta_link} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="cu-card overflow-hidden group">
        {/* Mobile & Tablet Layout - Now Centered Like Desktop */}
        <div className="block xl:hidden">
          <div className="relative">
            {ad.image_url && (
              <div className="w-full h-32 sm:h-36 md:h-40 overflow-hidden bg-gray-100">
                <img 
                  src={ad.image_url} 
                  alt={ad.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              </div>
            )}
            <Badge className="absolute top-2 right-2 cu-text-responsive-xs bg-black/60 text-white border-0">
              Ad
            </Badge>
            
            {/* Centered Logo - Positioned absolutely between banner and content */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 sm:-bottom-7 md:-bottom-8">
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-3 sm:border-4 border-white shadow-lg">
                <AvatarImage 
                  src={ad.advertiser_logo_url} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-sm sm:text-base md:text-lg font-semibold">
                  {ad.advertiser_name?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <CardContent className="p-3 sm:p-4 pt-8 sm:pt-10 md:pt-12">
            <div className="text-center mb-2 sm:mb-3">
              <span className="font-semibold cu-text-responsive-xs sm:cu-text-responsive-sm text-gray-800">
                {ad.advertiser_name}
              </span>
            </div>
            
            <h4 className="font-bold text-gray-900 mb-2 leading-tight cu-text-responsive-sm text-center">
              {ad.title}
            </h4>
            
            <p className="cu-text-responsive-xs text-gray-600 mb-3 sm:mb-4 line-clamp-2 text-center">
              {ad.description}
            </p>
            
            <div className="flex justify-center">
              <CtaWrapper>
                <CtaButton className="cu-button cu-text-responsive-xs" />
              </CtaWrapper>
            </div>
          </CardContent>
        </div>

        {/* Desktop Layout - Fixed and Consistent */}
        <div className="hidden xl:block">
          <div className="relative">
            {ad.image_url && (
              <div className="w-full h-40 overflow-hidden bg-gray-100">
                <img 
                  src={ad.image_url} 
                  alt={ad.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
              </div>
            )}
            <Badge className="absolute top-2 right-2 cu-text-responsive-xs bg-black/60 text-white border-0">
              Ad
            </Badge>
            
            {/* Centered Logo - Positioned absolutely between banner and content */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-8">
              <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={ad.advertiser_logo_url} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-lg font-semibold">
                  {ad.advertiser_name?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          <CardContent className="p-4 pt-12">
            <div className="text-center mb-3">
              <span className="font-semibold cu-text-responsive-sm text-gray-800">{ad.advertiser_name}</span>
            </div>
            
            <h4 className="font-bold text-gray-900 mb-2 leading-tight cu-text-responsive-base text-center">
              {ad.title}
            </h4>
            
            <p className="cu-text-responsive-xs text-gray-600 mb-4 line-clamp-2 text-center">
              {ad.description}
            </p>
            
            <div className="flex justify-center">
              <CtaWrapper>
                <CtaButton className="cu-button w-full" />
              </CtaWrapper>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}