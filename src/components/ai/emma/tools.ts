import { supabase } from "@/integrations/supabase/client";

export type EmmaRole = "hr" | "team_head" | "staff";

// Loosely typed on purpose: several tables used here are missing from the generated types.
const db = supabase as any;

const TASK_STATUSES = ["pending", "in_progress", "completed", "overdue", "handover", "pending_approval", "review_pending"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const fail = (msg: string): never => { throw new Error(msg); };
const isUuid = (v: any) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const fn = (name: string, description: string, properties: Record<string, any> = {}, required: string[] = []) => ({
  type: "function",
  function: { name, description, parameters: { type: "object", properties, required } },
});

const S = { type: "string" };
const N = { type: "number" };

/** Tools offered to the model, by role. Staff get a personal-only subset. */
export function toolDefinitions(role: EmmaRole) {
  const personal = [
    fn("my_summary", "The signed-in user's own profile, attendance streak, points, and open tasks. Use this for 'my day', 'what should I do', 'how am I doing'."),
    fn("list_tasks", "List tasks. Staff only see their own. Filter by status, assignee, department, overdue, or a title search.", {
      status: { ...S, enum: TASK_STATUSES }, assigned_to: { ...S, description: "User UUID" }, department_id: S,
      overdue: { type: "boolean", description: "Only tasks past their due date and not completed" }, search: S, limit: { ...N, description: "Default 20, max 50" },
    }),
    fn("get_task", "Full details of one task including its subtasks.", { id: S }, ["id"]),
    fn("update_task", "Update a task (status, priority, due date, title, description, or assignee).", {
      id: S, status: { ...S, enum: TASK_STATUSES }, priority: { ...S, enum: PRIORITIES }, due_date: { ...S, description: "YYYY-MM-DD" },
      title: S, description: S, assigned_to: { ...S, description: "User UUID" },
    }, ["id"]),
    fn("search_staff", "Find colleagues by name, username, or email, or list a department.", { query: S, department_id: S, limit: N }),
    fn("list_departments", "List departments with head and member count."),
  ];
  if (role === "staff") return personal;

  const manager = [
    ...personal,
    fn("get_overview", "Company snapshot: staff counts, tasks by status, overdue tasks, today's attendance, pending leave, and open inquiries. Use for 'how are we doing'."),
    fn("get_staff_profile", "Detailed profile of one staff member: role, department, points, streak, 14-day attendance, task stats and recent point history.", { user_id: S }, ["user_id"]),
    fn("task_stats", "Aggregate task counts for charts, grouped by status, priority, assignee or department.", {
      group_by: { ...S, enum: ["status", "priority", "assignee", "department"] }, days: { ...N, description: "Only tasks created in the last N days (optional)" },
    }, ["group_by"]),
    fn("attendance_report", "Attendance for one date (who is present/absent) or the last N days for one person.", {
      date: { ...S, description: "YYYY-MM-DD, default today" }, user_id: S, days: { ...N, description: "With user_id: number of days to look back (default 14)" },
    }),
    fn("create_task", "Create a task for a staff member. Look up the assignee with search_staff first.", {
      title: S, description: S, assigned_to: { ...S, description: "User UUID" }, department_id: S, priority: { ...S, enum: PRIORITIES },
      status: { ...S, enum: TASK_STATUSES }, due_date: S, due_time: S, points: N, client_project_id: S,
    }, ["title", "assigned_to"]),
    fn("create_subtask", "Create a subtask under an existing task.", {
      task_id: S, title: S, description: S, assigned_to: S, priority: { ...S, enum: PRIORITIES }, points: N, due_date: S, due_time: S, stage: N, time_limit_hr: N,
    }, ["task_id", "title", "assigned_to"]),
    fn("list_clients", "List or search clients (company, contact, status).", { search: S, limit: N }),
    fn("get_client", "One client with all of their projects, progress and payment totals.", { id: S }, ["id"]),
    fn("list_projects", "Client projects, optionally by client or status.", { client_id: S, status: S, limit: N }),
  ];
  if (role === "team_head") return manager;

  return [
    ...manager,
    fn("list_leave_requests", "Staff leave requests, optionally by status.", { status: { ...S, enum: ["pending", "approved", "rejected"] }, limit: N }),
    fn("decide_leave_request", "Approve or reject a leave request. Only do this when the user clearly asks.", { id: S, status: { ...S, enum: ["approved", "rejected"] } }, ["id", "status"]),
    fn("list_inquiries", "Website inquiries and pricing requests.", { status: { ...S, enum: ["new", "in-progress", "completed", "closed"] }, limit: N }),
    fn("update_inquiry_status", "Change an inquiry's status.", { id: S, status: { ...S, enum: ["new", "in-progress", "completed", "closed"] } }, ["id", "status"]),
  ];
}

const SAFE_STAFF = "user_id, full_name, username, email, role, department_id, is_department_head, profile_photo_url, avatar_url, total_points, coins, attendance_streak, hire_date, application_status";

async function nameMap(ids: string[]) {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  if (!uniq.length) return {} as Record<string, string>;
  const { data } = await db.from("staff_profiles").select("user_id, full_name").in("user_id", uniq);
  return Object.fromEntries((data || []).map((p: any) => [p.user_id, p.full_name]));
}

async function me() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) fail("Not signed in");
  return user!;
}

const tally = (rows: any[], key: (r: any) => string) => {
  const out: Record<string, number> = {};
  rows.forEach((r) => { const k = key(r) || "unknown"; out[k] = (out[k] || 0) + 1; });
  return Object.entries(out).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

const count = async (table: string, apply?: (q: any) => any) => {
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: c } = await q;
  return c ?? 0;
};

export async function runTool(name: string, args: any = {}): Promise<any> {
  switch (name) {
    case "my_summary": {
      const user = await me();
      const [{ data: profile }, { data: tasks }, { data: att }] = await Promise.all([
        db.from("staff_profiles").select(SAFE_STAFF).eq("user_id", user.id).maybeSingle(),
        db.from("staff_tasks").select("id, title, status, priority, due_date, points").eq("assigned_to", user.id).neq("status", "completed").order("due_date", { ascending: true, nullsFirst: false }).limit(15),
        db.from("staff_attendance").select("date, is_late").eq("user_id", user.id).gte("date", daysAgo(14)),
      ]);
      const open = tasks || [];
      return {
        today: today(), profile, attendance_last_14_days: (att || []).length, late_days: (att || []).filter((a: any) => a.is_late).length,
        open_tasks: open, overdue_tasks: open.filter((t: any) => t.due_date && t.due_date < today()).length,
      };
    }

    case "search_staff": {
      let q = db.from("staff_profiles").select(SAFE_STAFF).order("full_name").limit(Math.min(args.limit ?? 30, 100));
      if (args.department_id) q = q.eq("department_id", args.department_id);
      if (args.query) {
        const s = String(args.query).replace(/[,()%]/g, " ").trim();
        q = q.or(`full_name.ilike.%${s}%,username.ilike.%${s}%,email.ilike.%${s}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).filter((p: any) => p.application_status !== "dismissed");
    }
    // Backwards compatible alias for the original tool name
    case "list_staff":
      return runTool("search_staff", { department_id: args.department_id, limit: 100 });

    case "list_departments": {
      const [{ data: depts, error }, { data: staff }] = await Promise.all([
        db.from("departments").select("id, name, description, head_id"),
        db.from("staff_profiles").select("department_id, application_status"),
      ]);
      if (error) throw error;
      const heads = await nameMap((depts || []).map((d: any) => d.head_id));
      return (depts || []).map((d: any) => ({
        ...d, head_name: heads[d.head_id] || null,
        members: (staff || []).filter((s: any) => s.department_id === d.id && s.application_status !== "dismissed").length,
      }));
    }

    case "get_staff_profile": {
      if (!isUuid(args.user_id)) fail("user_id must be a UUID. Use search_staff to find it.");
      const [{ data: p }, { data: att }, { data: tasks }, { data: pts }] = await Promise.all([
        db.from("staff_profiles").select(`${SAFE_STAFF}, about_me, gender, work_confidence_level`).eq("user_id", args.user_id).maybeSingle(),
        db.from("staff_attendance").select("date, is_late").eq("user_id", args.user_id).gte("date", daysAgo(14)),
        db.from("staff_tasks").select("status, due_date").eq("assigned_to", args.user_id),
        db.from("user_points_log").select("points, reason, created_at").eq("user_id", args.user_id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (!p) fail("Staff member not found or not visible to you");
      let department: string | null = null;
      if (p.department_id) {
        const { data: d } = await db.from("departments").select("name").eq("id", p.department_id).maybeSingle();
        department = d?.name ?? null;
      }
      const all = tasks || [];
      return {
        profile: { ...p, department },
        attendance_last_14_days: (att || []).length, late_days: (att || []).filter((a: any) => a.is_late).length,
        tasks: {
          total: all.length, completed: all.filter((t: any) => t.status === "completed").length,
          in_progress: all.filter((t: any) => t.status === "in_progress").length,
          overdue: all.filter((t: any) => t.status !== "completed" && t.due_date && t.due_date < today()).length,
        },
        recent_points: pts || [],
      };
    }

    case "list_tasks": {
      const user = await me();
      let q = db.from("staff_tasks").select("id, title, status, priority, assigned_to, department_id, due_date, points, client_project_id, created_at").order("created_at", { ascending: false }).limit(Math.min(args.limit ?? 20, 50));
      if (args.status) q = q.eq("status", args.status);
      if (args.assigned_to) q = q.eq("assigned_to", args.assigned_to);
      if (args.department_id) q = q.eq("department_id", args.department_id);
      if (args.overdue) q = q.lt("due_date", today()).neq("status", "completed");
      if (args.search) q = q.ilike("title", `%${String(args.search).replace(/[%,]/g, " ")}%`);
      const { data, error } = await q;
      if (error) throw error;
      const names = await nameMap((data || []).map((t: any) => t.assigned_to));
      return (data || []).map((t: any) => ({ ...t, assignee: names[t.assigned_to] || null, is_mine: t.assigned_to === user.id }));
    }

    case "get_task": {
      const [{ data: task, error }, { data: subs }] = await Promise.all([
        db.from("staff_tasks").select("*").eq("id", args.id).maybeSingle(),
        db.from("staff_subtasks").select("id, title, status, assigned_to, stage, due_date, points").eq("task_id", args.id).order("stage"),
      ]);
      if (error) throw error;
      if (!task) fail("Task not found");
      const names = await nameMap([task.assigned_to, task.assigned_by, ...(subs || []).map((s: any) => s.assigned_to)]);
      const { attachments, comments, stage_config, ...rest } = task;
      return {
        ...rest, assignee: names[task.assigned_to], assigned_by_name: names[task.assigned_by],
        subtasks: (subs || []).map((s: any) => ({ ...s, assignee: names[s.assigned_to] })),
      };
    }

    case "create_task": {
      const user = await me();
      if (!isUuid(args.assigned_to)) fail("assigned_to must be a user UUID. Use search_staff first.");
      const payload: any = {
        title: args.title, description: args.description ?? null, assigned_to: args.assigned_to, assigned_by: user.id,
        department_id: args.department_id ?? null, priority: args.priority ?? "medium", status: args.status ?? "pending",
        due_date: args.due_date ?? null, due_time: args.due_time ?? null, points: args.points ?? 10, client_project_id: args.client_project_id ?? null,
      };
      const { data, error } = await db.from("staff_tasks").insert(payload).select("id, title, status, priority, due_date").single();
      if (error) throw error;
      return { created: true, ...data };
    }

    case "create_subtask": {
      const user = await me();
      const payload: any = {
        task_id: args.task_id, title: args.title, description: args.description ?? null, assigned_to: args.assigned_to, created_by: user.id,
        priority: args.priority ?? "medium", points: args.points ?? 5, due_date: args.due_date ?? null, due_time: args.due_time ?? null,
        stage: args.stage ?? 1, time_limit_hr: args.time_limit_hr ?? null,
      };
      const { data, error } = await db.from("staff_subtasks").insert(payload).select("id, title").single();
      if (error) throw error;
      return { created: true, ...data };
    }

    case "update_task": {
      const { id, ...rest } = args;
      const patch: any = {};
      ["status", "priority", "due_date", "title", "description", "assigned_to"].forEach((k) => { if (rest[k] !== undefined) patch[k] = rest[k]; });
      if (!Object.keys(patch).length) fail("Nothing to update");
      if (patch.status === "completed") patch.completed_at = new Date().toISOString();
      const { data, error } = await db.from("staff_tasks").update(patch).eq("id", id).select("id, title, status, priority, due_date, assigned_to").maybeSingle();
      if (error) throw error;
      if (!data) fail("Task not found, or you are not allowed to change it");
      return { updated: true, ...data };
    }

    case "get_overview": {
      const [staffRows, tasks, present, leave, inquiries] = await Promise.all([
        db.from("staff_profiles").select("role, application_status").then((r: any) => r.data || []),
        db.from("staff_tasks").select("status, due_date").then((r: any) => r.data || []),
        count("staff_attendance", (q) => q.eq("date", today())),
        count("staff_leave_requests", (q) => q.eq("status", "pending")),
        count("inquiries", (q) => q.eq("status", "new")),
      ]);
      const current = staffRows.filter((s: any) => s.application_status !== "dismissed");
      return {
        date: today(),
        staff: { total: current.length, by_role: tally(current, (s) => s.role) },
        tasks: { total: tasks.length, by_status: tally(tasks, (t) => t.status), overdue: tasks.filter((t: any) => t.status !== "completed" && t.due_date && t.due_date < today()).length },
        attendance_today: { present, absent_or_not_marked: Math.max(current.length - present, 0) },
        pending_leave_requests: leave, new_inquiries: inquiries,
      };
    }

    case "task_stats": {
      let q = db.from("staff_tasks").select("status, priority, assigned_to, department_id, created_at").limit(2000);
      if (args.days) q = q.gte("created_at", new Date(Date.now() - args.days * 86400000).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      if (args.group_by === "assignee") {
        const names = await nameMap(rows.map((r: any) => r.assigned_to));
        return { group_by: "assignee", total: rows.length, data: tally(rows, (r) => names[r.assigned_to] || "Unknown").slice(0, 12) };
      }
      if (args.group_by === "department") {
        const { data: d } = await db.from("departments").select("id, name");
        const dm = Object.fromEntries((d || []).map((x: any) => [x.id, x.name]));
        return { group_by: "department", total: rows.length, data: tally(rows, (r) => dm[r.department_id] || "No department") };
      }
      return { group_by: args.group_by, total: rows.length, data: tally(rows, (r) => r[args.group_by]) };
    }

    case "attendance_report": {
      if (args.user_id) {
        const { data, error } = await db.from("staff_attendance").select("date, check_in_time, is_late").eq("user_id", args.user_id).gte("date", daysAgo(args.days ?? 14)).order("date");
        if (error) throw error;
        return { user_id: args.user_id, days_present: (data || []).length, late: (data || []).filter((a: any) => a.is_late).length, records: data };
      }
      const date = args.date || today();
      const [{ data: att }, { data: staff }] = await Promise.all([
        db.from("staff_attendance").select("user_id, check_in_time, is_late").eq("date", date),
        db.from("staff_profiles").select("user_id, full_name, application_status, role"),
      ]);
      const current = (staff || []).filter((s: any) => s.application_status !== "dismissed" && s.role !== "hr");
      const presentIds = new Set((att || []).map((a: any) => a.user_id));
      return {
        date, present: current.filter((s: any) => presentIds.has(s.user_id)).map((s: any) => ({ name: s.full_name, late: (att || []).find((a: any) => a.user_id === s.user_id)?.is_late })),
        absent: current.filter((s: any) => !presentIds.has(s.user_id)).map((s: any) => s.full_name),
      };
    }

    case "list_clients": {
      let q = db.from("clients").select("id, company_name, contact_person, email, phone, status, created_at").order("created_at", { ascending: false }).limit(Math.min(args.limit ?? 20, 50));
      if (args.search) { const s = String(args.search).replace(/[,()%]/g, " "); q = q.or(`company_name.ilike.%${s}%,contact_person.ilike.%${s}%,email.ilike.%${s}%`); }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "get_client": {
      const [{ data: c, error }, { data: projects }] = await Promise.all([
        db.from("clients").select("id, company_name, contact_person, email, phone, address, status, notes, created_at").eq("id", args.id).maybeSingle(),
        db.from("client_projects").select("id, title, project_type, package_type, status, progress, total_amount, amount_paid, renewal_date, next_payment_date, live_preview_url").eq("client_id", args.id),
      ]);
      if (error) throw error;
      if (!c) fail("Client not found");
      const list = projects || [];
      return {
        ...c, projects: list,
        totals: { billed: list.reduce((s: number, p: any) => s + (p.total_amount || 0), 0), paid: list.reduce((s: number, p: any) => s + (p.amount_paid || 0), 0) },
      };
    }

    case "list_projects": {
      let q = db.from("client_projects").select("id, title, client_id, project_type, package_type, status, progress, total_amount, amount_paid, renewal_date").order("created_at", { ascending: false }).limit(Math.min(args.limit ?? 20, 50));
      if (args.client_id) q = q.eq("client_id", args.client_id);
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((p: any) => p.client_id).filter(Boolean)));
      const { data: cl } = ids.length ? await db.from("clients").select("id, company_name").in("id", ids) : { data: [] };
      const cm = Object.fromEntries((cl || []).map((c: any) => [c.id, c.company_name]));
      return (data || []).map((p: any) => ({ ...p, client: cm[p.client_id] || null }));
    }

    case "list_leave_requests": {
      let q = db.from("staff_leave_requests").select("id, user_id, leave_type, start_date, end_date, reason, status, created_at").order("created_at", { ascending: false }).limit(Math.min(args.limit ?? 20, 50));
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) throw error;
      const names = await nameMap((data || []).map((r: any) => r.user_id));
      return (data || []).map((r: any) => ({ ...r, staff: names[r.user_id] || null }));
    }

    case "decide_leave_request": {
      const { data, error } = await db.from("staff_leave_requests").update({ status: args.status, updated_at: new Date().toISOString() }).eq("id", args.id).select("id, status").maybeSingle();
      if (error) throw error;
      if (!data) fail("Request not found or not permitted");
      return { updated: true, ...data };
    }

    case "list_inquiries": {
      let q = db.from("inquiries").select("id, name, email, phone, service, status, created_at").order("created_at", { ascending: false }).limit(Math.min(args.limit ?? 15, 50));
      if (args.status) q = q.eq("status", args.status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "update_inquiry_status": {
      const { data, error } = await db.from("inquiries").update({ status: args.status, updated_at: new Date().toISOString() }).eq("id", args.id).select("id, status").maybeSingle();
      if (error) throw error;
      if (!data) fail("Inquiry not found or not permitted");
      return { updated: true, ...data };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/** Short human label for the activity log shown under a reply. */
export const TOOL_LABELS: Record<string, string> = {
  my_summary: "Reading your summary", search_staff: "Searching staff", list_staff: "Searching staff", list_departments: "Reading departments",
  get_staff_profile: "Opening staff profile", list_tasks: "Reading tasks", get_task: "Opening task", create_task: "Creating task",
  create_subtask: "Creating subtask", update_task: "Updating task", get_overview: "Reading company overview", task_stats: "Counting tasks",
  attendance_report: "Checking attendance", list_clients: "Searching clients", get_client: "Opening client", list_projects: "Reading projects",
  list_leave_requests: "Reading leave requests", decide_leave_request: "Updating leave request", list_inquiries: "Reading inquiries",
  update_inquiry_status: "Updating inquiry",
};
export const WRITE_TOOLS = new Set(["create_task", "create_subtask", "update_task", "decide_leave_request", "update_inquiry_status"]);
