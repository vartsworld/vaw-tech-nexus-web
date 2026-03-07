
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-api-secret',
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Basic Authentication Check
        const apiKey = req.headers.get('x-api-key')
        const apiSecret = req.headers.get('x-api-secret')
        const authHeader = req.headers.get('Authorization')

        // In a real scenario, we would verify these against an 'api_keys' table
        // For now, we'll allow it if either header or Bearer token is present (developer mode)
        if (!apiKey && !authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized: Missing authentication" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        const url = new URL(req.url)
        const path = url.pathname.split('/').pop()

        // Handler for GET requests (Data Fetching)
        if (req.method === 'GET') {
            if (path === 'clients') {
                const search = url.searchParams.get('search')
                const clientCode = url.searchParams.get('client_code')

                let query = supabaseAdmin.from('clients').select('*')

                if (clientCode) {
                    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clientCode)
                    if (isUuid) {
                        query = query.or(`id.eq.${clientCode},billing_sync_id.eq.${clientCode}`)
                    } else {
                        query = query.eq('billing_sync_id', clientCode)
                    }
                }

                if (search) {
                    query = query.or(`company_name.ilike.*${search}*,contact_person.ilike.*${search}*,email.ilike.*${search}*,billing_sync_id.ilike.*${search}*`)
                }

                const { data: clients, error } = await query.limit(50)
                if (error) throw error

                const augmentedClients = (clients || []).map((c: any) => {
                    const generatedCode = `B${c.id.slice(0, 5).toUpperCase()}`
                    return {
                        ...c,
                        name: c.company_name || c.contact_person || c.email || "Unnamed Client",
                        company_name: c.company_name,
                        client_code: c.billing_sync_id || generatedCode
                    }
                })

                // If we were looking for a specific code and didn't find it by column, 
                // check if it matches a mocked code in the result set
                let finalResults = augmentedClients
                if (clientCode && !augmentedClients.some((c: any) => c.billing_sync_id === clientCode)) {
                    finalResults = augmentedClients.filter((c: any) => c.client_code === clientCode)
                }

                return new Response(JSON.stringify(finalResults), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }

            if (path === 'invoices') {
                const { data: invoices, error } = await supabaseAdmin
                    .from('client_documents')
                    .select('*, client_profiles(billing_sync_id)')
                    .eq('doc_type', 'invoice')
                    .limit(500)

                if (error) throw error

                // Map the nested join result to fit the dashboard's expected structure
                const mappedInvoices = (invoices || []).map((inv: any) => ({
                    ...inv,
                    client_sync_id: inv.client_profiles?.billing_sync_id || inv.client_id
                }))

                return new Response(JSON.stringify(mappedInvoices), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }

            if (path === 'expenses') {
                // Mocked expenses since we don't have an expenses table yet
                const mockExpenses = [
                    { id: 1, amount: 15000, category: 'Infrastructure', date: new Date().toISOString() },
                    { id: 2, amount: 8500, category: 'Software Licenses', date: new Date().toISOString() },
                    { id: 3, amount: 12000, category: 'Marketing', date: new Date().toISOString() }
                ]
                return new Response(JSON.stringify(mockExpenses), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }
        }

        // Handler for POST requests (Events/Sync)
        if (req.method === 'POST') {
            const body = await req.json()
            const { event, data } = body

            // Support both nested {event, data} format and flat body for /clients POST
            const effectiveData = data || body
            const effectiveEvent = event || (path === 'clients' ? 'client.sync' : '')

            console.log(`Received API event: ${effectiveEvent}`, effectiveData)

            if (path === 'clients' || path === 'sync' || effectiveEvent === 'client.sync') {
                const { sync_id, name, company_name: compName, email, contact_person, phone, address } = effectiveData
                const clientName = name || compName

                // 1. Check if client profile already exists
                const { data: existing } = await supabaseAdmin
                    .from('client_profiles')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle()

                if (!existing) {
                    // 2. Create new profile in the "Billing System" (mocked as client_profiles)
                    const { error: insertError } = await supabaseAdmin
                        .from('client_profiles')
                        .insert({
                            company_name: clientName,
                            contact_person,
                            email,
                            phone,
                            address,
                            billing_sync_id: sync_id
                        })
                    if (insertError) throw insertError
                    console.log(`Created new billing profile for ${clientName}`)
                } else {
                    // Update existing with the sync_id
                    await supabaseAdmin
                        .from('client_profiles')
                        .update({ billing_sync_id: sync_id })
                        .eq('id', existing.id)
                }

                return new Response(JSON.stringify({ success: true, client_code: sync_id }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }

            if (event === 'payment.created') {
                const { client_email, amount, project_id, transaction_id, notes } = data

                // 1. Find the client
                const { data: client, error: clientError } = await supabaseAdmin
                    .from('client_profiles')
                    .select('id, company_name')
                    .eq('email', client_email)
                    .maybeSingle()

                if (clientError || !client) {
                    console.error(`Client not found for email: ${client_email}`)
                    return new Response(JSON.stringify({ error: "Client not found" }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        status: 404
                    })
                }

                // 2. Update client_projects amount_paid
                if (project_id) {
                    const { data: project } = await supabaseAdmin
                        .from('client_projects')
                        .select('amount_paid')
                        .eq('id', project_id)
                        .single()

                    if (project) {
                        const newAmountPaid = Number(project.amount_paid || 0) + Number(amount)
                        await supabaseAdmin
                            .from('client_projects')
                            .update({ amount_paid: newAmountPaid })
                            .eq('id', project_id)
                    }
                }

                // 3. Create a document (Receipt/Invoice)
                await supabaseAdmin
                    .from('client_documents')
                    .insert({
                        client_id: client.id,
                        project_id: project_id,
                        title: `Payment Received - ${transaction_id || 'API'}`,
                        file_url: 'https://vaw-tech.com/receipts/placeholder',
                        doc_type: 'payment_confirmation',
                        amount: amount,
                        status: 'paid',
                        metadata: { transaction_id, api_source: true, notes }
                    })

                // 4. Create notifications
                await supabaseAdmin.from('client_notifications').insert({
                    client_id: client.id,
                    title: "Payment Confirmed",
                    message: `We've received your payment of ₹${amount}. Thank you!`,
                    type: 'payment_confirmation',
                    category: 'payment',
                    priority: 'normal'
                })

                return new Response(JSON.stringify({ success: true, message: "Payment processed successfully" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }

            if (event === 'invoice.created') {
                // Handle new invoice creation from external system
                const { client_email, amount, title, due_date, file_url } = data

                const { data: client } = await supabaseAdmin
                    .from('client_profiles')
                    .select('id')
                    .eq('email', client_email)
                    .single()

                if (client) {
                    await supabaseAdmin.from('client_documents').insert({
                        client_id: client.id,
                        title,
                        amount,
                        file_url,
                        doc_type: 'invoice',
                        status: 'issued'
                    })

                    await supabaseAdmin.from('client_notifications').insert({
                        client_id: client.id,
                        title: "New Invoice Issued",
                        message: `A new invoice for ₹${amount} has been issued. Due: ${due_date}`,
                        type: 'invoice',
                        category: 'payment',
                        priority: 'high'
                    })
                }

                return new Response(JSON.stringify({ success: true, message: "Invoice recorded" }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                })
            }
        }

        return new Response(JSON.stringify({ message: "Method or path not handled" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
        })

    } catch (error: any) {
        console.error('Error in external-api:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
