import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed. Use POST.' }), 
                { status: 405, headers: { 'Content-Type': 'application/json' } }
            );
        }

        let emails;
        try {
            const body = await req.json();
            emails = body.emails;
        } catch (error) {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!emails || !Array.isArray(emails)) {
            return new Response(
                JSON.stringify({ error: 'Invalid input: emails array is required.' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        if (emails.length === 0) {
            return new Response(
                JSON.stringify([]), 
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (emails.length > 100) {
            return new Response(
                JSON.stringify({ error: 'Too many emails requested. Maximum 100 per request.' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const usersData = await base44.asServiceRole.entities.User.filter({
            email: { $in: emails }
        });

        const publicProfiles = (usersData || []).map(u => ({
            id: u.id,
            email: u.email,
            username: u.username || '',
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
            social_links: u.social_links || {},
            resume_url: u.resume_url || '',
            portfolio_items: u.portfolio_items || [],
            followed_projects: u.followed_projects || [],
        }));

        return new Response(
            JSON.stringify(publicProfiles), 
            { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                } 
            }
        );

    } catch (error) {
        console.error('Error in getPublicUserProfiles:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});