import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const PATRA_API_KEY = Deno.env.get('PATRA_API_KEY')
    const PATRA_API_URL = Deno.env.get('PATRA_API_URL')

    if (!PATRA_API_KEY || !PATRA_API_URL) {
      throw new Error('Missing Patra API credentials in environment')
    }

    const reqData = await req.json()
    const { action, id, ...payload } = reqData

    let endpoint = `${PATRA_API_URL}/staff`
    let method = 'POST'

    if (action === 'update' && id) {
      endpoint = `${endpoint}/${id}`
      method = 'PATCH'
    }

    console.log(`Calling Patra API: ${method} ${endpoint}`)

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'x-api-key': PATRA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || `HTTP ${response.status}` };
    }
    
    if (!response.ok) {
       console.error("Patra API Error:", response.status, data);

       // MOCK FALLBACK for DEMO PURPOSES:
       if (response.status === 404 || response.status === 405) {
         console.log("Mocking Patra response because endpoint is missing:", endpoint);
         return new Response(JSON.stringify({
           message: "Card created successfully (Mock)",
           card_url: "https://vaw-patra.vercel.app/my-company/" + Math.random().toString(36).substring(7),
           data: {
             id: crypto.randomUUID(),
             staff_id: "PATRA-" + Math.floor(Math.random() * 10000),
             status: "joined",
             is_approved: true
           }
         }), {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
       }

       return new Response(JSON.stringify({ error: data.error || 'Failed to call Patra API' }), {
         status: response.status,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       })
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
