// Edge Function: Client Onboarding
// Purpose: Triggered when HR creates a new client - handles profile creation and webpage generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { client_id, send_welcome_email = true } = await req.json()

        if (!client_id) {
            throw new Error('client_id is required')
        }

        // Fetch client data from clients table
        const { data: clientData, error: clientError } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('id', client_id)
            .single()

        if (clientError || !clientData) {
            throw new Error(`Client not found: ${clientError?.message}`)
        }

        // Check if client_profile already exists
        let clientProfile
        const { data: existingProfile } = await supabaseAdmin
            .from('client_profiles')
            .select('*')
            .eq('email', clientData.email)
            .maybeSingle()

        if (existingProfile) {
            clientProfile = existingProfile
            console.log('Client profile already exists:', existingProfile.id)
        } else {
            // Create client_profile entry
            const { data: newProfile, error: profileError } = await supabaseAdmin
                .from('client_profiles')
                .insert({
                    user_id: clientData.user_id,
                    company_name: clientData.company_name,
                    contact_person: clientData.contact_person,
                    email: clientData.email,
                    phone: clientData.phone,
                    address: clientData.address
                })
                .select()
                .single()

            if (profileError) {
                throw new Error(`Failed to create client profile: ${profileError.message}`)
            }

            clientProfile = newProfile
            console.log('Created client profile:', newProfile.id)
        }

        // Generate slug for client webpage
        const slug = clientData.company_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + clientProfile.id.split('-')[0]

        // Check if webpage already exists
        const { data: existingWebpage } = await supabaseAdmin
            .from('client_webpages')
            .select('*')
            .eq('client_id', clientProfile.id)
            .maybeSingle()

        let webpage
        if (existingWebpage) {
            webpage = existingWebpage
            console.log('Client webpage already exists:', existingWebpage.slug)
        } else {
            // Create client webpage
            const { data: newWebpage, error: webpageError } = await supabaseAdmin
                .from('client_webpages')
                .insert({
                    client_id: clientProfile.id,
                    slug: slug,
                    template: 'default',
                    branding: {
                        primary_color: '#FFD700',
                        secondary_color: '#000000',
                        logo_url: null
                    },
                    content: {
                        hero: {
                            title: clientData.company_name,
                            subtitle: `Partner with VAW Technologies`,
                            description: `Welcome to ${clientData.company_name}'s dedicated portal`
                        },
                        about: {
                            title: 'About Us',
                            description: `${clientData.company_name} is a valued client of VAW Technologies.`
                        },
                        contact: {
                            email: clientData.email,
                            phone: clientData.phone,
                            address: clientData.address
                        }
                    },
                    is_published: false,
                    created_by: clientData.created_by
                })
                .select()
                .single()

            if (webpageError) {
                console.error('Failed to create webpage:', webpageError)
                // Don't fail the entire operation if webpage creation fails
            } else {
                webpage = newWebpage
                console.log('Created client webpage:', newWebpage.slug)
            }
        }

        // Create welcome notification
        if (clientData.user_id) {
            await supabaseAdmin
                .from('client_notifications')
                .insert({
                    client_id: clientProfile.id,
                    title: 'Welcome to VAW Technologies!',
                    message: `Welcome ${clientData.contact_person}! Your account has been created successfully. Explore your dashboard to view projects, payments, and more.`,
                    type: 'welcome',
                    category: 'system',
                    priority: 'high',
                    read: false
                })
        }

        // Send welcome email (simplified - in production use proper email service)
        if (send_welcome_email && clientData.email) {
            console.log(`Welcome email would be sent to: ${clientData.email}`)
            // TODO: Integrate with email service (SendGrid, Resend, etc.)
        }

        // Notify super admins
        const { data: superAdmins } = await supabaseAdmin
            .from('super_admins')
            .select('user_id')

        for (const admin of superAdmins || []) {
            await supabaseAdmin
                .from('client_notifications')
                .insert({
                    client_id: null,
                    title: 'New Client Onboarded',
                    message: `${clientData.company_name} has been added as a new client.`,
                    type: 'admin_alert',
                    category: 'system',
                    priority: 'normal',
                    read: false
                })
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Client onboarded successfully',
                data: {
                    client_profile_id: clientProfile.id,
                    webpage_slug: webpage?.slug,
                    webpage_url: webpage ? `/clients/${webpage.slug}` : null
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error in client-onboarding:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
