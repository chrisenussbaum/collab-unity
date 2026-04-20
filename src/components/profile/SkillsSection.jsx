import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Plus, X, Edit } from "lucide-react";

export default function SkillsSection({
  skills, skillEndorsements, isOwner, propCurrentUser, profileUser,
  isLoadingEndorsements, onEdit, setSelectedSkillToEndorse, setShowEndorseDialog,
}) {
  const getEndorsementCount = (skill) => skillEndorsements.filter(e => e.skill === skill).length;
  const hasEndorsedSkill = (skill) => propCurrentUser && skillEndorsements.some(e => e.skill === skill && e.endorser_email === propCurrentUser.email);

  if (!skills || skills.length === 0) {
    if (!isOwner) return null;
    return (
      <Card className="cu-card border-dashed border-2 border-purple-200 bg-purple-50/30">
        <CardContent className="p-6 text-center">
          <Wrench className="w-8 h-8 mx-auto mb-3 text-purple-400" />
          <p className="text-sm text-gray-600 mb-3">Showcase your skills to potential collaborators</p>
          <Button variant="outline" size="sm" onClick={onEdit} className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" />Add Skills
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cu-card">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />Skills
          </CardTitle>
          {isOwner && (
            <Button variant="ghost" size="icon" onClick={onEdit} className="text-gray-500 hover:text-purple-600">
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoadingEndorsements ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            <span className="ml-3 text-sm text-gray-500">Loading skills...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => {
              const count = getEndorsementCount(skill);
              const endorsed = hasEndorsedSkill(skill);
              return (
                <div key={skill} className="relative group">
                  <Badge
                    className={`pr-8 cursor-pointer transition-all duration-200 ${count > 0 ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-md hover:shadow-lg ring-2 ring-purple-200' : endorsed ? 'bg-purple-600 text-white' : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200 hover:shadow-md'}`}
                    onClick={() => { if (!isOwner && propCurrentUser) { setSelectedSkillToEndorse(skill); setShowEndorseDialog(true); } }}
                  >
                    <div className="flex items-center gap-1.5">
                      {skill}
                      {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${count > 0 ? 'bg-white/30 text-white' : 'bg-purple-200 text-purple-800'}`}>{count}</span>}
                    </div>
                  </Badge>
                  {!isOwner && propCurrentUser && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSkillToEndorse(skill); setShowEndorseDialog(true); }}
                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${endorsed ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white border-2 border-purple-300 text-purple-600 opacity-0 group-hover:opacity-100 hover:bg-purple-50'}`}
                      title={endorsed ? 'Remove endorsement' : 'Endorse this skill'}
                    >
                      {endorsed ? <X size={12} /> : <Plus size={12} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!isOwner && propCurrentUser && skills.length > 0 && (
          <p className="text-xs text-gray-500 mt-3 text-center">Click on a skill to endorse {profileUser?.full_name || 'them'}</p>
        )}
        {skillEndorsements.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">✨ Skills with a glow have been endorsed by the community</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}