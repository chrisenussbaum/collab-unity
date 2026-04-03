import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user - must be admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    console.log('Starting to award points to existing users...');

    const processedUsers = new Set();
    const results = {
      projectsProcessed: 0,
      creatorsAwarded: 0,
      collaboratorsAwarded: 0,
      endorsementsProcessed: 0,
      reviewsProcessed: 0,
      profilesCompleted: 0,
      errors: []
    };

    // Get all projects
    const allProjects = await base44.asServiceRole.entities.Project.filter({});
    console.log(`Found ${allProjects.length} projects`);

    for (const project of allProjects) {
      try {
        results.projectsProcessed++;

        // Award points to project creator (for EACH project they created)
        if (project.created_by) {
          const projectCreatorKey = `${project.created_by}-creator-${project.id}`;
          if (!processedUsers.has(projectCreatorKey)) {
            try {
              await base44.asServiceRole.functions.invoke('awardPoints', {
                action: 'project_created',
                user_email: project.created_by
              });
              processedUsers.add(projectCreatorKey);
              results.creatorsAwarded++;
              console.log(`Awarded project creation points to: ${project.created_by} for project ${project.id}`);
            } catch (error) {
              console.error(`Error awarding creator points for ${project.created_by}:`, error);
              results.errors.push(`Creator ${project.created_by}: ${error.message}`);
            }
          }
        }

        // Award points to collaborators (excluding the creator)
        if (project.collaborator_emails && Array.isArray(project.collaborator_emails)) {
          for (const collaboratorEmail of project.collaborator_emails) {
            // Skip the creator (they already got points for creating)
            if (collaboratorEmail === project.created_by) continue;
            
            const uniqueKey = `${collaboratorEmail}-collab-${project.id}`;
            if (!processedUsers.has(uniqueKey)) {
              try {
                await base44.asServiceRole.functions.invoke('awardPoints', {
                  action: 'project_collaboration',
                  user_email: collaboratorEmail
                });
                processedUsers.add(uniqueKey);
                results.collaboratorsAwarded++;
                console.log(`Awarded collaboration points to: ${collaboratorEmail} for project ${project.id}`);
              } catch (error) {
                console.error(`Error awarding collaborator points for ${collaboratorEmail}:`, error);
                results.errors.push(`Collaborator ${collaboratorEmail}: ${error.message}`);
              }
            }
          }
        }

        // Small delay to avoid rate limits
        if (results.projectsProcessed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
        results.errors.push(`Project ${project.id}: ${error.message}`);
      }
    }

    // Award points for endorsements (each endorsement given/received)
    console.log('Processing endorsements...');
    try {
      const allEndorsements = await base44.asServiceRole.entities.SkillEndorsement.filter({});
      console.log(`Found ${allEndorsements.length} endorsements`);
      
      for (const endorsement of allEndorsements) {
        const receiverKey = `${endorsement.user_email}-endorsement-received-${endorsement.id}`;
        const giverKey = `${endorsement.endorser_email}-endorsement-given-${endorsement.id}`;
        
        try {
          // Award points to endorsement receiver (for each endorsement)
          if (!processedUsers.has(receiverKey)) {
            await base44.asServiceRole.functions.invoke('awardPoints', {
              action: 'endorsement_received',
              user_email: endorsement.user_email
            });
            processedUsers.add(receiverKey);
            results.endorsementsProcessed++;
          }
          
          // Award points to endorsement giver (for each endorsement)
          if (!processedUsers.has(giverKey)) {
            await base44.asServiceRole.functions.invoke('awardPoints', {
              action: 'endorsement_given',
              user_email: endorsement.endorser_email
            });
            processedUsers.add(giverKey);
          }
        } catch (error) {
          console.error(`Error processing endorsement:`, error);
          results.errors.push(`Endorsement: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error processing endorsements:', error);
      results.errors.push(`Endorsements batch: ${error.message}`);
    }

    // Award points for reviews (each review given/received)
    console.log('Processing reviews...');
    try {
      const allReviews = await base44.asServiceRole.entities.CollaboratorReview.filter({});
      console.log(`Found ${allReviews.length} reviews`);
      
      for (const review of allReviews) {
        const reviewerKey = `${review.reviewer_email}-review-given-${review.id}`;
        const revieweeKey = `${review.reviewee_email}-review-received-${review.id}`;
        
        try {
          // Award points to reviewer (for each review)
          if (!processedUsers.has(reviewerKey)) {
            await base44.asServiceRole.functions.invoke('awardPoints', {
              action: 'review_given',
              user_email: review.reviewer_email
            });
            processedUsers.add(reviewerKey);
            results.reviewsProcessed++;
          }
          
          // Award points to reviewee (for each review)
          if (!processedUsers.has(revieweeKey)) {
            await base44.asServiceRole.functions.invoke('awardPoints', {
              action: 'review_received',
              user_email: review.reviewee_email
            });
            processedUsers.add(revieweeKey);
          }
        } catch (error) {
          console.error(`Error processing review:`, error);
          results.errors.push(`Review: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error processing reviews:', error);
      results.errors.push(`Reviews batch: ${error.message}`);
    }

    // Award points for profile completion
    console.log('Processing profile completions...');
    try {
      const allUsers = await base44.asServiceRole.entities.User.filter({});
      console.log(`Found ${allUsers.length} users to check for profile completion`);
      
      for (const user of allUsers) {
        const profileKey = `${user.email}-profile-complete`;
        
        try {
          // Award points if user has completed onboarding and has a profile image
          if (!processedUsers.has(profileKey) && user.has_completed_onboarding && user.profile_image) {
            await base44.asServiceRole.functions.invoke('awardPoints', {
              action: 'profile_complete',
              user_email: user.email
            });
            processedUsers.add(profileKey);
            results.profilesCompleted++;
          }
        } catch (error) {
          console.error(`Error awarding profile completion points to ${user.email}:`, error);
          results.errors.push(`Profile ${user.email}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error processing profile completions:', error);
      results.errors.push(`Profiles batch: ${error.message}`);
    }

    console.log('Finished awarding points. Results:', results);

    return Response.json({
      success: true,
      message: 'Points awarded to existing users',
      results
    });

  } catch (error) {
    console.error('Error in awardPointsToExistingUsers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});