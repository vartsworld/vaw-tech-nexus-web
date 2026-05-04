import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User as UserIcon, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ChatMsg = {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
  name?: string;
};

interface EmmaAssistantProps {
  role: "hr" | "team_head";
}

// Run a tool call against Supabase using the current user's session (RLS applies)
async function runTool(name: string, args: any) {
  switch (name) {
    case "list_departments": {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, head_id");
      if (error) throw error;
      return data;
    }
    case "list_staff": {
      let q = supabase
        .from("staff_profiles")
        .select("user_id, full_name, username, email, role, department_id, is_department_head");
      if (args?.department_id) q = q.eq("department_id", args.department_id);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data;
    }
    case "list_tasks": {
      const { data, error } = await supabase
        .from("staff_tasks")
        .select("id, title, status, priority, assigned_to, department_id, due_date, created_at")
        .order("created_at", { ascending: false })
        .limit(args?.limit ?? 20);
      if (error) throw error;
      return data;
    }
    case "create_task": {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: any = {
        title: args.title,
        description: args.description ?? null,
        assigned_to: args.assigned_to,
        assigned_by: user.id,
        department_id: args.department_id ?? null,
        priority: args.priority ?? "medium",
        status: args.status ?? "pending",
        due_date: args.due_date ?? null,
        due_time: args.due_time ?? null,
        points: args.points ?? 10,
        client_project_id: args.client_project_id ?? null,
      };
      const { data, error } = await supabase
        .from("staff_tasks")
        .insert(payload)
        .select("id, title")
        .single();
      if (error) throw error;
      return data;
    }
    case "create_subtask": {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: any = {
        task_id: args.task_id,
        title: args.title,
        description: args.description ?? null,
        assigned_to: args.assigned_to,
        created_by: user.id,
        priority: args.priority ?? "medium",
        points: args.points ?? 5,
        due_date: args.due_date ?? null,
        due_time: args.due_time ?? null,
        stage: args.stage ?? 1,
        time_limit_hr: args.time_limit_hr ?? null,
      };
      const { data, error } = await supabase
        .from("staff_subtasks")
        .insert(payload)
        .select("id, title")
        .single();
      if (error) throw error;
      return data;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const EmmaAssistant = ({ role }: EmmaAssistantProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm **EMMA** — your task & team assistant. Tell me what needs to get done and I'll plan it, create the tasks, and assign the right people. Try: *\"Create a high-priority task for the design team to revamp the landing page by Friday, with subtasks for wireframes, copy, and review.\"*",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const callEmma = async (history: ChatMsg[]): Promise<ChatMsg[]> => {
    // Strip ui-only fields when sending
    const apiMessages = history.map((m) => {
      if (m.role === "tool") {
        return { role: "tool", content: m.content, tool_call_id: m.tool_call_id, name: m.name };
      }
      if (m.role === "assistant" && m.tool_calls) {
        return { role: "assistant", content: m.content || "", tool_calls: m.tool_calls };
      }
      return { role: m.role, content: m.content };
    });

    const { data, error } = await supabase.functions.invoke("emma-chat", {
      body: { messages: apiMessages, role },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    const msg = data.message;
    let next: ChatMsg[] = [
      ...history,
      {
        role: "assistant",
        content: msg.content || "",
        tool_calls: msg.tool_calls,
      },
    ];

    // Execute tool calls and recurse
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const fnName = tc.function.name;
        let args: any = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch { args = {}; }
        let result: any;
        try {
          result = await runTool(fnName, args);
        } catch (err: any) {
          result = { error: err.message ?? String(err) };
        }
        next = [
          ...next,
          {
            role: "tool",
            tool_call_id: tc.id,
            name: fnName,
            content: JSON.stringify(result).slice(0, 6000),
          },
        ];
      }
      return await callEmma(next);
    }

    return next;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newHistory: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setLoading(true);
    try {
      const updated = await callEmma(newHistory);
      setMessages(updated);
    } catch (e: any) {
      console.error(e);
      toast({ title: "EMMA error", description: e.message ?? "Something went wrong", variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${e.message ?? "Failed to reach EMMA."}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              EMMA
              <Badge variant="secondary" className="text-[10px]">AI Assistant</Badge>
            </CardTitle>
            <CardDescription>Plans, creates, and assigns tasks for your team</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full" ref={scrollRef as any}>
          <div className="p-4 space-y-4">
            {messages.map((m, i) => {
              if (m.role === "tool") {
                let parsed: any = null;
                try { parsed = JSON.parse(m.content); } catch {}
                const isError = parsed && parsed.error;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Wrench className="w-3.5 h-3.5 mt-1 text-muted-foreground" />
                    <div className={`flex-1 rounded-md border px-2 py-1 ${isError ? "border-destructive/50 bg-destructive/5 text-destructive" : "border-border bg-muted/40 text-muted-foreground"}`}>
                      <span className="font-mono">{m.name}</span>
                      {isError ? ` → ${parsed.error}` : ` → ${Array.isArray(parsed) ? `${parsed.length} result(s)` : "ok"}`}
                    </div>
                  </div>
                );
              }
              const isUser = m.role === "user";
              return (
                <div key={i} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-purple-500 text-primary-foreground"}`}>
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.content || (m.tool_calls ? <span className="italic text-muted-foreground">Calling {m.tool_calls.length} tool(s)…</span> : null)}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-purple-500 text-primary-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">EMMA is thinking…</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <div className="border-t p-3 flex gap-2">
        <Input
          placeholder="Ask EMMA to create a task, assign someone, break work into subtasks…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
};

export default EmmaAssistant;
