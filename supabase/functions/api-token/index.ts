
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { grant_type, client_id, client_secret } = body

        if (grant_type !== 'client_credentials') {
            return new Response(JSON.stringify({ error: "Unsupported grant type" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // Mock validation
        if (client_id && client_secret) {
            // In a real app, generate a JWT signed with a secret
            const token = "vaw_access_token_" + Math.random().toString(36).substring(7)

            return new Response(JSON.stringify({
                access_token: token,
                token_type: "Bearer",
                expires_in: 3600,
                scope: "read write billing"
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
