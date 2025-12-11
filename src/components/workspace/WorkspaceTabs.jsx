import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CheckSquare, Wrench, FileStack, Activity, Lightbulb, Code } from 'lucide-react';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';
import DiscussionBoard from './DiscussionBoard';
import TaskBoard from './TaskBoard';
import ToolsHub from './ToolsHub';
import AssetsTab from './AssetsTab';

import ActivityTab from './ActivityTab';

import IdeationHub from './ideation/IdeationHub';
import IdeationToolsTab from './IdeationToolsTab';
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const WorkspaceTabs = ({ project, currentUser, projectUsers, onProjectUpdate, isCollaborator, isProjectOwner }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'discussion');
  const tabsContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const [tabPresence, setTabPresence] = useState({});
  const presenceUpdateTimerRef = useRef(null);
  const fetchPresenceIntervalRef = useRef(null);

  const projectOwnerName = project?.created_by ? 
    (projectUsers?.find(u => u.email === project.created_by)?.full_name || 
     project.created_by.split('@')[0] || 
     "The project owner") : "The project owner";

  // Initialize from URL only once
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
      updateTabPresence(tabFromUrl);
    }
  }, []); // Empty array - only on mount

  // Fetch tab presence for all users
  const fetchTabPresence = async () => {
    if (!project?.id || !currentUser) return;

    try {
      const allPresence = await base44.entities.ProjectPresence.filter({
        project_id: project.id
      });

      const now = new Date();
      const presenceByTab = {};

      allPresence.forEach(p => {
        if (p.user_email === currentUser.email) return; // Skip current user
        
        const lastActive = new Date(p.last_active);
        const secondsSinceActive = (now - lastActive) / 1000;
        
        // Only show users active in last 60 seconds
        if (secondsSinceActive < 60 && p.viewing_section) {
          if (!presenceByTab[p.viewing_section]) {
            presenceByTab[p.viewing_section] = [];
          }
          presenceByTab[p.viewing_section].push(p);
        }
      });

      setTabPresence(presenceByTab);
    } catch (error) {
      console.warn('Failed to fetch tab presence:', error);
    }
  };

  // Poll for tab presence updates
  useEffect(() => {
    if (!currentUser || !project?.id) return;

    fetchTabPresence(); // Initial fetch
    fetchPresenceIntervalRef.current = setInterval(fetchTabPresence, 20000); // Poll every 20 seconds

    return () => {
      if (fetchPresenceIntervalRef.current) {
        clearInterval(fetchPresenceIntervalRef.current);
      }
    };
  }, [currentUser, project?.id]);

  // Update current user's tab presence
  const updateTabPresence = async (tabValue) => {
    if (!currentUser || !project?.id) return;

    try {
      const existingPresence = await base44.entities.ProjectPresence.filter({
        project_id: project.id,
        user_email: currentUser.email
      });

      if (existingPresence && existingPresence.length > 0) {
        await base44.entities.ProjectPresence.update(existingPresence[0].id, {
          viewing_section: tabValue,
          last_active: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Failed to update tab presence:', error);
    }
  };

  const handleTabChange = (value) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;
    
    // Update local state immediately
    setActiveTab(value);
    
    // Update tab presence
    updateTabPresence(value);
    
    // Update URL without navigation
    const currentProjectId = searchParams.get('id');
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('id', currentProjectId);
    newSearchParams.set('tab', value);
    
    // Use history.replaceState directly to avoid any navigation
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    window.history.replaceState({ ...window.history.state, scroll: scrollPositionRef.current }, '', newUrl);
    
    // Prevent scroll jump by maintaining position
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  };
  
  const tabsConfig = [
    { value: "discussion", icon: MessageSquare, label: "Discussion", title: "Project discussion and comments" },
    { value: "ideate", icon: Lightbulb, label: "Ideate", title: "Plan and brainstorm project steps" },
    { value: "tasks", icon: CheckSquare, label: "Tasks", title: "Manage project tasks and assignments" },
    { value: "tools", icon: Wrench, label: "Tools", title: "Project tools and integrations" },
    { value: "assets", icon: FileStack, label: "Assets", title: "Manage project files, assets, and links" },

    { value: "ides", icon: Code, label: "IDEs", title: "Access integrated development environments for your project" },

    { value: "activity", icon: Activity, label: "Activity", title: "Project activity timeline and history" },
  ];

  const renderTabs = () => tabsConfig.map((tab) => {
    const usersInTab = tabPresence[tab.value] || [];
    const hasActiveUsers = usersInTab.length > 0;
    const primaryUser = usersInTab[0];

    return (
      <div key={tab.value} className="relative flex-shrink-0">
        <TabsTrigger 
          value={tab.value} 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/80 min-w-fit relative"
          title={tab.title}
          style={hasActiveUsers ? {
            borderBottom: `3px solid ${primaryUser.color}`,
            paddingBottom: '5px'
          } : {}}
        >
          <tab.icon className="w-4 h-4 mr-1 sm:mr-2"/>
          <span className="truncate">{tab.label}</span>
        </TabsTrigger>
        
        {hasActiveUsers && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <div 
              className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-md flex items-center space-x-1"
              style={{ backgroundColor: primaryUser.color }}
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={primaryUser.user_avatar} />
                <AvatarFallback className="text-[8px]">
                  {primaryUser.user_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{primaryUser.user_name.split('@')[0]}</span>
              {usersInTab.length > 1 && (
                <span className="text-white/80">+{usersInTab.length - 1}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="w-full" ref={tabsContainerRef}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="mb-6 pb-8">
          {/* Mobile: Horizontal scroll */}
          <div className="block lg:hidden">
            <HorizontalScrollContainer 
              className="w-full bg-gray-100 rounded-lg p-1"
              showArrows={true}
              arrowClassName="hidden sm:flex"
            >
              <TabsList className="flex h-auto p-0 bg-transparent">
                {renderTabs()}
              </TabsList>
            </HorizontalScrollContainer>
          </div>
          
          {/* Desktop: Full width horizontally stretched tabs */}
          <div className="hidden lg:block">
            <TabsList className="w-full inline-flex h-10 items-center justify-start rounded-lg bg-gray-100 p-1 text-muted-foreground">
              {renderTabs()}
            </TabsList>
          </div>
        </div>
        
        <div className="w-full">
          <TabsContent value="discussion" className="mt-0" forceMount={activeTab === "discussion"}>
            {activeTab === "discussion" && (
              <div className="w-full max-w-none">
                <DiscussionBoard 
                  project={project} 
                  currentUser={currentUser} 
                  onProjectUpdate={onProjectUpdate} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="ideate" className="mt-0" forceMount={activeTab === "ideate"}>
            {activeTab === "ideate" && (
              <div className="w-full max-w-none">
                <IdeationHub 
                  project={project} 
                  currentUser={currentUser} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-0" forceMount={activeTab === "tasks"}>
            {activeTab === "tasks" && (
              <div className="w-full max-w-none">
                <TaskBoard 
                  project={project} 
                  currentUser={currentUser} 
                  collaborators={projectUsers} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="tools" className="mt-0" forceMount={activeTab === "tools"}>
            {activeTab === "tools" && (
              <div className="w-full max-w-none">
                <ToolsHub 
                  project={project} 
                  onProjectUpdate={onProjectUpdate} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="assets" className="mt-0" forceMount={activeTab === "assets"}>
            {activeTab === "assets" && (
              <div className="w-full max-w-none">
                <AssetsTab 
                  project={project} 
                  currentUser={currentUser} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>



          <TabsContent value="ides" className="mt-0" forceMount={activeTab === "ides"}>
            {activeTab === "ides" && (
              <div className="w-full max-w-none">
                <IdeationToolsTab 
                  project={project} 
                  currentUser={currentUser} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-0" forceMount={activeTab === "activity"}>
            {activeTab === "activity" && (
              <div className="w-full max-w-none">
                <ActivityTab 
                  project={project} 
                  currentUser={currentUser} 
                  isCollaborator={isCollaborator}
                  isProjectOwner={isProjectOwner}
                  projectOwnerName={projectOwnerName}
                />
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default WorkspaceTabs;