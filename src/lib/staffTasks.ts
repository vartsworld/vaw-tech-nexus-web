/**
 * One definition of "my tasks" for every staff surface (desktop dashboard and mobile home),
 * so a task never shows in one and not the other.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PostgREST `or` filter for tasks assigned to the user, or in their department.
 * A missing department must not produce `department_id.eq.none`: the column is a uuid,
 * so Postgres rejects the whole query and the user sees no tasks at all.
 */
export function staffTasksOrFilter(userId: string, departmentId?: string | null): string {
  const mine = `assigned_to.ilike.%${userId}%`;
  return departmentId && UUID.test(departmentId) ? `${mine},department_id.eq.${departmentId}` : mine;
}

/** Same idea for team heads: tasks they assigned, are assigned, or their department's. */
export function teamHeadTasksOrFilter(userId: string, departmentId?: string | null): string {
  const mine = `assigned_by.eq.${userId},assigned_to.eq.${userId},assigned_to.like.*${userId}*`;
  return departmentId && UUID.test(departmentId) ? `${mine},department_id.eq.${departmentId}` : mine;
}

export type RawTask = Record<string, any>;
export type RawSubtask = Record<string, any> & { staff_tasks?: RawTask | null };

const DONE_LIKE = ["completed", "review_pending", "pending_approval", "handover"];

/**
 * Merges direct/department tasks with the user's subtasks and works out the status the user
 * should see: pending until one of their subtasks is in progress, completed when all are done,
 * and overdue when the earliest due date has passed. Tasks with no due date are never overdue.
 */
export function buildStaffTasks(
  directTasks: RawTask[],
  subtaskItems: RawSubtask[],
  userId: string
): (RawTask & { status: string; due_date: string | null })[] {
  const groups: Record<string, { parent: RawTask; subs: RawSubtask[] }> = {};

  directTasks.forEach((task) => {
    const embedded = (task.staff_subtasks as RawSubtask[] | undefined) || [];
    groups[task.id] = { parent: task, subs: embedded.filter((s) => s.assigned_to === userId) };
  });

  subtaskItems.forEach((st) => {
    if (!st.task_id || !st.staff_tasks) return;
    if (!groups[st.task_id]) groups[st.task_id] = { parent: st.staff_tasks, subs: [] };
    if (!groups[st.task_id].subs.some((s) => s.id === st.id)) groups[st.task_id].subs.push(st);
  });

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  return Object.values(groups).map(({ parent, subs }) => {
    let status: string = parent.status || "pending";

    if (subs.length > 0) {
      status = "pending";
      if (subs.some((s) => s.status === "in_progress")) status = "in_progress";
      else if (subs.every((s) => DONE_LIKE.includes(s.status || ""))) status = "completed";
    }

    const dated = subs.filter((s) => s.due_date);
    const due: string | null = dated.length
      ? [...dated].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date
      : parent.due_date ?? null;

    if (status !== "completed" && due && new Date(due) < startOfToday) status = "overdue";

    return { ...parent, status, due_date: due };
  });
}
