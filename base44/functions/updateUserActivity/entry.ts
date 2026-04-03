import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get the current user
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update the user's last activity timestamp
        await base44.auth.updateMe({
            last_activity_at: new Date().toISOString()
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error updating user activity:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});