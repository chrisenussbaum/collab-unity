import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";

export default function ContextualTooltip({ 
  id, 
  title, 
  description, 
  position = "bottom",
  targetRef,
  onDismiss,
  delay = 1000
}) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetRef?.current) {
        const rect = targetRef.current.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
          case "bottom":
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case "top":
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
          default:
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
        }
        
        setCoords({ top, left });
        setShow(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [targetRef, position, delay]);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <div 
            className="fixed inset-0 z-[90]" 
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[91] bg-white rounded-lg shadow-2xl border border-purple-200 p-4 max-w-xs"
            style={{
              top: coords.top,
              left: coords.left,
              transform: position === "bottom" || position === "top" 
                ? "translateX(-50%)" 
                : position === "left" 
                ? "translateX(-100%) translateY(-50%)"
                : "translateY(-50%)"
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="w-3 h-3" />
            </Button>

            <div className="flex items-start gap-3 pr-6">
              <div className="w-8 h-8 cu-gradient rounded-full flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>

            <Button
              onClick={handleDismiss}
              size="sm"
              className="w-full mt-3 cu-gradient text-white"
            >
              Got it!
            </Button>

            {/* Arrow indicator */}
            <div 
              className={`absolute w-3 h-3 bg-white border-purple-200 rotate-45 ${
                position === "bottom" ? "border-t border-l -top-1.5 left-1/2 -translate-x-1/2" :
                position === "top" ? "border-b border-r -bottom-1.5 left-1/2 -translate-x-1/2" :
                position === "left" ? "border-t border-r -right-1.5 top-1/2 -translate-y-1/2" :
                "border-t border-l -left-1.5 top-1/2 -translate-y-1/2"
              }`}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}