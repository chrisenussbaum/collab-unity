import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Checks for tasks with upcoming due dates and sends reminder notifications.
 * This function should be called periodically (e.g., via a cron job once per day).
 * 
 * It identifies tasks that are due within 24-48 hours and haven't been completed,
 * then sends notifications to the assigned users and project owners.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the current date and calculate the date range for "due soon" (24-48 hours from now)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

    // Fetch all tasks that are not completed and have due dates within the next 24-48 hours
    const allTasks = await base44.asServiceRole.entities.Task.list();
    
    const tasksDueSoon = allTasks.filter(task => {
      if (task.status === 'done' || !task.due_date) return false;
      
      const dueDate = task.due_date.split('T')[0]; // Extract date part only
      return dueDate === tomorrowStr || dueDate === dayAfterTomorrowStr;
    });

    if (tasksDueSoon.length === 0) {
      return Response.json({ 
        message: 'No tasks due soon found',
        tasks_checked: allTasks.length,
        notifications_sent: 0
      });
    }

    // Get project details for all tasks
    const projectIds = [...new Set(tasksDueSoon.map(t => t.project_id))];
    const projects = await Promise.all(
      projectIds.map(id => base44.asServiceRole.entities.Project.filter({ id }))
    );
    
    const projectsMap = {};
    projects.forEach(projectArr => {
      if (projectArr.length > 0) {
        const project = projectArr[0];
        projectsMap[project.id] = project;
      }
    });

    let notificationsSent = 0;

    // Send notifications for each task
    for (const task of tasksDueSoon) {
      const project = projectsMap[task.project_id];
      if (!project) continue;

      const dueDate = new Date(task.due_date);
      const hoursUntilDue = Math.round((dueDate - now) / (1000 * 60 * 60));

      const notifyEmails = new Set();

      // Notify the assigned user
      if (task.assigned_to) {
        notifyEmails.add(task.assigned_to);
      }

      // Notify the project owner
      if (project.created_by && project.created_by !== task.assigned_to) {
        notifyEmails.add(project.created_by);
      }

      // Send notifications
      for (const email of notifyEmails) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: email,
          title: "Task due soon",
          message: `Reminder: The task "${task.title}" in "${project.title}" is due in approximately ${hoursUntilDue} hours.`,
          type: "project_task_due_soon",
          related_project_id: project.id,
          related_entity_id: task.id,
          actor_email: "system@collabunity.io",
          actor_name: "Collab Unity",
          metadata: {
            project_title: project.title,
            task_title: task.title,
            task_id: task.id,
            due_date: task.due_date,
            hours_until_due: hoursUntilDue
          }
        });
        notificationsSent++;
      }
    }

    return Response.json({
      message: 'Task due date reminders sent successfully',
      tasks_checked: allTasks.length,
      tasks_due_soon: tasksDueSoon.length,
      notifications_sent: notificationsSent
    });

  } catch (error) {
    console.error('Error checking task due dates:', error);
    return Response.json({ 
      error: error.message,
      details: 'Failed to check task due dates and send reminders'
    }, { status: 500 });
  }
});