import { useMemo } from "react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { isPricingInquiry } from "@/lib/inquiryParser";

export interface HRBadges {
  pricing: number;
  inquiries: number;
  leave: number;
  applications: number;
  support: number;
  overdueTasks: number;
  marketEnquiries: number;
}

/** Live counts of everything waiting for HR – drives sidebar badges and the overview's "needs attention" list. */
export const useHRBadges = (): HRBadges => {
  const today = new Date().toISOString().split("T")[0];

  const { data: newInquiries } = useRealtimeQuery({
    queryKey: ["hr-badge-inquiries"],
    table: "inquiries",
    select: "id, service, message, status",
    filter: "status=eq.new",
  });
  const { data: pendingLeave } = useRealtimeQuery({
    queryKey: ["hr-badge-leave"],
    table: "staff_leave_requests",
    select: "id",
    filter: "status=eq.pending",
  });
  const { data: pendingApps } = useRealtimeQuery({
    queryKey: ["hr-badge-team-apps"],
    table: "team_applications",
    select: "id",
    filter: "status=eq.pending",
  });
  const { data: tickets } = useRealtimeQuery({
    queryKey: ["hr-badge-support"],
    table: "client_feedback",
    select: "id, status",
  });
  const { data: openTasks } = useRealtimeQuery({
    queryKey: ["hr-badge-overdue", today],
    table: "staff_tasks",
    select: "id, status, due_date",
    filter: `due_date=lt.${today}`,
  });

  // Marketing site enquiries live in their own table; it may not exist until the migration is applied, so don't retry noisily.
  const { data: marketNew } = useRealtimeQuery({
    queryKey: ["hr-badge-market-enquiries"],
    table: "market_enquiries",
    select: "id",
    filter: "status=eq.new",
    retry: false,
    refetchInterval: 2 * 60 * 1000,
  });

  return useMemo(() => {
    const inq = Array.isArray(newInquiries) ? newInquiries : [];
    const pricing = inq.filter((r: any) => isPricingInquiry({ ...r, message: r.message ?? "" })).length;
    return {
      pricing,
      inquiries: inq.length - pricing,
      leave: Array.isArray(pendingLeave) ? pendingLeave.length : 0,
      applications: Array.isArray(pendingApps) ? pendingApps.length : 0,
      support: Array.isArray(tickets) ? tickets.filter((t: any) => t.status !== "closed" && t.status !== "resolved").length : 0,
      marketEnquiries: Array.isArray(marketNew) ? marketNew.length : 0,
      overdueTasks: Array.isArray(openTasks) ? openTasks.filter((t: any) => t.status !== "completed" && t.status !== "cancelled").length : 0,
    };
  }, [newInquiries, pendingLeave, pendingApps, tickets, openTasks, marketNew]);
};
