import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentRequestStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

export interface PaymentRequestRow {
  id: string;
  inquiry_id: string | null;
  order_id: string;
  gateway_payment_id: string | null;
  amount_paise: number;
  currency: string;
  checkout_url: string | null;
  status: PaymentRequestStatus;
  utr: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// `payment_requests` is not in the generated Supabase types yet (regenerate after applying the migration).
interface UntypedQuery {
  select: (cols: string) => { order: (col: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: unknown[] | null; error: { code: string } | null }> } };
}
const table = () => (supabase as unknown as { from: (t: string) => UntypedQuery }).from("payment_requests");

/**
 * Payment links created for requests through VAW Pay, kept live via realtime.
 * `available` is false when the table does not exist yet (migration not applied), so the UI can say so.
 */
export const usePaymentRequests = () => {
  const [rows, setRows] = useState<PaymentRequestRow[]>([]);
  const [available, setAvailable] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await table().select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) {
      // 42P01 = relation does not exist; PGRST205 = not in schema cache
      setAvailable(!["42P01", "PGRST205", "PGRST116"].includes(error.code));
      if (!["42P01", "PGRST205"].includes(error.code)) console.error("Failed to load payment requests:", error);
      return;
    }
    setAvailable(true);
    setRows((data ?? []) as PaymentRequestRow[]);
  }, []);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel(`hr-payment-requests-${Math.random().toString(36).slice(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_requests" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (id) setRows((prev) => prev.filter((r) => r.id !== id));
          return;
        }
        const row = payload.new as PaymentRequestRow;
        setRows((prev) => (prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? row : r)) : [row, ...prev]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  /** Most relevant request per inquiry: a paid one wins, otherwise the newest. */
  const byInquiry = useMemo(() => {
    const map = new Map<string, PaymentRequestRow>();
    for (const r of rows) {
      if (!r.inquiry_id) continue;
      const cur = map.get(r.inquiry_id);
      if (!cur || (cur.status !== "paid" && (r.status === "paid" || r.created_at > cur.created_at))) map.set(r.inquiry_id, r);
    }
    return map;
  }, [rows]);

  const upsert = useCallback((row: PaymentRequestRow) => {
    setRows((prev) => (prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? row : r)) : [row, ...prev]));
  }, []);

  return { rows, byInquiry, available, reload, upsert };
};

export const PAYMENT_STATUS_META: Record<PaymentRequestStatus, { label: string; tone: string }> = {
  pending: { label: "Awaiting payment", tone: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  paid: { label: "Paid", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  failed: { label: "Payment failed", tone: "border-red-500/30 bg-red-500/10 text-red-400" },
  expired: { label: "Link expired", tone: "border-white/15 bg-white/5 text-muted-foreground" },
  cancelled: { label: "Cancelled", tone: "border-white/15 bg-white/5 text-muted-foreground" },
};
