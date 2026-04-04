import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-patra-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const PATRA_WEBHOOK_SECRET = process.env.PATRA_WEBHOOK_SECRET || Deno.env.get('PATRA_WEBHOOK_SECRET');
    
    if (!PATRA_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const signature = req.headers.get('x-patra-signature') ?? '';
    const bodyStr = await req.text();
    const body = JSON.parse(bodyStr);

    // Verify: signature = btoa(`${timestamp}.${JSON.stringify(payload)}.${secret}`)
    // Using simple btoa in Edge Functions:
    const expectedRaw = `${body.timestamp}.${JSON.stringify(body.payload)}.${PATRA_WEBHOOK_SECRET}`;
    
    // In Deno we use btoa
    const expected = btoa(expectedRaw);

    if (signature !== expected) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (body.event === 'staff.added') {
      console.log('New Patra card created:', body.payload.card_url);
      // Optional: Save card_url to corresponding staff_profile in DB 
      // by mapping email or custom metadata
    } else if (body.event === 'staff.updated') {
      console.log('Updated Patra staff card:', body.payload.id);
    } else if (body.event === 'card.viewed') {
      console.log('Patra card viewed:', body.payload.card_url);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
