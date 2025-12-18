import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_type, scopes } = await req.json();

    if (!integration_type || !scopes || !Array.isArray(scopes)) {
      return Response.json({ error: 'Missing integration_type or scopes' }, { status: 400 });
    }

    // Initiate OAuth flow
    const authUrl = await base44.asServiceRole.connectors.getAuthorizationUrl(
      integration_type,
      scopes
    );

    return Response.json({ auth_url: authUrl });
  } catch (error) {
    console.error('Error authorizing connector:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});