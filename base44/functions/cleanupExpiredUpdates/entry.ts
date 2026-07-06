import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Deletes Update records older than 24 hours.
 * Updates are meant to be ephemeral (like stories), so they auto-expire.
 * Called hourly via a scheduled automation.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Only admins should be able to trigger this manually;
    // the scheduled automation runs as service role.
    let isServiceRole = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }
    } catch {
      // No user context (scheduled run) — proceed as service role
      isServiceRole = true;
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const cutoffIso = cutoff.toISOString();

    // Fetch all updates and filter by created_date older than 24h
    const allUpdates = await base44.asServiceRole.entities.Update.list();

    const expiredUpdates = allUpdates.filter(update => {
      if (!update.created_date) return false;
      return new Date(update.created_date) < cutoff;
    });

    if (expiredUpdates.length === 0) {
      return Response.json({
        message: 'No expired updates found',
        deleted_count: 0,
        cutoff: cutoffIso
      });
    }

    // Delete each expired update
    let deletedCount = 0;
    for (const update of expiredUpdates) {
      try {
        await base44.asServiceRole.entities.Update.delete(update.id);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete update ${update.id}:`, err);
      }
    }

    return Response.json({
      message: 'Expired updates cleaned up',
      deleted_count: deletedCount,
      total_checked: allUpdates.length,
      cutoff: cutoffIso
    });

  } catch (error) {
    console.error('Error cleaning up expired updates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});