import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalesData = (userId?: string) => {

  /* ── Clients ── */
  const fetchClients = async () => {
    let query = supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("created_by", userId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  };

  /* ── Stats (scoped to this sales person only) ── */
  const fetchSalesStats = async () => {
    let query = supabase
      .from("clients")
      .select("status, created_at")
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("created_by", userId);

    const { data: rows, error } = await query;
    if (error) throw error;

    const totalLeads = rows?.length ?? 0;
    const activeProjects = rows?.filter(c => c.status?.toLowerCase() === "active").length ?? 0;
    const pendingDeals = rows?.filter(c =>
      ["onboarding", "pending", "lead"].includes(c.status?.toLowerCase() ?? "")
    ).length ?? 0;
    const conversionRate =
      totalLeads > 0 ? Number(((activeProjects / totalLeads) * 100).toFixed(1)) : 0;

    return { totalLeads, activeProjects, pendingDeals, conversionRate };
  };

  /* ── React Query ── */
  const {
    data: clients,
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useQuery({
    queryKey: ["sales-clients", userId],
    queryFn: fetchClients,
    enabled: !!userId,
    staleTime: 30_000,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["sales-stats", userId],
    queryFn: fetchSalesStats,
    enabled: !!userId,
    staleTime: 30_000,
  });

  return {
    clients: clients ?? [],
    stats,
    isLoading: clientsLoading || statsLoading,
    error: clientsError || statsError,
    refetchClients,
    refetchStats,
  };
};
