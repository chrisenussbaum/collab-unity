import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { endorsement_id } = await req.json();

    if (!endorsement_id) {
      return Response.json({ error: 'Endorsement ID required' }, { status: 400 });
    }

    const endorsements = await base44.asServiceRole.entities.SkillEndorsement.filter({ 
      id: endorsement_id 
    });
    
    if (endorsements.length === 0) {
      return Response.json({ error: 'Endorsement not found' }, { status: 404 });
    }

    const endorsement = endorsements[0];

    // Check user's notification preferences
    const user = await base44.asServiceRole.entities.User.filter({ 
      email: endorsement.user_email 
    });
    
    if (user.length > 0) {
      const prefs = user[0].notification_preferences || {};
      if (prefs.endorsements === false) {
        return Response.json({ 
          success: true, 
          skipped: true,
          reason: 'User has disabled endorsement notifications' 
        });
      }
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: endorsement.user_email,
      title: 'New Skill Endorsement',
      message: `${endorsement.endorser_name} endorsed your skill: ${endorsement.skill}`,
      type: 'general',
      related_entity_id: endorsement_id,
      actor_email: endorsement.endorser_email,
      actor_name: endorsement.endorser_name,
      read: false
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error("Error in notifySkillEndorsement:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});