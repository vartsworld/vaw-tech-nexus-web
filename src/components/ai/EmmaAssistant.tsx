import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Square, RotateCcw, Wrench, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Markdown } from "./emma/markdown";
import { EmmaRole, TOOL_LABELS, WRITE_TOOLS, runTool, toolDefinitions } from "./emma/tools";

type ChatMsg = {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
  name?: string;
  error?: boolean;
};

interface EmmaAssistantProps {
  role: EmmaRole;
  className?: string;
}

const MAX_TOOL_ROUNDS = 8;

const FORMAT_GUIDE = `
## How to answer
- Write in clean markdown: short paragraphs, **bold** key facts, bullet lists, and tables for comparisons. Lead with the answer, then detail. No filler, no emojis unless the user uses them.
- Visual blocks are rendered for the user. Use them whenever data is better seen than read. Put each block in its own fenced code block with exactly one of these languages, containing valid JSON only:

\`\`\`emma-chart
{"type":"bar","title":"Tasks by status","subtitle":"All staff","data":[{"label":"Pending","value":12},{"label":"Completed","value":30}]}
\`\`\`
type is bar, line, area, pie or donut. For several series use "series":[{"key":"a","label":"A"}] and put those keys in each data row (xKey defaults to "label").

\`\`\`emma-card
{"kind":"staff","title":"Asha Nair","subtitle":"Designer · Creative","image":"<profile_photo_url>","badges":["Active"],"fields":[{"label":"Points","value":420},{"label":"Streak","value":"6 days"}]}
\`\`\`
kind is staff, client, project, task or generic. Optional: "progress" (0-100), "actions":[{"label":"Open","href":"/hr?staff"}]. For several cards use a JSON array. Use a staff card whenever you present a person, a client card for a client, a project card for a project.

\`\`\`emma-stats
[{"label":"Present today","value":18,"hint":"of 22"},{"label":"Overdue","value":3,"tone":"red"}]
\`\`\`

- Only put real numbers from tool results in charts and cards. Never invent data. If a tool returns nothing, say so.
- Do not repeat a chart's data again as a table unless asked.

## Rules
- Use tools to look things up before answering questions about people, tasks, clients or numbers. Look up IDs with search_staff/list_clients before using them.
- Never claim an action happened unless the tool result confirms it. After a write, state exactly what changed.
- For anything that changes several records at once, or approves/rejects leave, confirm with the user first unless they have already clearly asked for it.
- You cannot dismiss staff, delete records, or change passwords. If asked, explain where to do it in the HR dashboard.
- Be honest about what you can't see (permissions limit what you can read).`;

const SUGGESTIONS: Record<EmmaRole, string[]> = {
  hr: [
    "Give me a company snapshot for today",
    "Chart tasks by status",
    "Who is absent today?",
    "Show pending leave requests",
    "Summarise new inquiries",
  ],
  team_head: [
    "What's overdue in my team?",
    "Chart tasks by assignee",
    "Create a task for someone on my team",
    "Who hasn't marked attendance today?",
  ],
  staff: [
    "Plan my day",
    "What's overdue for me?",
    "How's my attendance and points?",
    "Mark my task as in progress",
  ],
};

const ROLE_BLURB: Record<EmmaRole, string> = {
  hr: "Company-wide: people, tasks, attendance, leave, clients, inquiries.",
  team_head: "Your team: tasks, attendance, people and client projects.",
  staff: "Your day: tasks, attendance, points and colleagues.",
};

/** Keep tool results within a size the model can use without breaking the JSON. */
function compact(result: any, limit = 12000): string {
  const s = JSON.stringify(result ?? null);
  if (s.length <= limit) return s;
  if (Array.isArray(result)) {
    let items = result.slice();
    while (items.length > 1 && JSON.stringify({ truncated: true, total: result.length, items }).length > limit) items = items.slice(0, Math.floor(items.length * 0.8));
    return JSON.stringify({ truncated: true, total: result.length, shown: items.length, items });
  }
  return s.slice(0, limit);
}

const EmmaAssistant = ({ role, className }: EmmaAssistantProps) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [me, setMe] = useState<{ id?: string; name?: string; role?: string; department?: string }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Who is asking (for personalised answers) and restore the last conversation
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await (supabase as any).from("staff_profiles").select("full_name, role, department_id").eq("user_id", user.id).maybeSingle();
      let department: string | undefined;
      if (p?.department_id) {
        const { data: d } = await (supabase as any).from("departments").select("name").eq("id", p.department_id).maybeSingle();
        department = d?.name;
      }
      setMe({ id: user.id, name: p?.full_name, role: p?.role, department });
      try {
        const saved = JSON.parse(localStorage.getItem(`emma_chat_${user.id}`) || "[]");
        if (Array.isArray(saved) && saved.length) setMessages(saved);
      } catch { /* ignore corrupt history */ }
    })();
  }, []);

  useEffect(() => {
    if (!me.id) return;
    try { localStorage.setItem(`emma_chat_${me.id}`, JSON.stringify(messages.slice(-40))); } catch { /* storage full */ }
  }, [messages, me.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const tools = useMemo(() => toolDefinitions(role), [role]);

  const systemMessage = useMemo(() => {
    const now = new Date();
    return {
      role: "system",
      content: `You are talking with ${me.name || "a VAW Technologies team member"}${me.role ? ` (role: ${me.role}` : ""}${me.department ? `, department: ${me.department}` : ""}${me.role ? ")" : ""}. Access level: ${role}. ` +
        `Today is ${now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} (${now.toISOString().slice(0, 10)}), timezone Asia/Kolkata. ` +
        `You are EMMA, ${me.name?.split(" ")[0] || "their"}'s workspace companion at VAW Technologies: calm, direct, warm, and efficient. Address them by first name occasionally, not every message.\n${FORMAT_GUIDE}`,
    };
  }, [me, role]);

  const toApi = (history: ChatMsg[]) => {
    const lastUser = history.map((m) => m.role).lastIndexOf("user");
    return history
      .filter((m, i) => i >= lastUser || (m.role !== "tool" && !m.tool_calls && !m.error && m.content))
      .map((m) => {
        if (m.role === "tool") return { role: "tool", content: m.content, tool_call_id: m.tool_call_id, name: m.name };
        if (m.role === "assistant" && m.tool_calls) return { role: "assistant", content: m.content || "", tool_calls: m.tool_calls };
        return { role: m.role, content: m.content };
      });
  };

  const run = useCallback(async (history: ChatMsg[]) => {
    abortRef.current = false;
    setLoading(true);
    let current = history;
    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        setStatus(round === 0 ? "Thinking…" : "Working on it…");
        const { data, error } = await supabase.functions.invoke("emma-chat", {
          body: { messages: [systemMessage, ...toApi(current)], role, tools },
        });
        if (abortRef.current) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const msg = data.message;
        current = [...current, { role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls?.length ? msg.tool_calls : undefined }];
        setMessages(current);
        if (!msg.tool_calls?.length) return;

        for (const tc of msg.tool_calls) {
          if (abortRef.current) return;
          const name = tc.function.name;
          setStatus(`${TOOL_LABELS[name] || name}…`);
          let args: any = {};
          try { args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}; } catch { args = {}; }
          let result: any;
          let failed = false;
          try {
            if (!tools.some((t) => t.function.name === name) && name !== "list_staff") throw new Error("That action isn't available for your role.");
            result = await runTool(name, args);
          } catch (err: any) {
            failed = true;
            result = { error: err?.message ?? String(err) };
          }
          current = [...current, { role: "tool", tool_call_id: tc.id, name, content: compact(result), error: failed }];
          setMessages(current);
        }
      }
      setMessages([...current, { role: "assistant", content: "I hit my step limit on this one. Tell me which part to continue with." }]);
    } catch (e: any) {
      console.error("[EMMA]", e);
      const text = /rate limit/i.test(e?.message || "") ? "EMMA is getting a lot of requests. Try again in a moment."
        : /credits/i.test(e?.message || "") ? "AI credits are exhausted. Ask an admin to top up usage."
        : "I couldn't reach the AI service. Check your connection and try again.";
      setMessages([...current, { role: "assistant", content: text, error: true }]);
    } finally {
      setLoading(false);
      setStatus("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemMessage, tools, role]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    const next: ChatMsg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    run(next);
  };

  const retry = () => {
    const lastUser = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUser < 0 || loading) return;
    const next = messages.slice(0, lastUser + 1);
    setMessages(next);
    run(next);
  };

  const stop = () => { abortRef.current = true; setLoading(false); setStatus(""); };
  const reset = () => { if (!loading) setMessages([]); };

  // Group each assistant reply with the tool steps that preceded it
  const rendered = useMemo(() => {
    const out: { kind: "user" | "assistant"; text: string; tools: ChatMsg[]; error?: boolean; idx: number }[] = [];
    let pending: ChatMsg[] = [];
    messages.forEach((m, idx) => {
      if (m.role === "user") { out.push({ kind: "user", text: m.content, tools: [], idx }); pending = []; }
      else if (m.role === "tool") pending.push(m);
      else if (m.content?.trim()) { out.push({ kind: "assistant", text: m.content, tools: pending, error: m.error, idx }); pending = []; }
    });
    return out;
  }, [messages]);

  const first = me.name?.split(" ")[0];
  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div className={cn("flex h-[calc(100dvh-12rem)] min-h-[500px] flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-sm", className)}>
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sm font-bold text-sky-300 ring-1 ring-sky-400/25">E</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-white">EMMA</h2>
          <p className="truncate text-xs text-white/50">{ROLE_BLURB[role]}</p>
        </div>
        {!!messages.length && (
          <Button variant="ghost" size="sm" onClick={reset} disabled={loading} className="h-8 gap-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" />New chat
          </Button>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!rendered.length && (
          <div className="mx-auto flex h-full max-w-xl flex-col justify-center">
            <h3 className="text-xl font-semibold text-white">{first ? `Hi ${first}, what do you need?` : "What do you need?"}</h3>
            <p className="mt-1 text-sm text-white/55">I can look things up, build charts and profile cards, and create or update work for you. Ask in plain language.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SUGGESTIONS[role].map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-sky-400/40 hover:bg-white/10 hover:text-white">{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-5">
          {rendered.map((m) =>
            m.kind === "user" ? (
              <div key={m.idx} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-sky-600 px-3.5 py-2 text-sm text-white">{m.text}</div>
              </div>
            ) : (
              <div key={m.idx} className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-xs font-bold text-sky-300">E</div>
                <div className="min-w-0 flex-1">
                  {!!m.tools.length && (
                    <details className="group mb-2 text-xs">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-white/45 hover:text-white/70">
                        <Wrench className="h-3 w-3" />
                        {m.tools.length} step{m.tools.length > 1 ? "s" : ""}
                        {m.tools.some((t) => WRITE_TOOLS.has(t.name || "") && !t.error) && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">changes made</span>}
                        {m.tools.some((t) => t.error) && <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-300">some failed</span>}
                      </summary>
                      <ul className="mt-1.5 space-y-1 border-l border-white/10 pl-3">
                        {m.tools.map((t, i) => {
                          let parsed: any; try { parsed = JSON.parse(t.content); } catch { /* not json */ }
                          return (
                            <li key={i} className={cn("text-white/50", t.error && "text-red-300")}>
                              {TOOL_LABELS[t.name || ""] || t.name}
                              {t.error ? ` — ${parsed?.error || "failed"}` : Array.isArray(parsed) ? ` — ${parsed.length} result${parsed.length === 1 ? "" : "s"}` : ""}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                  {m.error ? (
                    <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{m.text}</span>
                    </div>
                  ) : <Markdown text={m.text} />}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-white/55" role="status" aria-live="polite">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/15"><Sparkles className="h-3.5 w-3.5 animate-pulse text-sky-300" /></div>
              {status || "Thinking…"}
            </div>
          )}

          {!loading && lastIsUser && (
            <Button variant="ghost" size="sm" onClick={retry} className="h-8 gap-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Try again</Button>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
            placeholder="Ask EMMA anything about your work…"
            className="min-h-10 max-h-[140px] resize-none border-white/10 bg-white/5 py-2.5 text-sm text-white placeholder:text-white/40"
          />
          {loading ? (
            <Button onClick={stop} size="icon" variant="secondary" className="h-10 w-10 shrink-0" aria-label="Stop"><Square className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={() => send(input)} disabled={!input.trim()} size="icon" className="h-10 w-10 shrink-0 bg-sky-600 text-white hover:bg-sky-500" aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmmaAssistant;
