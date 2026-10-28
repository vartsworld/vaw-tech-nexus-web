import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ClientLite, PostitAccount, PostitPost } from "@/lib/postit/types";

interface DbError { code?: string; message: string }
type Res<T> = PromiseLike<{ data: T | null; error: DbError | null }>;
interface Q<T> extends PromiseLike<{ data: T[] | null; error: DbError | null }> {
  order: (col: string, o: { ascending: boolean; nullsFirst?: boolean }) => Q<T>;
  limit: (n: number) => Q<T>;
}
interface UntypedTable {
  select: (cols: string) => Q<unknown>;
  insert: (rows: object | object[]) => { select: () => PromiseLike<{ data: unknown[] | null; error: DbError | null }> };
  update: (patch: object) => { eq: (col: string, v: string) => PromiseLike<{ error: DbError | null }> };
  delete: () => { eq: (col: string, v: string) => PromiseLike<{ error: DbError | null }> };
}
// The `postit_*` tables are not in the generated Supabase types yet.
const table = (name: string) => (supabase as unknown as { from: (t: string) => UntypedTable }).from(name);
export const MISSING_TABLE_CODES = ["42P01", "PGRST205"];

export const explainPostitError = (err: DbError): string => {
  if (err.code === "42501" || /row-level security|permission denied/i.test(err.message)) return "You don't have permission to do that. Posts can be removed by their creator or a manager.";
  if (err.code === "23514") return "One of the values isn't allowed (for example a scheduled post needs a date).";
  if (err.code === "23503") return "That client or account no longer exists. Refresh and try again.";
  return err.message;
};

/** Everything the Post Scheduler page needs: clients, social accounts and posts, kept live with Realtime. */
export function usePostit() {
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [accounts, setAccounts] = useState<PostitAccount[]>([]);
  const [posts, setPosts] = useState<PostitPost[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    const [p, a, c] = await Promise.all([
      table("postit_posts").select("*").order("scheduled_at", { ascending: true, nullsFirst: false }).limit(3000),
      table("postit_accounts").select("*").order("created_at", { ascending: true }).limit(1000),
      table("clients").select("id, company_name").order("company_name", { ascending: true }).limit(1000),
    ]);
    if (!mounted.current) return;
    const missing = [p.error, a.error].some((e) => e?.code && MISSING_TABLE_CODES.includes(e.code));
    if (missing) {
      setAvailable(false);
      setError(null);
    } else if (p.error || a.error) {
      console.error("Post Scheduler load failed", p.error || a.error);
      setError("Couldn't load posts. Check your connection or permissions.");
    } else {
      setAvailable(true);
      setError(null);
      setPosts(((p.data ?? []) as PostitPost[]).map(normalisePost));
      setAccounts((a.data ?? []) as PostitAccount[]);
    }
    if (!c.error) setClients((c.data ?? []) as ClientLite[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    reload();
    // Names for "created by"; staff may not be allowed to read every profile, so this is best-effort.
    (supabase.from("staff_profiles").select("user_id, full_name") as unknown as Res<{ user_id: string; full_name: string }[]>).then(({ data }) => {
      if (mounted.current && data) setPeople(Object.fromEntries(data.map((s) => [s.user_id, s.full_name])));
    });
    const channel = supabase
      .channel(`postit-${Math.random().toString(36).slice(2, 9)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "postit_posts" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (id) setPosts((prev) => prev.filter((r) => r.id !== id));
          return;
        }
        const row = normalisePost(payload.new as PostitPost);
        setPosts((prev) => (prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)) : [...prev, row]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "postit_accounts" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (id) setAccounts((prev) => prev.filter((r) => r.id !== id));
          return;
        }
        const row = payload.new as PostitAccount;
        setAccounts((prev) => (prev.some((r) => r.id === row.id) ? prev.map((r) => (r.id === row.id ? { ...r, ...row } : r)) : [...prev, row]));
      })
      .subscribe();
    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [reload]);

  const createPosts = useCallback(async (rows: Partial<PostitPost>[]): Promise<DbError | null> => {
    const { data, error: err } = await table("postit_posts").insert(rows).select();
    if (err) return err;
    const created = ((data ?? []) as PostitPost[]).map(normalisePost);
    setPosts((prev) => [...prev, ...created.filter((c) => !prev.some((r) => r.id === c.id))]);
    return null;
  }, []);

  const updatePost = useCallback(async (id: string, patch: Partial<PostitPost>): Promise<DbError | null> => {
    let previous: PostitPost | undefined;
    setPosts((list) => list.map((r) => (r.id === id ? ((previous = r), { ...r, ...patch }) : r)));
    const { error: err } = await table("postit_posts").update(patch).eq("id", id);
    if (err) {
      setPosts((list) => list.map((r) => (r.id === id && previous ? previous : r)));
      return err;
    }
    return null;
  }, []);

  const deletePost = useCallback(async (id: string): Promise<DbError | null> => {
    const { error: err } = await table("postit_posts").delete().eq("id", id);
    if (err) return err;
    setPosts((list) => list.filter((r) => r.id !== id));
    return null;
  }, []);

  const createAccount = useCallback(async (row: Partial<PostitAccount>): Promise<DbError | null> => {
    const { data, error: err } = await table("postit_accounts").insert(row).select();
    if (err) return err;
    const created = (data ?? []) as PostitAccount[];
    setAccounts((prev) => [...prev, ...created.filter((c) => !prev.some((r) => r.id === c.id))]);
    return null;
  }, []);

  const updateAccount = useCallback(async (id: string, patch: Partial<PostitAccount>): Promise<DbError | null> => {
    const { error: err } = await table("postit_accounts").update(patch).eq("id", id);
    if (err) return err;
    setAccounts((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    return null;
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<DbError | null> => {
    const { error: err } = await table("postit_accounts").delete().eq("id", id);
    if (err) return err;
    setAccounts((list) => list.filter((r) => r.id !== id));
    setPosts((list) => list.map((p) => (p.account_id === id ? { ...p, account_id: null } : p)));
    return null;
  }, []);

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.company_name]));
    return (id: string | null) => (id ? map.get(id) ?? "Unknown client" : "VAW Technologies");
  }, [clients]);

  return { clients, accounts, posts, people, loading, error, available, reload, clientName, createPosts, updatePost, deletePost, createAccount, updateAccount, deleteAccount };
}

/** jsonb/array columns can come back as null or odd shapes from older rows. */
const normalisePost = (p: PostitPost): PostitPost => ({
  ...p,
  hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
  media_urls: Array.isArray(p.media_urls) ? p.media_urls.filter((u): u is string => typeof u === "string") : [],
});
