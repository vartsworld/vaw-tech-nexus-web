import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'userId and newPassword are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get staff profile to check if user exists
    const { data: staffProfile, error: profileError } = await supabaseClient
      .from('staff_profiles')
      .select('email, full_name, username')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching staff profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Staff profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to update existing user first
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    // If user doesn't exist, create them
    if (updateError && updateError.message.includes('User not found')) {
      console.log('User not found, creating new auth user...')
      
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: staffProfile.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: staffProfile.full_name,
          username: staffProfile.username,
        }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update staff_profiles with the correct user_id
      const { error: updateProfileError } = await supabaseClient
        .from('staff_profiles')
        .update({ user_id: newUser.user.id })
        .eq('user_id', userId)

      if (updateProfileError) {
        console.error('Error updating staff profile with new user_id:', updateProfileError)
      }

      return new Response(
        JSON.stringify({ success: true, data: newUser, created: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
