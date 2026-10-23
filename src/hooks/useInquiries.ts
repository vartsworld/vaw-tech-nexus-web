import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { InquiryRow } from "@/lib/inquiryParser";

interface UseInquiries {
  rows: InquiryRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setRows: React.Dispatch<React.SetStateAction<InquiryRow[]>>;
}

/**
 * Leads from the `inquiries` table (contact form, pricing requests, custom requests),
 * kept fresh through Supabase realtime. `onInsert` fires for every new row that arrives while the page is open.
 */
export const useInquiries = (onInsert?: (row: InquiryRow) => void): UseInquiries => {
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insertRef = useRef(onInsert);
  insertRef.current = onInsert;

  const reload = useCallback(async () => {
    const { data, error: err } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(1000);
    if (err) {
      console.error("Failed to load inquiries:", err);
      setError("Couldn't load requests. Check your connection or permissions.");
    } else {
      setRows((data ?? []) as InquiryRow[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel(`hr-inquiries-${Math.random().toString(36).slice(2, 9)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inquiries" }, (payload) => {
        const row = payload.new as InquiryRow;
        setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
        insertRef.current?.(row);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "inquiries" }, (payload) => {
        const row = payload.new as InquiryRow;
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "inquiries" }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (id) setRows((prev) => prev.filter((r) => r.id !== id));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  return { rows, loading, error, reload, setRows };
};
