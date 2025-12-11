import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Settings,
  Code,
  Rocket,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";

export default function ProjectGuide({ project, isOwner, onEditClick }) {
  const [expandedSections, setExpandedSections] = useState({
    setup: false,
    development: false,
    launch: false,
    success: false,
    challenges: false,
  });

  if (!project.project_instructions) {
    return null;
  }

  const instructions = project.project_instructions;

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const phaseConfig = {
    setup: {
      icon: Settings,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    development: {
      icon: Code,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    launch: {
      icon: Rocket,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  };

  return (
    <Card className="cu-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
            Project Guide
          </CardTitle>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditClick}
              className="text-xs"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {instructions.overview && (
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {instructions.overview}
          </p>
        )}

        {/* Phase Sections */}
        {["setup", "development", "launch"].map((phaseKey) => {
          const phase = instructions[`${phaseKey}_phase`];
          if (!phase) return null;

          const config = phaseConfig[phaseKey];
          const Icon = config.icon;
          const isExpanded = expandedSections[phaseKey];

          return (
            <Card
              key={phaseKey}
              className={`border-2 ${config.borderColor} ${config.bgColor}`}
            >
              <CardHeader
                onClick={() => toggleSection(phaseKey)}
                className="cursor-pointer flex flex-row items-center justify-between p-4 hover:opacity-80 transition-opacity"
              >
                <CardTitle className={`text-sm sm:text-base font-semibold flex items-center ${config.color}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {phase.title}
                </CardTitle>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                )}
              </CardHeader>
              {isExpanded && (
                <CardContent className="px-4 pb-4 space-y-3">
                  {phase.description && (
                    <p className="text-sm text-gray-600">{phase.description}</p>
                  )}
                  {phase.steps && phase.steps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2">
                        Steps:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700">
                        {phase.steps.map((step, i) => (
                          <li key={i} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {phase.deliverables && phase.deliverables.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-gray-900 mb-2">
                        Deliverables:
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700">
                        {phase.deliverables.map((d, i) => (
                          <li key={i} className="leading-relaxed">
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Success Criteria */}
        {instructions.success_criteria &&
          instructions.success_criteria.length > 0 && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader
                onClick={() => toggleSection("success")}
                className="cursor-pointer flex flex-row items-center justify-between p-4 hover:opacity-80 transition-opacity"
              >
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center text-green-800">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Success Criteria
                </CardTitle>
                {expandedSections.success ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                )}
              </CardHeader>
              {expandedSections.success && (
                <CardContent className="px-4 pb-4">
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-green-700">
                    {instructions.success_criteria.map((c, i) => (
                      <li key={i} className="leading-relaxed">
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

        {/* Common Challenges */}
        {instructions.common_challenges &&
          instructions.common_challenges.length > 0 && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader
                onClick={() => toggleSection("challenges")}
                className="cursor-pointer flex flex-row items-center justify-between p-4 hover:opacity-80 transition-opacity"
              >
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center text-yellow-800">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Common Challenges
                </CardTitle>
                {expandedSections.challenges ? (
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                )}
              </CardHeader>
              {expandedSections.challenges && (
                <CardContent className="px-4 pb-4 space-y-3">
                  {instructions.common_challenges.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <h4 className="font-semibold text-xs sm:text-sm text-yellow-900">
                        {c.challenge}
                      </h4>
                      <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">
                        {c.solution}
                      </p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}
      </CardContent>
    </Card>
  );
}