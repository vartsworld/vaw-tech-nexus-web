import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Phone, Calendar, Trash2, Loader2, RefreshCw } from "lucide-react";

interface Enquiry {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  course_title: string;
  course_fee: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "rejected"];

export default function AcademyEnquiriesList() {
  const { toast } = useToast();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("academy_enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load enquiries", description: error.message, variant: "destructive" });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = (supabase as any)
      .channel("academy-enquiries-hr")
      .on("postgres_changes", { event: "*", schema: "public", table: "academy_enquiries" }, () => load())
      .subscribe();
    return () => {
      (supabase as any).removeChannel(ch);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("academy_enquiries").update({ status }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else toast({ title: "Status updated" });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    const { error } = await (supabase as any).from("academy_enquiries").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else toast({ title: "Deleted" });
  };

  const statusColor = (s: string) =>
    s === "new" ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
    : s === "contacted" ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
    : s === "enrolled" ? "bg-green-500/15 text-green-500 border-green-500/30"
    : "bg-red-500/15 text-red-500 border-red-500/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Academy Enquiries
          </h2>
          <p className="text-sm text-muted-foreground">Enrollment requests from the VAW Academy page.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No academy enquiries yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((it) => (
            <Card key={it.id} className="bg-card/60 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{it.full_name}</CardTitle>
                    <p className="text-sm text-primary font-medium mt-1">{it.course_title}</p>
                  </div>
                  <Badge variant="outline" className={statusColor(it.status)}>{it.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><a href={`mailto:${it.email}`} className="hover:text-primary truncate">{it.email}</a></div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><a href={`tel:${it.phone}`} className="hover:text-primary">{it.phone}</a></div>
                  {it.course_fee && <div className="text-xs">Fee: <span className="text-foreground font-medium">{it.course_fee}</span></div>}
                  <div className="flex items-center gap-2 text-xs"><Calendar className="w-3 h-3" />{new Date(it.created_at).toLocaleString()}</div>
                </div>
                {it.message && (
                  <p className="text-xs bg-muted/40 rounded-md p-2 border border-border/40">{it.message}</p>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <Select defaultValue={it.status} onValueChange={(v) => updateStatus(it.id, v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(it.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
