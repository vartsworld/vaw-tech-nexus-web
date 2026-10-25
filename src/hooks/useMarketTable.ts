import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Result<T> = { data: T[] | null; error: { code?: string; message: string } | null };
interface UntypedTable {
  select: (cols: string) => { order: (col: string, o: { ascending: boolean }) => { limit: (n: number) => PromiseLike<Result<unknown>> } };
  insert: (row: object) => { select: () => { single: () => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }> } };
  update: (patch: object) => { eq: (col: string, v: string) => PromiseLike<{ error: { code?: string; message: string } | null }> };
  delete: () => { eq: (col: string, v: string) => PromiseLike<{ error: { code?: string; message: string } | null }> };
}
// The `market_*` tables are not in the generated Supabase types yet.
const table = (name: string) => (supabase as unknown as { from: (t: string) => UntypedTable }).from(name);

const MISSING_TABLE_CODES = ["42P01", "PGRST205"];

export interface MutationError {
  code?: string;
  message: string;
}

/**
 * Live rows from one `market_*` table (realtime INSERT/UPDATE/DELETE) with optimistic update/remove helpers.
 * `available` is false when the table doesn't exist yet, so the UI can explain that the migration is pending.
 */
export function useMarketTable<T extends { id: string }>(name: string, orderBy: { column: string; ascending?: boolean }) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const orderRef = useRef(orderBy);
  orderRef.current = orderBy;

  const reload = useCallback(async () => {
    const { data, error: err } = await table(name).select("*").order(orderRef.current.column, { ascending: orderRef.current.ascending ?? false }).limit(1000);
    if (err) {
      if (err.code && MISSING_TABLE_CODES.includes(err.code)) {
        setAvailable(false);
        setError(null);
      } else {
        console.error(`Failed to load ${name}:`, err);
        setError("Couldn't load this list. Check your connection or permissions.");
      }
    } else {
      setAvailable(true);
      setError(null);
      setRows((data ?? []) as T[]);
    }
    setLoading(false);
  }, [name]);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel(`hr-${name}-${Math.random().toString(36).slice(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: name }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (id) setRows((prev) => prev.filter((r) => r.id !== id));
          return;
        }
        const row = payload.new as T;
        setRows((prev) => (prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)) : [row, ...prev]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [name, reload]);

  /** Optimistic update; rolls back and returns the error when the database refuses. */
  const update = useCallback(
    async (id: string, patch: Partial<T>): Promise<MutationError | null> => {
      let previous: T | undefined;
      setRows((list) => list.map((r) => (r.id === id ? ((previous = r), { ...r, ...patch }) : r)));
      const { error: err } = await table(name).update(patch).eq("id", id);
      if (err) {
        setRows((list) => list.map((r) => (r.id === id && previous ? previous : r)));
        return err;
      }
      return null;
    },
    [name]
  );

  const insert = useCallback(
    async (row: Partial<T>): Promise<{ row: T | null; error: MutationError | null }> => {
      const { data, error: err } = await table(name).insert(row).select().single();
      if (err || !data) return { row: null, error: err ?? { message: "Insert failed" } };
      const created = data as T;
      setRows((list) => (list.some((r) => r.id === created.id) ? list : [created, ...list]));
      return { row: created, error: null };
    },
    [name]
  );

  const remove = useCallback(
    async (id: string): Promise<MutationError | null> => {
      const { error: err } = await table(name).delete().eq("id", id);
      if (err) return err;
      setRows((list) => list.filter((r) => r.id !== id));
      return null;
    },
    [name]
  );

  return { rows, setRows, loading, error, available, reload, update, insert, remove };
}

/** Friendly text for the usual failures when writing to the shared database. */
export const explainDbError = (err: MutationError): string => {
  if (err.code === "23505") return "That value is already used (for example a duplicate address/slug). Change it and try again.";
  if (err.code === "42501" || /row-level security|permission denied/i.test(err.message)) return "You don't have permission to change this. Only HR and super admins can manage marketing content.";
  if (err.code === "23514") return "One of the values is outside what the database allows (too long or not valid).";
  return err.message;
};
