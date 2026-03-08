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
      const superAdminEmail = Deno.env.get('SUPER_ADMIN_EMAIL') ?? 'admin.vaw.super@vaw.tech'
      const superAdminPassword = Deno.env.get('SUPER_ADMIN_PASSWORD')

      if (!superAdminPassword) {
        throw new Error('SUPER_ADMIN_PASSWORD environment variable is not set')
      }

      // Try to create user first, handle "already exists" error
      let userId: string

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
        if (createError.message?.includes('already been registered')) {
          // User exists - find by email using a different method
          console.log('Super admin user already exists, looking up by email...')
          
          // Sign in to get the user id, then update password
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: superAdminEmail,
            password: superAdminPassword,
          })

          if (signInError) {
            // Password might be different, use admin API to find user
            // Query auth.users directly via SQL is not allowed, so we use a workaround
            // Try listing with a per_page of 1 and filter
            const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
              perPage: 50
            })
            
            if (listError) {
              // As fallback, try to get user via invite/recovery flow
              console.log('Cannot list users, attempting password update via admin API...')
              throw new Error('Cannot find existing user. Please check Supabase dashboard.')
            }
            
            const existingUser = listData?.users?.find(u => u.email === superAdminEmail)
            if (!existingUser) {
              throw new Error('User registered but not found in listing')
            }
            
            userId = existingUser.id
            
            // Update password
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              userId,
              { password: superAdminPassword }
            )
            if (updateError) {
              console.error('Error updating password:', updateError)
            } else {
              console.log('Password updated for existing user:', userId)
            }
          } else {
            userId = signInData.user.id
            console.log('Signed in as existing user:', userId)
            // Password already matches, no update needed
          }
        } else {
          throw new Error(`Failed to create super admin: ${createError.message}`)
        }
      } else {
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

  } catch (error: unknown) {
    console.error('Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
