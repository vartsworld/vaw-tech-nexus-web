import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, PlaneTakeoff, Plus, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function LeaveView({ profile }: { profile: any }) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<string>("vacation");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      fetchRequests();
    }
  }, [profile?.user_id]);

  const fetchRequests = async () => {
    if (!profile?.user_id) return;
    setIsLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('staff_leave_requests')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as LeaveRequest[]) || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to load leave requests.");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.user_id || !startDate || !endDate || !leaveType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('staff_leave_requests')
        .insert({
          user_id: profile.user_id,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          leave_type: leaveType,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Leave application submitted successfully!");
      setView('list');
      fetchRequests();
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error("Failed to submit leave application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <PlaneTakeoff className="w-8 h-8 text-blue-500" />
            Leave Applications
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">
            Apply and track departamental leave approvals
          </p>
        </div>

        {view === 'list' && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase px-4 h-10 shadow-lg shadow-blue-600/20 gap-2 border-none"
            onClick={() => setView('form')}
          >
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        )}
      </div>

      {view === 'form' ? (
        <Card className="bg-black/30 border-white/10 text-white rounded-[2.5rem]">
          <CardContent className="p-6 space-y-6">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-black uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to previous leaves
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-white/40">Leave Type</Label>
                <select
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white px-3 animate-none transition-none"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="vacation">Vacation Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity_paternity">Maternity/Paternity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-white/40">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold text-xs h-11 bg-white/5 border-white/10 text-white rounded-xl",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-400" />
                        {startDate ? format(startDate, "PPP") : <span>Pick date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-white/40">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-bold text-xs h-11 bg-white/5 border-white/10 text-white rounded-xl",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-400" />
                        {endDate ? format(endDate, "PPP") : <span>Pick date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-white/40">Reason & Explanation</Label>
              <Textarea
                placeholder="Detail the circumstances of your departure initiative..."
                rows={4}
                className="bg-white/5 border-white/10 rounded-2xl text-sm leading-relaxed"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="ghost"
                className="rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider px-6"
                onClick={() => setView('list')}
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider px-6 h-10 border-none"
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                ) : (
                  "Submit Initiative"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-black/30 border-white/10 text-white rounded-[2.5rem]">
          <CardContent className="p-6">
            {isLoadingRequests ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
                <PlaneTakeoff className="w-14 h-14 mx-auto mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">No Leave Applications Found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {requests.map((request) => (
                  <div key={request.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-white capitalize">{request.leave_type} Leave</span>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 border shadow-sm",
                          request.status === 'approved' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                          request.status === 'rejected' ? "border-red-500/30 text-red-400 bg-red-500/10" :
                          "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        )}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Duration: {format(new Date(request.start_date), "MMM dd")} - {format(new Date(request.end_date), "MMM dd, yyyy")}
                      </p>
                      {request.reason && (
                        <p className="text-xs text-white/60 leading-relaxed mt-2 italic bg-black/20 p-2.5 rounded-xl border border-white/5 break-words">
                          "{request.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
