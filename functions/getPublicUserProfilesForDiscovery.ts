import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Allow POST requests, which is the default for frontend function invocation.
        if (req.method !== 'POST' && req.method !== 'GET') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed.' }), 
                { status: 405, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const allUsers = await base44.asServiceRole.entities.User.list();

        // Filter to only include users who have completed their profile beyond just required fields
        const publicUsers = (allUsers || []).filter(u => {
            const hasUsername = u.username && u.username.trim() !== '';
            const hasBio = u.bio && u.bio.trim() !== '';
            const hasSkills = u.skills && u.skills.length > 0;
            const hasInterests = u.interests && u.interests.length > 0;
            const hasTools = u.tools_technologies && u.tools_technologies.length > 0;
            
            // User must have username AND at least one additional field filled out
            return hasUsername && (hasBio || hasSkills || hasInterests || hasTools);
        });

        const publicProfiles = publicUsers.map(u => ({
            id: u.id,
            username: u.username || '',
            email: u.email,
            full_name: u.full_name || '',
            profile_image: u.profile_image || '',
            cover_image: u.cover_image || '',
            location: u.location || '',
            bio: u.bio || '',
            skills: u.skills || [],
            interests: u.interests || [],
            tools_technologies: u.tools_technologies || [],
            education: u.education || [],
            awards_certifications: u.awards_certifications || [],
            website_url: u.website_url || '',
            linkedin_url: u.linkedin_url || '',
            last_activity_at: u.last_activity_at || null,
        }));

        return new Response(
            JSON.stringify(publicProfiles), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in getPublicUserProfilesForDiscovery:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});