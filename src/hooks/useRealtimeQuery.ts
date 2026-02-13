import { useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeQueryOptions<TData = any> extends Omit<UseQueryOptions<TData, Error, TData, any[]>, 'queryKey' | 'queryFn' | 'select'> {
    queryKey: any[];
    table: string;
    select?: string;
    filter?: string;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
}

/**
 * Custom hook that combines React Query caching with Supabase Realtime subscriptions
 * Provides automatic cache invalidation on INSERT/UPDATE/DELETE events
 * 
 * @example
 * const { data, isLoading } = useRealtimeQuery({
 *   queryKey: ['tasks', userId],
 *   table: 'staff_tasks',
 *   filter: `assigned_to=eq.${userId}`,
 *   select: '*, assignedBy:staff_profiles!assigned_by(full_name)',
 *   staleTime: 5 * 60 * 1000,
 * });
 */
export function useRealtimeQuery<TData = any>({
    queryKey,
    table,
    select = '*',
    filter,
    order,
    limit,
    single = false,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    refetchInterval = 30 * 1000, // 30 seconds default
    ...queryOptions
}: UseRealtimeQueryOptions<TData>) {
    const queryClient = useQueryClient();

    // Fetch function for React Query
    const fetchData = async (): Promise<TData> => {
        let query = supabase.from(table).select(select);

        if (filter) {
            // Parse filter string (format: "column=eq.value" or "column=in.(value1,value2)")
            const filterParts = filter.split('=');
            if (filterParts.length >= 2) {
                const column = filterParts[0];
                const operatorAndValue = filterParts.slice(1).join('=');

                if (operatorAndValue.startsWith('eq.')) {
                    query = query.eq(column, operatorAndValue.substring(3));
                } else if (operatorAndValue.startsWith('in.')) {
                    const values = operatorAndValue.substring(4, operatorAndValue.length - 1).split(',');
                    query = query.in(column, values);
                } else if (operatorAndValue.startsWith('neq.')) {
                    query = query.neq(column, operatorAndValue.substring(4));
                } else if (operatorAndValue.startsWith('gt.')) {
                    query = query.gt(column, operatorAndValue.substring(3));
                } else if (operatorAndValue.startsWith('gte.')) {
                    query = query.gte(column, operatorAndValue.substring(4));
                } else if (operatorAndValue.startsWith('lt.')) {
                    query = query.lt(column, operatorAndValue.substring(3));
                } else if (operatorAndValue.startsWith('lte.')) {
                    query = query.lte(column, operatorAndValue.substring(4));
                }
            }
        }

        if (order) {
            query = query.order(order.column, { ascending: order.ascending ?? true });
        }

        if (limit) {
            query = query.limit(limit);
        }

        if (single) {
            const { data, error } = await query.single();
            if (error) throw error;
            return data as TData;
        } else {
            const { data, error } = await query;
            if (error) throw error;
            return data as TData;
        }
    };

    // Use React Query with custom fetch function
    const query = useQuery<TData>({
        queryKey,
        queryFn: fetchData,
        staleTime,
        refetchInterval,
        refetchOnWindowFocus: true,
        ...queryOptions,
    });

    // Set up Supabase Realtime subscription
    useEffect(() => {
        let channel: RealtimeChannel | null = null;

        const setupRealtimeSubscription = () => {
            // Create unique channel name based on table and filter
            const channelName = `realtime-${table}-${JSON.stringify(queryKey)}`;

            channel = supabase.channel(channelName);

            // Subscribe to INSERT events
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
                    // Invalidate and refetch the query
                    queryClient.invalidateQueries({ queryKey });
                }
            );

            // Subscribe to UPDATE events
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
                    // Invalidate and refetch the query
                    queryClient.invalidateQueries({ queryKey });
                }
            );

            // Subscribe to DELETE events
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
                    // Invalidate and refetch the query
                    queryClient.invalidateQueries({ queryKey });
                }
            );

            // Subscribe to the channel
            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Subscribed to ${table} changes`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`[Realtime] Error subscribing to ${table}`);
                } else if (status === 'TIMED_OUT') {
                    console.warn(`[Realtime] Subscription to ${table} timed out, retrying...`);
                }
            });
        };

        setupRealtimeSubscription();

        // Cleanup function
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
                console.log(`[Realtime] Unsubscribed from ${table} changes`);
            }
        };
    }, [table, filter, queryKey, queryClient]);

    return query;
}
