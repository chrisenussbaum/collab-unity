
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Handle both URL params (GET) and request body (POST)
        let query = '';
        
        if (req.method === 'POST') {
            const body = await req.json();
            query = body.query || '';
        } else {
            const { searchParams } = new URL(req.url);
            query = searchParams.get('query') || '';
        }
        
        if (!query || query.trim().length < 2) {
            return Response.json({ 
                results: {
                    projects: [],
                    users: [],
                    posts: [],
                    templates: []
                }
            });
        }

        const searchTerm = query.toLowerCase().trim();

        // Helper function to check if any array item matches
        const arrayIncludes = (arr, term) => {
            if (!arr || !Array.isArray(arr)) return false;
            return arr.some(item => item.toLowerCase().includes(term));
        };

        // Search Projects (both public and private)
        const allProjects = await base44.asServiceRole.entities.Project.list();
        
        const matchedProjects = allProjects.filter(project => {
            // Search by title (most important - check first)
            if (project.title?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by description
            if (project.description?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by location
            if (project.location?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by industry
            if (project.industry?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by area of interest
            if (project.area_of_interest?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by classification
            if (project.classification?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by project type
            if (project.project_type?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by status
            const statusLabels = {
                'seeking_collaborators': ['seeking', 'collaborators', 'seeking collaborators'],
                'in_progress': ['progress', 'in progress', 'working'],
                'completed': ['completed', 'done', 'finished']
            };
            if (project.status && statusLabels[project.status]) {
                if (statusLabels[project.status].some(label => label.includes(searchTerm))) return true;
            }
            
            // Search by skills needed
            if (arrayIncludes(project.skills_needed, searchTerm)) return true;
            
            // Search by tools needed
            if (arrayIncludes(project.tools_needed, searchTerm)) return true;
            
            // Search by visibility (public/private)
            if (searchTerm === 'public' && project.is_visible_on_feed !== false) return true;
            if (searchTerm === 'private' && project.is_visible_on_feed === false) return true;
            
            // Search by template indicator
            if ((searchTerm === 'template' || searchTerm === 'templates') && project.template_id) return true;
            
            return false;
        })
        .sort((a, b) => {
            // Prioritize exact title matches
            const aExactTitle = a.title?.toLowerCase() === searchTerm;
            const bExactTitle = b.title?.toLowerCase() === searchTerm;
            if (aExactTitle && !bExactTitle) return -1;
            if (!aExactTitle && bExactTitle) return 1;
            
            // Then prioritize title starts with
            const aTitleStarts = a.title?.toLowerCase().startsWith(searchTerm);
            const bTitleStarts = b.title?.toLowerCase().startsWith(searchTerm);
            if (aTitleStarts && !bTitleStarts) return -1;
            if (!aTitleStarts && bTitleStarts) return 1;
            
            // Otherwise sort by most recent
            return new Date(b.created_date) - new Date(a.created_date);
        })
        .slice(0, 8);

        // Search Users (only those who have completed onboarding with username)
        const allUsers = await base44.asServiceRole.entities.User.list();
        
        const matchedUsers = allUsers.filter(user => {
            // CRITICAL: Only include users who have completed onboarding and have a username
            if (!user.username || !user.has_completed_onboarding) {
                return false;
            }
            
            // Search by full name
            if (user.full_name?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by username
            if (user.username?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by email
            if (user.email?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by bio
            if (user.bio?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by location
            if (user.location?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by skills
            if (arrayIncludes(user.skills, searchTerm)) return true;
            
            // Search by interests
            if (arrayIncludes(user.interests, searchTerm)) return true;
            
            // Search by tools & technologies
            if (arrayIncludes(user.tools_technologies, searchTerm)) return true;
            
            return false;
        })
        .sort((a, b) => {
            // Prioritize exact username matches
            const aExactUsername = a.username?.toLowerCase() === searchTerm;
            const bExactUsername = b.username?.toLowerCase() === searchTerm;
            if (aExactUsername && !bExactUsername) return -1;
            if (!aExactUsername && bExactUsername) return 1;
            
            // Then prioritize exact name matches
            const aExactName = a.full_name?.toLowerCase() === searchTerm;
            const bExactName = b.full_name?.toLowerCase() === searchTerm;
            if (aExactName && !bExactName) return -1;
            if (!aExactName && bExactName) return 1;
            
            // Then prioritize username starts with
            const aUsernameStarts = a.username?.toLowerCase().startsWith(searchTerm);
            const bUsernameStarts = b.username?.toLowerCase().startsWith(searchTerm);
            if (aUsernameStarts && !bUsernameStarts) return -1;
            if (!aUsernameStarts && bUsernameStarts) return 1;
            
            return 0;
        })
        .slice(0, 8);

        // Search Feed Posts
        const allPosts = await base44.asServiceRole.entities.FeedPost.filter({ 
            is_visible: true 
        });
        
        const matchedPosts = allPosts.filter(post => {
            // Search by title
            if (post.title?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by content
            if (post.content?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by tags
            if (arrayIncludes(post.tags, searchTerm)) return true;
            
            // Search by post type
            const postTypeLabels = {
                'status_update': ['status', 'update', 'status update'],
                'narrative': ['narrative', 'story', 'blog'],
                'collaboration_call': ['collaboration', 'call', 'help', 'looking for']
            };
            if (post.post_type && postTypeLabels[post.post_type]) {
                if (postTypeLabels[post.post_type].some(label => label.includes(searchTerm))) return true;
            }
            
            return false;
        })
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 8);

        // Search Project Templates
        const allTemplates = await base44.asServiceRole.entities.ProjectTemplate.filter({ 
            is_active: true 
        });
        
        const matchedTemplates = allTemplates.filter(template => {
            // Search by title
            if (template.title?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by description
            if (template.description?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by category
            if (template.category?.toLowerCase().includes(searchTerm)) return true;
            
            // Search by target skills
            if (arrayIncludes(template.target_skills, searchTerm)) return true;
            
            // Search by suggested tools
            if (arrayIncludes(template.suggested_tools, searchTerm)) return true;
            
            // Search by tags
            if (arrayIncludes(template.tags, searchTerm)) return true;
            
            // Search by difficulty level
            if (template.difficulty_level?.toLowerCase().includes(searchTerm)) return true;
            
            return false;
        })
        .sort((a, b) => {
            // Prioritize exact title matches
            const aExactTitle = a.title?.toLowerCase() === searchTerm;
            const bExactTitle = b.title?.toLowerCase() === searchTerm;
            if (aExactTitle && !bExactTitle) return -1;
            if (!aExactTitle && bExactTitle) return 1;
            return new Date(b.created_date) - new Date(a.created_date);
        })
        .slice(0, 8);

        const results = {
            projects: matchedProjects.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                logo_url: p.logo_url,
                status: p.status,
                created_by: p.created_by,
                is_visible_on_feed: p.is_visible_on_feed
            })),
            users: matchedUsers.map(u => ({
                email: u.email,
                username: u.username,
                full_name: u.full_name,
                profile_image: u.profile_image,
                bio: u.bio,
                location: u.location
            })),
            posts: matchedPosts.map(p => ({
                id: p.id,
                title: p.title,
                content: p.content,
                post_type: p.post_type,
                created_by: p.created_by,
                created_date: p.created_date
            })),
            templates: matchedTemplates.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                difficulty_level: t.difficulty_level,
                category: t.category
            }))
        };

        console.log(`Search for "${query}" found:`, {
            projects: results.projects.length,
            users: results.users.length,
            posts: results.posts.length,
            templates: results.templates.length
        });

        return Response.json({ results });
    } catch (error) {
        console.error("Global search error:", error);
        return Response.json({ 
            error: error.message,
            results: {
                projects: [],
                users: [],
                posts: [],
                templates: []
            }
        }, { status: 500 });
    }
});
