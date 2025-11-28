import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HorizontalScrollContainer({ 
  children, 
  className = "",
  showArrows = true,
  arrowClassName = ""
}) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    setCanScrollLeft(scrollLeft > 5); // Small threshold to avoid flickering
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      // Check again after a short delay to ensure content is loaded
      const timer = setTimeout(checkScrollability, 100);
      
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
        clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    // Recheck scrollability when children change
    const timer = setTimeout(checkScrollability, 100);
    return () => clearTimeout(timer);
  }, [children]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full h-10 w-10 ${arrowClassName}`}
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className={`overflow-x-auto scrollbar-hide scroll-smooth ${className}`}
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
        }}
      >
        <div className="flex space-x-3 md:space-x-4">
          {children}
        </div>
      </div>

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 hover:bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full h-10 w-10 ${arrowClassName}`}
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}