
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Rocket,
  Settings,
  Award,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectInstructions({ instructions, isOwner, onEditClick }) {
  const [expandedSections, setExpandedSections] = useState({
    planning: false, // Changed from true to false
    execution: false,
    delivery: false,
    challenges: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!instructions) {
    return null;
  }

  const {
    overview,
    planning_phase,
    execution_phase,
    delivery_phase,
    success_criteria,
    common_challenges,
  } = instructions;
  
  const phaseIcons = {
    planning: Settings,
    execution: Rocket,
    delivery: Award
  };

  const phases = [
    { key: 'planning', data: planning_phase, color: 'blue' },
    { key: 'execution', data: execution_phase, color: 'purple' },
    { key: 'delivery', data: delivery_phase, color: 'green' }
  ];

  const colorClasses = {
    blue: { 
      bg: 'bg-blue-50', 
      border: 'border-blue-200', 
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800'
    },
    purple: { 
      bg: 'bg-purple-50', 
      border: 'border-purple-200', 
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800'
    },
    green: { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      text: 'text-green-900',
      badge: 'bg-green-100 text-green-800'
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="cu-card border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-purple-900">
              <BookOpen className="w-5 h-5" />
              <span>Project Instructions</span>
            </CardTitle>
            {isOwner && onEditClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Instructions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {overview}
          </p>
        </CardContent>
      </Card>

      {/* Project Phases */}
      <div className="space-y-4">
        {phases.map((phase, index) => {
          if (!phase.data) return null;
          
          const Icon = phaseIcons[phase.key];
          const colors = colorClasses[phase.color];

          return (
            <motion.div
              key={phase.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Collapsible
                open={expandedSections[phase.key]}
                onOpenChange={() => toggleSection(phase.key)}
              >
                <Card className={`cu-card ${colors.border} ${colors.bg}`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-opacity-80 transition-colors">
                      <CardTitle className={`flex items-center justify-between ${colors.text}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${colors.badge} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span>{phase.data.title}</span>
                          <Badge className={colors.badge}>
                            Phase {index + 1}
                          </Badge>
                        </div>
                        {expandedSections[phase.key] ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-gray-700 mb-4">
                        {phase.data.description}
                      </p>
                      
                      {phase.data.steps && phase.data.steps.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">How to Proceed:</h4>
                          <ul className="space-y-2">
                            {phase.data.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start space-x-2">
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                                  <span className="text-xs font-medium text-gray-600">
                                    {stepIndex + 1}
                                  </span>
                                </div>
                                <span className="text-gray-700 text-sm">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {phase.data.deliverables && phase.data.deliverables.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            Expected Outcomes:
                          </h4>
                          <ul className="space-y-1">
                            {phase.data.deliverables.map((deliverable, delIndex) => (
                              <li key={delIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span>{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </motion.div>
          );
        })}
      </div>

      {/* Success Criteria */}
      {success_criteria && success_criteria.length > 0 && (
        <Card className="cu-card border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-900">
              <Award className="w-5 h-5" />
              <span>Success Criteria</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-3">
              Your project will be considered successfully completed when you achieve:
            </p>
            <ul className="space-y-2">
              {success_criteria.map((criteria, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-800 text-sm">{criteria}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Common Challenges */}
      {common_challenges && common_challenges.length > 0 && (
        <Collapsible
          open={expandedSections.challenges}
          onOpenChange={() => toggleSection('challenges')}
        >
          <Card className="cu-card border-yellow-200 bg-yellow-50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-opacity-80 transition-colors">
                <CardTitle className="flex items-center justify-between text-yellow-900">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Common Challenges & Solutions</span>
                  </div>
                  {expandedSections.challenges ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {common_challenges.map((item, index) => (
                    <div key={index} className="border-l-4 border-yellow-400 pl-4">
                      <h4 className="font-medium text-yellow-900 mb-1">
                        {item.challenge}
                      </h4>
                      <p className="text-sm text-yellow-800">
                        {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
