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

        const DEFAULT_COVER_IMAGE = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/cd4694e0a_purple-background.jpg';

        // Filter to only include users who have username, name, profile photo, and public profile
        const publicUsers = (allUsers || []).filter(u => {
            const hasUsername = u.username && u.username.trim() !== '';
            const hasName = u.full_name && u.full_name.trim() !== '';
            const hasProfileImage = u.profile_image && u.profile_image.trim() !== '';
            const isPublic = u.is_public !== false; // Default to true if not set
            
            return hasUsername && hasName && hasProfileImage && isPublic;
        });

        const publicProfiles = publicUsers.map(u => ({
            id: u.id,
            username: u.username || '',
            email: u.email,
            full_name: u.full_name || '',
            profile_image: u.profile_image || '',
            cover_image: u.cover_image || DEFAULT_COVER_IMAGE,
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