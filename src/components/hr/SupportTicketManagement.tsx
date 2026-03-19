import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Search,
  MessageSquare,
  Bug,
  HeadphonesIcon,
  Lightbulb,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Send,
  Filter,
  Loader2,
  FileText,
  ArrowUpRight,
  RefreshCw,
  User,
  Building2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Ticket {
  id: string;
  client_id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  metadata: any;
  routing_status: string;
  routed_to_department_id: string;
  routed_task_id: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  client_profiles?: { company_name: string; contact_person: string; email: string } | null;
}

const SupportTicketManagement = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [reassignDept, setReassignDept] = useState("");

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_feedback")
      .select("*, client_profiles!client_feedback_client_id_fkey(company_name, contact_person, email)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tickets");
      console.error(error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from("departments").select("id, name, head_id");
    if (data) setDepartments(data);
  };

  const handleRespond = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setIsResponding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("client_feedback")
        .update({
          response: responseText,
          responded_at: new Date().toISOString(),
          responded_by: user?.id || null,
          status: "in_progress",
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;
      toast.success("Response sent to client");
      setResponseText("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsResponding(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    const { error } = await supabase
      .from("client_feedback")
      .update({ status: "resolved" })
      .eq("id", ticketId);
    if (error) toast.error("Failed to resolve");
    else {
      toast.success("Ticket resolved");
      fetchTickets();
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    }
  };

  const handleReassign = async () => {
    if (!selectedTicket || !reassignDept) return;
    try {
      // Find dept head
      const { data: head } = await supabase
        .from("staff_profiles")
        .select("user_id")
        .eq("department_id", reassignDept)
        .eq("is_department_head", true)
        .limit(1)
        .maybeSingle();

      // Update the linked task if exists
      if (selectedTicket.routed_task_id && head) {
        await supabase
          .from("staff_tasks")
          .update({ assigned_to: head.user_id, department_id: reassignDept })
          .eq("id", selectedTicket.routed_task_id);
      }

      await supabase
        .from("client_feedback")
        .update({ routed_to_department_id: reassignDept, routing_status: "routed" })
        .eq("id", selectedTicket.id);

      const deptName = departments.find(d => d.id === reassignDept)?.name || "department";
      toast.success(`Ticket reassigned to ${deptName}`);
      setReassignDept("");
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "bug_report": return <Bug className="w-4 h-4 text-destructive" />;
      case "support": return <HeadphonesIcon className="w-4 h-4 text-primary" />;
      case "update_request": return <Lightbulb className="w-4 h-4 text-blue-400" />;
      default: return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "bug_report": return "Technical Issue";
      case "support": return "Billing Inquiry";
      case "update_request": return "Project Update";
      case "suggestion": return "Suggestion";
      default: return type;
    }
  };

  const priorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      high: "bg-destructive/20 text-destructive",
      medium: "bg-amber-500/20 text-amber-500",
      low: "bg-muted text-muted-foreground",
    };
    return (
      <Badge variant="outline" className={cn("border-0 text-[10px] uppercase font-black", styles[priority] || styles.medium)}>
        {priority}
      </Badge>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-500",
      in_progress: "bg-blue-500/20 text-blue-400",
      resolved: "bg-green-500/20 text-green-500",
    };
    return (
      <Badge variant="outline" className={cn("border-0 text-[10px] uppercase font-black", styles[status] || styles.pending)}>
        {status?.replace("_", " ")}
      </Badge>
    );
  };

  const filtered = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        t.subject?.toLowerCase().includes(s) ||
        t.message?.toLowerCase().includes(s) ||
        t.client_profiles?.company_name?.toLowerCase().includes(s) ||
        t.client_profiles?.contact_person?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === "pending").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: stats.total, icon: MessageSquare, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
          { label: "In Progress", value: stats.inProgress, icon: ArrowUpRight, color: "text-blue-400" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-green-500" },
        ].map((s, i) => (
          <Card key={i} className="bg-card/50 border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, client, or message..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-muted/50 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 bg-muted/50 border-border">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug_report">Technical Issue</SelectItem>
              <SelectItem value="support">Billing Inquiry</SelectItem>
              <SelectItem value="update_request">Project Update</SelectItem>
              <SelectItem value="suggestion">Suggestion</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTickets} className="border-border text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-primary" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setResponseText(ticket.response || ""); }}
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-start gap-4"
                >
                  <div className="mt-1">{typeIcon(ticket.type)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground truncate">{ticket.subject}</span>
                      {statusBadge(ticket.status)}
                      {priorityBadge(ticket.priority || "medium")}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ticket.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.client_profiles?.company_name || ticket.client_profiles?.contact_person || "Unknown"}
                      </span>
                      <span>{typeLabel(ticket.type)}</span>
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.routing_status === "routed" && (
                        <Badge variant="outline" className="border-0 bg-primary/10 text-primary text-[9px] font-bold">
                          Routed
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={open => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  {typeIcon(selectedTicket.type)}
                  <DialogTitle className="text-lg">{selectedTicket.subject}</DialogTitle>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusBadge(selectedTicket.status)}
                  {priorityBadge(selectedTicket.priority || "medium")}
                  <Badge variant="outline" className="border-border text-[10px]">
                    {typeLabel(selectedTicket.type)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Client Info */}
                <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Client</p>
                  <p className="text-sm font-bold text-foreground">
                    {selectedTicket.client_profiles?.company_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTicket.client_profiles?.contact_person} — {selectedTicket.client_profiles?.email}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Details</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Attachment */}
                {selectedTicket.metadata?.attachment_url && (
                  <a
                    href={selectedTicket.metadata.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    {selectedTicket.metadata.attachment_name || "View Attachment"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {/* Routing Info */}
                {selectedTicket.routing_status === "routed" && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Routing</p>
                    <p className="text-foreground">
                      Routed to: <strong>{departments.find(d => d.id === selectedTicket.routed_to_department_id)?.name || "Department"}</strong>
                    </p>
                    {selectedTicket.routed_task_id && (
                      <p className="text-xs text-muted-foreground mt-1">Task created: {selectedTicket.routed_task_id.slice(0, 8)}...</p>
                    )}
                  </div>
                )}

                {/* Reassign */}
                {selectedTicket.status !== "resolved" && (
                  <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Reassign to Department
                    </p>
                    <div className="flex gap-2">
                      <Select value={reassignDept} onValueChange={setReassignDept}>
                        <SelectTrigger className="flex-1 bg-background border-border">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleReassign} disabled={!reassignDept} className="shrink-0">
                        Reassign
                      </Button>
                    </div>
                  </div>
                )}

                {/* Response */}
                {selectedTicket.response && (
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-500">HR Response</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.response}</p>
                    {selectedTicket.responded_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(selectedTicket.responded_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Reply form */}
                {selectedTicket.status !== "resolved" && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reply to Client</p>
                    <Textarea
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      placeholder="Type your response..."
                      className="min-h-[100px] bg-muted/50 border-border"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 mt-4">
                {selectedTicket.status !== "resolved" && (
                  <>
                    <Button variant="outline" onClick={() => handleResolve(selectedTicket.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Resolved
                    </Button>
                    <Button onClick={handleRespond} disabled={isResponding || !responseText.trim()}>
                      {isResponding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                      Send Response
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketManagement;
