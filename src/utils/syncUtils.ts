import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a random 6-digit alphanumeric code.
 */
export const generateSyncId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Synchronizes client data with the external billing software.
 */
export const syncClientToBilling = async (client: any, syncId: string) => {
    console.log(`Syncing client ${client.company_name} to billing with ID: ${syncId}`);

    const key = localStorage.getItem('vaw_external_api_key');
    const secret = localStorage.getItem('vaw_external_api_secret');

    if (!key || !secret) {
        console.warn("External API credentials not found in localStorage. Sync skipped.");
        return;
    }

    try {
        const externalUrl = localStorage.getItem('vaw_external_api_url') || `https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api`;
        const response = await fetch(`${externalUrl}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'x-api-secret': secret
            },
            body: JSON.stringify({
                sync_id: syncId,
                name: client.company_name,
                contact_person: client.contact_person,
                email: client.email,
                phone: client.phone,
                address: client.address
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to sync client to billing');
        }

        return data;
    } catch (error) {
        console.error("Error syncing client to billing:", error);
        throw error; // Re-throw to handle in UI
    }
};

/**
 * Synchronizes a financial entry (payment) with the external billing software.
 */
export const syncFinancialEntryToBilling = async (paymentData: any, syncId: string) => {
    console.log(`Syncing financial entry for client with sync ID: ${syncId}`);

    const key = localStorage.getItem('vaw_external_api_key');
    const secret = localStorage.getItem('vaw_external_api_secret');

    if (!key || !secret) {
        console.warn("External API credentials not found in localStorage. Sync skipped.");
        return;
    }

    try {
        const BASE_URL = `https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api`;
        const response = await fetch(`${BASE_URL}/financial/entries/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'x-api-secret': secret
            },
            body: JSON.stringify({
                sync_id: syncId,
                amount: paymentData.amount,
                title: paymentData.title,
                doc_type: paymentData.doc_type,
                status: paymentData.status,
                metadata: paymentData.metadata,
                created_at: paymentData.created_at
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to sync financial entry to billing');
        }

        return await response.json();
    } catch (error) {
        console.error("Error syncing financial entry to billing:", error);
    }
};
/**
 * Fetches a single client detail from billing software by its client_code.
 */
export const fetchClientFromBilling = async (clientCode: string) => {
    const key = localStorage.getItem('vaw_external_api_key');
    const secret = localStorage.getItem('vaw_external_api_secret');

    if (!key || !secret) throw new Error("API credentials missing");
    try {
        const externalUrl = localStorage.getItem('vaw_external_api_url') || `https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api`;
        const response = await fetch(`${externalUrl}/clients?client_code=${clientCode}`, {
            headers: { 'x-api-key': key, 'x-api-secret': secret }
        });

        if (!response.ok) throw new Error("Client not found in billing software");

        const data = await response.json();
        // Handle both plain arrays and wrapped { data: [...] } responses
        const items = Array.isArray(data) ? data : (data?.data || (data ? [data] : []));

        if (!Array.isArray(items)) return items;
        if (items.length === 0) return null;
        if (items.length === 1) return items[0];

        // If the external API ignores ?client_code and returns ALL clients, manually find the right one
        const exactMatch = items.find((item: any) =>
            String(item.id) === String(clientCode) ||
            String(item.client_code) === String(clientCode) ||
            String(item.customer_id) === String(clientCode) ||
            String(item.billing_sync_id) === String(clientCode)
        );

        return exactMatch || null;
    } catch (error) {
        console.error("Error fetching client from billing:", error);
        throw error;
    }
};

/**
 * Searches for clients in the billing software.
 */
export const searchClientsInBilling = async (query: string) => {
    const key = localStorage.getItem('vaw_external_api_key');
    const secret = localStorage.getItem('vaw_external_api_secret');

    if (!key || !secret) throw new Error("API credentials missing");
    try {
        const externalUrl = localStorage.getItem('vaw_external_api_url') || `https://ecexzlqjobqajfhxmiaa.supabase.co/functions/v1/external-api`;
        const response = await fetch(`${externalUrl}/clients?search=${encodeURIComponent(query)}&limit=10`, {
            headers: { 'x-api-key': key, 'x-api-secret': secret }
        });

        if (!response.ok) throw new Error("Failed to search clients");
        const data = await response.json();
        // Handle both plain arrays and wrapped { data: [...] } responses from billing API
        const items = Array.isArray(data) ? data : (data?.data || (data ? [data] : []));
        return Array.isArray(items) ? items : [];
    } catch (error) {
        console.error("Error searching clients in billing:", error);
        return [];
    }
};
