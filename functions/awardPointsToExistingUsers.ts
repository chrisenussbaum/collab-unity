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

    // Get all projects
    const allProjects = await base44.asServiceRole.entities.Project.filter({});
    console.log(`Found ${allProjects.length} projects`);

    const processedUsers = new Set();
    const results = {
      projectsProcessed: 0,
      creatorsAwarded: 0,
      collaboratorsAwarded: 0,
      errors: []
    };

    for (const project of allProjects) {
      try {
        results.projectsProcessed++;

        // Award points to project creator
        if (project.created_by && !processedUsers.has(`${project.created_by}-creator`)) {
          try {
            await base44.asServiceRole.functions.invoke('awardPoints', {
              action: 'project_created',
              user_email: project.created_by
            });
            processedUsers.add(`${project.created_by}-creator`);
            results.creatorsAwarded++;
            console.log(`Awarded project creation points to: ${project.created_by}`);
          } catch (error) {
            console.error(`Error awarding creator points for ${project.created_by}:`, error);
            results.errors.push(`Creator ${project.created_by}: ${error.message}`);
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