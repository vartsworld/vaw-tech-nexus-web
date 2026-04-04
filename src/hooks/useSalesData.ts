import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalesData = (userId?: string) => {
  const fetchClients = async () => {
    let query = supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("created_by", userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  };

  const fetchSalesStats = async () => {
    const { data: clients, error } = await supabase
      .from("clients")
      .select("status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const totalLeads = clients.length;
    const activeProjects = clients.filter(c => c.status?.toLowerCase() === "active").length;
    const pendingDeals = clients.filter(c => c.status?.toLowerCase() === "onboarding").length;

    return {
      totalLeads,
      activeProjects,
      pendingDeals,
      rawClients: clients
    };
  };

  const { data: clients, isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["sales-clients", userId],
    queryFn: fetchClients,
    enabled: !!userId,
  });

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["sales-stats"],
    queryFn: fetchSalesStats,
  });

  return {
    clients,
    stats,
    isLoading: clientsLoading || statsLoading,
    error: clientsError || statsError,
  };
};
