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

    useEffect(() => {
        if (!enabled) return;

        // Create unique channel name
        const channelName = `subscription-${table}-${filter || 'all'}-${Date.now()}`;

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
                    console.log(`[Realtime] INSERT on ${table}:`, payload);
                    onInsert(payload);
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
                    console.log(`[Realtime] UPDATE on ${table}:`, payload);
                    onUpdate(payload);
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
                    console.log(`[Realtime] DELETE on ${table}:`, payload);
                    onDelete(payload);
                }
            );
        }

        // Subscribe to the channel
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Realtime] Subscribed to ${table} changes`);
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
                console.log(`[Realtime] Unsubscribed from ${table} changes`);
                channelRef.current = null;
            }
        };
    }, [table, filter, onInsert, onUpdate, onDelete, enabled]);

    return {
        channel: channelRef.current,
    };
}
