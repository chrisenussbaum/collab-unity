import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bug_id, bug_title, reporter_email, reporter_name, page_name } = await req.json();

    if (!bug_id || !bug_title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    if (!admins || admins.length === 0) {
      return Response.json({ success: true, notified: 0 });
    }

    const reporter = reporter_email || user.email;
    const reporterName = reporter_name || user.full_name || reporter;
    const pageLabel = page_name || 'the app';
    const message = `${reporterName} reported a bug on ${pageLabel}: "${bug_title}"`;

    let notified = 0;
    for (const admin of admins) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          title: `New bug report: ${bug_title}`,
          message,
          type: 'general',
          related_entity_id: bug_id,
          actor_email: reporter,
          actor_name: reporterName,
          read: false
        });
        notified++;
      } catch (e) {
        console.error(`Failed to notify admin ${admin.email}:`, e);
      }
    }

    return Response.json({ success: true, notified });
  } catch (error) {
    console.error('Error notifying admins of bug:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});