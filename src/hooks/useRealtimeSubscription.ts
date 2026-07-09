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

    // Keep callbacks in refs to avoid re-subscription cycles when callback references change
    const onInsertRef = useRef(onInsert);
    const onUpdateRef = useRef(onUpdate);
    const onDeleteRef = useRef(onDelete);

    useEffect(() => {
        onInsertRef.current = onInsert;
    }, [onInsert]);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        onDeleteRef.current = onDelete;
    }, [onDelete]);

    useEffect(() => {
        if (!enabled) return;

        // Create unique channel name with timestamp and random suffix to avoid any cached channel reuse collisions
        const randomSuffix = Math.random().toString(36).substring(2, 9);
        const channelName = `subscription-${table}-${filter || 'all'}-${Date.now()}-${randomSuffix}`;

        const channel = supabase.channel(channelName);
        channelRef.current = channel;

        // Subscribe to INSERT events
        if (onInsert) {
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
        if (onUpdate) {
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
        if (onDelete) {
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
                channelRef.current = null;
            }
        };
    }, [table, filter, enabled]); // Exclude callback functions to avoid subscription churn

    return {
        channel: channelRef.current,
    };
}
