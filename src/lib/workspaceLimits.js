// Per-project caps on open (unfinished) items.
// Encourages finishing work over endlessly piling on new items.
export const MAX_OPEN_TASKS = 10;
export const MAX_OPEN_MILESTONES = 5;

export const openTasksCount = (tasks) =>
  (tasks || []).filter((t) => t.status !== "done").length;

export const openMilestonesCount = (milestones) =>
  (milestones || []).filter((m) => m.status !== "completed").length;

export const TASK_LIMIT_MESSAGE = `This project has hit its limit of ${MAX_OPEN_TASKS} open tasks. Finish or remove some before adding more.`;

export const MILESTONE_LIMIT_MESSAGE = `This project has hit its limit of ${MAX_OPEN_MILESTONES} open milestones. Complete or remove some before adding more.`;