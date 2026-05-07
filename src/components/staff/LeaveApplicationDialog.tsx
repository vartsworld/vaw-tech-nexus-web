
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, PlaneTakeoff, Plus, ArrowLeft, History, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const LeaveApplicationDialog = ({ open, onOpenChange, userId }: LeaveApplicationDialogProps) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<string>("vacation");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchRequests();
    }
  }, [open, userId]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to load your leave requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !leaveType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('staff_leave_requests')
        .insert({
          user_id: userId,
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
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error("Failed to submit leave application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-zinc-900 border-zinc-800 text-white overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                {view === 'list' ? <History className="w-5 h-5 text-orange-500" /> : <PlaneTakeoff className="w-5 h-5 text-orange-500" />}
              </div>
              <DialogTitle className="text-xl font-bold">
                {view === 'list' ? "My Leave Requests" : "New Leave Application"}
              </DialogTitle>
            </div>
            
            {view === 'list' ? (
              <Button 
                onClick={() => setView('form')}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            ) : (
              <Button 
                variant="ghost"
                onClick={() => setView('list')}
                className="text-zinc-400 hover:text-white hover:bg-white/5 gap-2"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to List
              </Button>
            )}
          </div>
          <DialogDescription className="text-zinc-400">
            {view === 'list' 
              ? "Track the status of your submitted leave applications." 
              : "Fill in the details below to apply for leave."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {view === 'list' ? (
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <p className="text-zinc-500 text-sm">Loading requests...</p>
                </div>
              ) : requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div 
                      key={request.id} 
                      className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge variant="outline" className="capitalize mb-2 bg-zinc-900/50">
                            {request.leave_type.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                            {format(new Date(request.start_date), "MMM d, yyyy")} - {format(new Date(request.end_date), "MMM d, yyyy")}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} capitalize px-3 py-0.5 rounded-full`}>
                          {request.status}
                        </Badge>
                      </div>
                      
                      {request.reason && (
                        <p className="text-xs text-zinc-500 line-clamp-2 italic">
                          "{request.reason}"
                        </p>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Applied on {format(new Date(request.created_at), "MMM d")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="p-4 bg-zinc-800/50 rounded-full mb-4">
                    <History className="w-8 h-8 text-zinc-700" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">No requests yet</h3>
                  <p className="text-zinc-500 text-sm max-w-[250px]">
                    You haven't submitted any leave applications yet. Click "New Request" to start.
                  </p>
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 ${!startDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="bg-zinc-900 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 ${!endDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="bg-zinc-900 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="maternity">Maternity/Paternity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Reason (Optional)</Label>
                <Textarea
                  placeholder="Provide a brief reason for your leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {view === 'form' && (
          <DialogFooter className="flex-shrink-0 pt-2 border-t border-zinc-800">
            <Button
              variant="ghost"
              onClick={() => setView('list')}
              className="text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Apply Now"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeaveApplicationDialog;
