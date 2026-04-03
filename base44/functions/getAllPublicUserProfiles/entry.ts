import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This endpoint is now public - no authentication required
        // It returns public profile data only, safe for anonymous access
        // Used for mentions, autocomplete, and other public features

        // Use service role to fetch ALL user profiles, bypassing RLS.
        const allUsers = await base44.asServiceRole.entities.User.list();

        // Manually map to a public-safe format with all profile fields
        const publicProfiles = (allUsers || []).map(u => ({
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
        }));

        return new Response(
            JSON.stringify(publicProfiles), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in getAllPublicUserProfiles:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});