// EMMA - Executive Multi-task Management Assistant
// Uses Lovable AI Gateway with tool-calling to plan task/subtask creation.
// The frontend executes the returned tool calls against Supabase using the
// authenticated user's session (so RLS applies).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are EMMA, the workspace assistant for VAW Technologies.
You help HR, team heads and staff look up information, plan work, and create or update tasks.
Use the provided tools to read or change real data. Never claim something was done unless a tool confirmed it.
Be concise and accurate. Format replies in markdown. Follow any formatting and safety instructions in later system messages.`;

// Default tools, used only if the client does not send its own `tools` list.
const defaultTools = [
  {
    type: "function",
    function: {
      name: "list_staff",
      description: "List staff members. Optionally filter by department_id.",
      parameters: {
        type: "object",
        properties: {
          department_id: { type: "string", description: "Optional department UUID" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_departments",
      description: "List all departments with their IDs.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List recent tasks for the current user's scope.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max number of tasks (default 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new staff task. Returns the created task id.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          assigned_to: {
            type: "string",
            description: "User UUID of assignee (look up via list_staff)",
          },
          department_id: { type: "string", description: "Optional department UUID" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "overdue", "handover", "pending_approval", "review_pending"],
          },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          due_time: { type: "string", description: "HH:MM:SS" },
          points: { type: "number" },
          client_project_id: { type: "string" },
        },
        required: ["title", "assigned_to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_subtask",
      description: "Create a subtask under an existing task.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "Parent staff_tasks.id" },
          title: { type: "string" },
          description: { type: "string" },
          assigned_to: { type: "string", description: "User UUID of assignee" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          points: { type: "number" },
          due_date: { type: "string" },
          due_time: { type: "string" },
          stage: { type: "number", description: "Stage number, default 1" },
          time_limit_hr: { type: "number" },
        },
        required: ["task_id", "title", "assigned_to"],
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, role, tools: clientTools } = await req.json();
    const tools = Array.isArray(clientTools) && clientTools.length ? clientTools.slice(0, 40) : defaultTools;
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sysWithRole = `${SYSTEM_PROMPT}\n\nThe current user role is: ${role || "staff"}.`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: sysWithRole }, ...messages],
          tools,
        }),
      },
    );

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Workspace Settings → Usage.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const message = data.choices?.[0]?.message ?? { role: "assistant", content: "" };

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("emma-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
