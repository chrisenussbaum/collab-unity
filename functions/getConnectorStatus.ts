import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all connector statuses
    const connectors = [
      'salesforce',
      'slack',
      'notion',
      'googlecalendar',
      'googledrive',
      'googlesheets',
      'googleslides',
      'googledocs',
      'hubspot',
      'linkedin',
      'tiktok'
    ];

    const statuses = {};

    for (const connector of connectors) {
      try {
        const token = await base44.asServiceRole.connectors.getAccessToken(connector);
        statuses[connector] = { connected: !!token };
      } catch (error) {
        statuses[connector] = { connected: false };
      }
    }

    return Response.json({ statuses });
  } catch (error) {
    console.error('Error getting connector status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});