import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Package, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_RESOURCES = [
  // Design
  { name: 'Figma', category: 'Design', logo: 'https://cdn.worldvectorlogo.com/logos/figma-1.svg', link: 'https://www.figma.com' },
  { name: 'Adobe XD', category: 'Design', logo: 'https://cdn.worldvectorlogo.com/logos/adobe-xd.svg', link: 'https://www.adobe.com/products/xd.html' },
  { name: 'Sketch', category: 'Design', logo: 'https://cdn.worldvectorlogo.com/logos/sketch-2.svg', link: 'https://www.sketch.com' },
  { name: 'Canva', category: 'Design', logo: 'https://cdn.worldvectorlogo.com/logos/canva.svg', link: 'https://www.canva.com' },
  { name: 'Miro', category: 'Collaboration', logo: 'https://cdn.worldvectorlogo.com/logos/miro-2.svg', link: 'https://www.miro.com' },

  // Communication
  { name: 'Slack', category: 'Communication', logo: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg', link: 'https://www.slack.com' },
  { name: 'Discord', category: 'Communication', logo: 'https://cdn.worldvectorlogo.com/logos/discord-6.svg', link: 'https://www.discord.com' },
  { name: 'Microsoft Teams', category: 'Communication', logo: 'https://cdn.worldvectorlogo.com/logos/microsoft-teams-1.svg', link: 'https://www.microsoft.com/en-us/microsoft-teams/group-chat-software' },
  { name: 'Zoom', category: 'Communication', logo: 'https://cdn.worldvectorlogo.com/logos/zoom-communications-logo.svg', link: 'https://zoom.us' },

  // Project Management
  { name: 'Trello', category: 'Project Management', logo: 'https://cdn.worldvectorlogo.com/logos/trello.svg', link: 'https://www.trello.com' },
  { name: 'Jira', category: 'Project Management', logo: 'https://cdn.worldvectorlogo.com/logos/jira-1.svg', link: 'https://www.atlassian.com/software/jira' },
  { name: 'Notion', category: 'Project Management', logo: 'https://cdn.worldvectorlogo.com/logos/notion-1.svg', link: 'https://www.notion.so' },
  { name: 'Asana', category: 'Project Management', logo: 'https://cdn.worldvectorlogo.com/logos/asana-1.svg', link: 'https://www.asana.com' },
  { name: 'Airtable', category: 'Project Management', logo: 'https://cdn.worldvectorlogo.com/logos/airtable.svg', link: 'https://www.airtable.com' },

  // Development
  { name: 'GitHub', category: 'Development', logo: 'https://cdn.worldvectorlogo.com/logos/github-icon-1.svg', link: 'https://www.github.com' },
  { name: 'VS Code', category: 'Development', logo: 'https://cdn.worldvectorlogo.com/logos/visual-studio-code-1.svg', link: 'https://code.visualstudio.com/' },
  { name: 'GitLab', category: 'Development', logo: 'https://cdn.worldvectorlogo.com/logos/gitlab.svg', link: 'https://about.gitlab.com/' },
  { name: 'Docker', category: 'Development', logo: 'https://cdn.worldvectorlogo.com/logos/docker.svg', link: 'https://www.docker.com/' },
  { name: 'Postman', category: 'Development', logo: 'https://cdn.worldvectorlogo.com/logos/postman.svg', link: 'https://www.postman.com/' },

  // Document Collaboration
  { name: 'Google Docs', category: 'Collaboration', logo: 'https://cdn.worldvectorlogo.com/logos/google-docs.svg', link: 'https://docs.google.com' },
  { name: 'Google Sheets', category: 'Collaboration', logo: 'https://cdn.worldvectorlogo.com/logos/google-sheets.svg', link: 'https://sheets.google.com' },
  { name: 'Google Drive', category: 'Collaboration', logo: 'https://cdn.worldvectorlogo.com/logos/google-drive.svg', link: 'https://drive.google.com' },
];

export default function ResourceHub({ toolsNeeded = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Combine known resources with placeholders for unknown tools
  const projectTools = React.useMemo(() => {
    const knownProjectTools = ALL_RESOURCES.filter(resource => toolsNeeded.includes(resource.name));
    const knownToolNames = new Set(knownProjectTools.map(t => t.name));
    
    const unknownTools = toolsNeeded
      .filter(toolName => !knownToolNames.has(toolName))
      .map(toolName => ({
        name: toolName,
        category: 'Custom Tool',
        logo: null, // Will use placeholder icon
        link: `https://www.google.com/search?q=${encodeURIComponent(toolName)}`
      }));

    return [...knownProjectTools, ...unknownTools];
  }, [toolsNeeded]);

  const filteredAllResources = ALL_RESOURCES.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search for tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchQuery === '' && (
        <>
          {/* Project-specific Tools */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Project Tools ({projectTools.length})</h3>
            {projectTools.length > 0 ? (
              <ResourceGrid resources={projectTools} />
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No specific tools listed for this project.</p>
            )}
          </div>
          
          <div className="border-t my-6"></div>

          {/* All Resources */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">All Tools</h3>
            <ResourceGrid resources={ALL_RESOURCES} />
          </div>
        </>
      )}

      {searchQuery !== '' && (
         <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Search Results</h3>
            {filteredAllResources.length > 0 ? (
                <ResourceGrid resources={filteredAllResources} />
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No resources found for "{searchQuery}".</p>
            )}
        </div>
      )}
    </div>
  );
}

const ResourceGrid = ({ resources }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    <AnimatePresence>
      {resources.map((resource) => (
        <motion.div
          key={resource.name}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <a href={resource.link} target="_blank" rel="noopener noreferrer" className="block group">
            <div className="p-4 bg-gray-50 rounded-xl aspect-square flex flex-col items-center justify-center text-center space-y-3 hover:bg-gray-100 hover:shadow-md transition-all duration-200">
              <div className="w-16 h-16 flex items-center justify-center">
                {resource.logo ? (
                  <img src={resource.logo} alt={`${resource.name} logo`} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-500"/>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <p className="font-semibold text-sm text-gray-800 truncate">{resource.name}</p>
                <p className="text-xs text-gray-500">{resource.category}</p>
              </div>
            </div>
            <div className="flex items-center justify-center mt-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <LinkIcon className="w-3 h-3 mr-1" /> Go to resource
            </div>
          </a>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);