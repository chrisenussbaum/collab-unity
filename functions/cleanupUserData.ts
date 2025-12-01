import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'userEmail is required' }, { status: 400 });
    }

    // Use service role to delete all user-related data
    const deleteResults = {
      projects: 0,
      projectApplications: 0,
      notifications: 0,
      tasks: 0,
      comments: 0,
      assetVersions: 0,
      activityLogs: 0,
      projectApplauds: 0,
      feedPosts: 0,
      feedPostApplauds: 0,
      conversations: 0,
      messages: 0,
      skillEndorsements: 0,
      collaboratorReviews: 0,
      thoughts: 0,
      projectInvitations: 0
    };

    // Delete projects created by user
    const userProjects = await base44.asServiceRole.entities.Project.filter({ created_by: userEmail });
    for (const project of userProjects) {
      await base44.asServiceRole.entities.Project.delete(project.id);
      deleteResults.projects++;
    }

    // Delete project applications by user
    const applications = await base44.asServiceRole.entities.ProjectApplication.filter({ applicant_email: userEmail });
    for (const app of applications) {
      await base44.asServiceRole.entities.ProjectApplication.delete(app.id);
      deleteResults.projectApplications++;
    }

    // Delete notifications for user
    const notifications = await base44.asServiceRole.entities.Notification.filter({ user_email: userEmail });
    for (const notif of notifications) {
      await base44.asServiceRole.entities.Notification.delete(notif.id);
      deleteResults.notifications++;
    }

    // Delete notifications sent by user (actor)
    const sentNotifications = await base44.asServiceRole.entities.Notification.filter({ actor_email: userEmail });
    for (const notif of sentNotifications) {
      await base44.asServiceRole.entities.Notification.delete(notif.id);
    }

    // Delete tasks assigned to user
    const tasks = await base44.asServiceRole.entities.Task.filter({ assigned_to: userEmail });
    for (const task of tasks) {
      await base44.asServiceRole.entities.Task.delete(task.id);
      deleteResults.tasks++;
    }

    // Delete tasks created by user
    const createdTasks = await base44.asServiceRole.entities.Task.filter({ created_by: userEmail });
    for (const task of createdTasks) {
      await base44.asServiceRole.entities.Task.delete(task.id);
    }

    // Delete comments by user
    const comments = await base44.asServiceRole.entities.Comment.filter({ user_email: userEmail });
    for (const comment of comments) {
      await base44.asServiceRole.entities.Comment.delete(comment.id);
      deleteResults.comments++;
    }

    // Delete asset versions uploaded by user
    const assets = await base44.asServiceRole.entities.AssetVersion.filter({ uploaded_by: userEmail });
    for (const asset of assets) {
      await base44.asServiceRole.entities.AssetVersion.delete(asset.id);
      deleteResults.assetVersions++;
    }

    // Delete activity logs by user
    const activityLogs = await base44.asServiceRole.entities.ActivityLog.filter({ user_email: userEmail });
    for (const log of activityLogs) {
      await base44.asServiceRole.entities.ActivityLog.delete(log.id);
      deleteResults.activityLogs++;
    }

    // Delete project applauds by user
    const projectApplauds = await base44.asServiceRole.entities.ProjectApplaud.filter({ user_email: userEmail });
    for (const applaud of projectApplauds) {
      await base44.asServiceRole.entities.ProjectApplaud.delete(applaud.id);
      deleteResults.projectApplauds++;
    }

    // Delete feed posts by user
    const feedPosts = await base44.asServiceRole.entities.FeedPost.filter({ created_by: userEmail });
    for (const post of feedPosts) {
      await base44.asServiceRole.entities.FeedPost.delete(post.id);
      deleteResults.feedPosts++;
    }

    // Delete feed post applauds by user
    const feedPostApplauds = await base44.asServiceRole.entities.FeedPostApplaud.filter({ user_email: userEmail });
    for (const applaud of feedPostApplauds) {
      await base44.asServiceRole.entities.FeedPostApplaud.delete(applaud.id);
      deleteResults.feedPostApplauds++;
    }

    // Delete conversations involving user
    const conversations1 = await base44.asServiceRole.entities.Conversation.filter({ participant_1_email: userEmail });
    for (const conv of conversations1) {
      // Delete all messages in conversation first
      const messages = await base44.asServiceRole.entities.Message.filter({ conversation_id: conv.id });
      for (const msg of messages) {
        await base44.asServiceRole.entities.Message.delete(msg.id);
        deleteResults.messages++;
      }
      await base44.asServiceRole.entities.Conversation.delete(conv.id);
      deleteResults.conversations++;
    }

    const conversations2 = await base44.asServiceRole.entities.Conversation.filter({ participant_2_email: userEmail });
    for (const conv of conversations2) {
      const messages = await base44.asServiceRole.entities.Message.filter({ conversation_id: conv.id });
      for (const msg of messages) {
        await base44.asServiceRole.entities.Message.delete(msg.id);
        deleteResults.messages++;
      }
      await base44.asServiceRole.entities.Conversation.delete(conv.id);
      deleteResults.conversations++;
    }

    // Delete skill endorsements (given and received)
    const endorsementsReceived = await base44.asServiceRole.entities.SkillEndorsement.filter({ user_email: userEmail });
    for (const endorsement of endorsementsReceived) {
      await base44.asServiceRole.entities.SkillEndorsement.delete(endorsement.id);
      deleteResults.skillEndorsements++;
    }

    const endorsementsGiven = await base44.asServiceRole.entities.SkillEndorsement.filter({ endorser_email: userEmail });
    for (const endorsement of endorsementsGiven) {
      await base44.asServiceRole.entities.SkillEndorsement.delete(endorsement.id);
    }

    // Delete collaborator reviews (given and received)
    const reviewsReceived = await base44.asServiceRole.entities.CollaboratorReview.filter({ reviewee_email: userEmail });
    for (const review of reviewsReceived) {
      await base44.asServiceRole.entities.CollaboratorReview.delete(review.id);
      deleteResults.collaboratorReviews++;
    }

    const reviewsGiven = await base44.asServiceRole.entities.CollaboratorReview.filter({ reviewer_email: userEmail });
    for (const review of reviewsGiven) {
      await base44.asServiceRole.entities.CollaboratorReview.delete(review.id);
    }

    // Delete thoughts created by user
    const thoughts = await base44.asServiceRole.entities.Thought.filter({ created_by: userEmail });
    for (const thought of thoughts) {
      await base44.asServiceRole.entities.Thought.delete(thought.id);
      deleteResults.thoughts++;
    }

    // Delete project invitations (sent and received)
    const invitationsSent = await base44.asServiceRole.entities.ProjectInvitation.filter({ inviter_email: userEmail });
    for (const inv of invitationsSent) {
      await base44.asServiceRole.entities.ProjectInvitation.delete(inv.id);
      deleteResults.projectInvitations++;
    }

    const invitationsReceived = await base44.asServiceRole.entities.ProjectInvitation.filter({ invitee_email: userEmail });
    for (const inv of invitationsReceived) {
      await base44.asServiceRole.entities.ProjectInvitation.delete(inv.id);
    }

    // Remove user from collaborator_emails in other projects
    const allProjects = await base44.asServiceRole.entities.Project.filter({});
    for (const project of allProjects) {
      if (project.collaborator_emails && project.collaborator_emails.includes(userEmail)) {
        const updatedCollaborators = project.collaborator_emails.filter(email => email !== userEmail);
        await base44.asServiceRole.entities.Project.update(project.id, {
          collaborator_emails: updatedCollaborators,
          current_collaborators_count: updatedCollaborators.length
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: `All data for ${userEmail} has been deleted`,
      deleted: deleteResults
    });
  } catch (error) {
    console.error('Error cleaning up user data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});