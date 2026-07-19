import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
    table: string;
    filter?: string;
    onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
    enabled?: boolean;
}

/**
 * Lightweight hook for Supabase Realtime subscriptions without React Query
 * Useful for simple real-time updates with custom callbacks
 * 
 * @example
 * useRealtimeSubscription({
 *   table: 'staff_tasks',
 *   filter: `assigned_to=eq.${userId}`,
 *   onInsert: (payload) => {
 *     toast({ title: 'New task assigned!', description: payload.new.title });
 *   },
 *   onUpdate: (payload) => {
 *     // Handle task update
 *   },
 * });
 */
export function useRealtimeSubscription({
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
}: UseRealtimeSubscriptionOptions) {
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Use mutable refs to hold the latest callbacks to avoid re-subscribing
    // to Supabase on every render when inline/anonymous functions are used.
    const onInsertRef = useRef(onInsert);
    const onUpdateRef = useRef(onUpdate);
    const onDeleteRef = useRef(onDelete);

    // Keep the refs updated with the latest callbacks
    useEffect(() => {
        onInsertRef.current = onInsert;
        onUpdateRef.current = onUpdate;
        onDeleteRef.current = onDelete;
    });

    const hasInsert = !!onInsert;
    const hasUpdate = !!onUpdate;
    const hasDelete = !!onDelete;

    useEffect(() => {
        if (!enabled) return;

        // Create unique channel name
        const channelName = `subscription-${table}-${filter || 'all'}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        // Subscribe to INSERT events
        if (hasInsert) {
            channel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: table,
                    filter: filter,
                },
                (payload) => {
                    if (typeof window !== 'undefined') {
                        (window as any).realtimeUpdationCount = ((window as any).realtimeUpdationCount || 0) + 1;
                        console.log(`Realtime updation [${(window as any).realtimeUpdationCount}]`);
                    }
                    if (onInsertRef.current) {
                        onInsertRef.current(payload);
                    }
                }
            );
        }

        // Subscribe to UPDATE events
        if (hasUpdate) {
            channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: table,
                    filter: filter,
                },
                (payload) => {
                    if (typeof window !== 'undefined') {
                        (window as any).realtimeUpdationCount = ((window as any).realtimeUpdationCount || 0) + 1;
                        console.log(`Realtime updation [${(window as any).realtimeUpdationCount}]`);
                    }
                    if (onUpdateRef.current) {
                        onUpdateRef.current(payload);
                    }
                }
            );
        }

        // Subscribe to DELETE events
        if (hasDelete) {
            channel.on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: table,
                    filter: filter,
                },
                (payload) => {
                    if (typeof window !== 'undefined') {
                        (window as any).realtimeUpdationCount = ((window as any).realtimeUpdationCount || 0) + 1;
                        console.log(`Realtime updation [${(window as any).realtimeUpdationCount}]`);
                    }
                    if (onDeleteRef.current) {
                        onDeleteRef.current(payload);
                    }
                }
            );
        }

        // Subscribe to the channel
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                // Muted verbose subscribe logs
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`[Realtime] Error subscribing to ${table}`);
            } else if (status === 'TIMED_OUT') {
                console.warn(`[Realtime] Subscription to ${table} timed out`);
            }
        });

        // Cleanup function
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                // Muted verbose unsubscribed logs
                channelRef.current = null;
            }
        };
    }, [table, filter, hasInsert, hasUpdate, hasDelete, enabled]);

    return {
        channel: channelRef.current,
    };
}
