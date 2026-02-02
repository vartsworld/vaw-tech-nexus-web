// Edge Function: Create Super Admin
// Purpose: Creates the super admin user account with specified credentials

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
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

    const { action } = await req.json()

    if (action === 'create_super_admin') {
      // Super admin credentials (moved to environment variables for security)
      const superAdminEmail = Deno.env.get('SUPER_ADMIN_EMAIL') ?? 'superwow@vaw.tech'
      const superAdminPassword = Deno.env.get('SUPER_ADMIN_PASSWORD')

      if (!superAdminPassword) {
        throw new Error('SUPER_ADMIN_PASSWORD environment variable is not set')
      }

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === superAdminEmail)

      let userId: string

      if (existingUser) {
        console.log('Super admin user already exists:', existingUser.id)
        userId = existingUser.id

        // Update password just in case
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: superAdminPassword }
        )

        if (updateError) {
          console.error('Error updating super admin password:', updateError)
        }
      } else {
        // Create new super admin user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: superAdminEmail,
          password: superAdminPassword,
          email_confirm: true,
          user_metadata: {
            full_name: 'Super Administrator',
            role: 'super_admin'
          }
        })

        if (createError) {
          throw new Error(`Failed to create super admin: ${createError.message}`)
        }

        userId = newUser.user.id
        console.log('Created super admin user:', userId)
      }

      // Add to super_admins table if not exists
      const { error: insertError } = await supabaseAdmin
        .from('super_admins')
        .upsert({
          user_id: userId,
          granted_by: userId,
          granted_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (insertError) {
        console.error('Error adding to super_admins table:', insertError)
        throw new Error(`Failed to add to super_admins table: ${insertError.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Super admin created successfully',
          userId: userId,
          email: superAdminEmail
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
