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
          console.log('Super admin user already exists, attempting password sign-in or update...')
          
          // Try signing in with the password first
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: superAdminEmail,
            password: superAdminPassword,
          })

          if (!signInError && signInData?.user) {
            userId = signInData.user.id
            console.log('Password already matches, user ID:', userId)
          } else {
            // Password doesn't match - try to update via admin API using getUserByEmail
            // This is a workaround for the listUsers bug
            try {
              // Use the admin generateLink as a way to find the user
              const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: superAdminEmail,
              })
              
              if (linkError || !linkData?.user) {
                throw new Error('Cannot find user by email')
              }
              
              userId = linkData.user.id
              console.log('Found user via generateLink:', userId)
              
              // Now update the password
              const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: superAdminPassword }
              )
              if (updateError) {
                console.error('Error updating password:', updateError)
              } else {
                console.log('Password updated successfully for user:', userId)
              }
            } catch (findError) {
              console.error('Could not find or update user:', findError)
              throw new Error('User exists but cannot update password. Check Supabase dashboard.')
            }
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
