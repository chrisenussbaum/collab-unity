import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed. Use POST.' }), 
                { status: 405, headers: { 'Content-Type': 'application/json' } }
            );
        }

        let username;
        try {
            const body = await req.json();
            username = body.username;
        } catch (error) {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!username) {
            return new Response(
                JSON.stringify({ error: 'Username is required' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Query users by username using service role for full access
        const users = await base44.asServiceRole.entities.User.filter({
            username: username
        });

        if (!users || users.length === 0) {
            return new Response(
                JSON.stringify({ error: 'User not found' }), 
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const user = users[0];

        // Return full user profile including portfolio and followed projects
        const publicProfile = {
            id: user.id,
            email: user.email,
            username: user.username || '',
            full_name: user.full_name || '',
            profile_image: user.profile_image || '',
            cover_image: user.cover_image || '',
            location: user.location || '',
            bio: user.bio || '',
            skills: user.skills || [],
            interests: user.interests || [],
            tools_technologies: user.tools_technologies || [],
            education: user.education || [],
            awards_certifications: user.awards_certifications || [],
            website_url: user.website_url || '',
            linkedin_url: user.linkedin_url || '',
            social_links: user.social_links || {},
            resume_url: user.resume_url || '',
            portfolio_items: user.portfolio_items || [],
            followed_projects: user.followed_projects || [],
            phone_number: user.phone_number || '',
            birthday: user.birthday || '',
            venmo_link: user.venmo_link || '',
            created_date: user.created_date
        };

        return new Response(
            JSON.stringify(publicProfile), 
            { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=300'
                } 
            }
        );

    } catch (error) {
        console.error('Error in getUserByUsername:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});