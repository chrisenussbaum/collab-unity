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

        if (!username || typeof username !== 'string') {
            return new Response(
                JSON.stringify({ available: false, error: 'Username is required' }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Validate username format: alphanumeric, hyphens, underscores only, 3-30 characters
        const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
        if (!usernameRegex.test(username)) {
            return new Response(
                JSON.stringify({ 
                    available: false, 
                    error: 'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores' 
                }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if username already exists (case-insensitive)
        const existingUsers = await base44.asServiceRole.entities.User.filter({
            username: username.toLowerCase()
        });

        const available = !existingUsers || existingUsers.length === 0;

        return new Response(
            JSON.stringify({ available }), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in checkUsernameAvailability:', error);
        return new Response(
            JSON.stringify({ available: false, error: error.message || 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});