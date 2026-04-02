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

    const { userId, email, newPassword } = await req.json()

    if ((!userId && !email) || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'userId or email, and newPassword are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get staff profile to check if user exists
    let query = supabaseClient.from('staff_profiles').select('id, email, full_name, username, user_id')
    
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('email', email)
    }
    
    const { data: staffProfile, error: profileError } = await query.maybeSingle()

    if (profileError || !staffProfile) {
      console.error('Error fetching staff profile:', profileError || 'Profile not found')
      return new Response(
        JSON.stringify({ error: 'Staff profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine the actual user_id to use for auth update
    const actualUserId = staffProfile.user_id || userId;
    const targetEmail = staffProfile.email || email;

    let updateError = null;
    
    if (actualUserId) {
      // Try to update existing user by ID
      const { error } = await supabaseClient.auth.admin.updateUserById(
        actualUserId,
        { password: newPassword, email_confirm: true }
      )
      updateError = error;
    } else {
      // If no actualUserId, we might need to search by email in auth
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
      if (listError) {
        console.error('Error listing users:', listError)
        updateError = listError;
      } else {
        const existingAuthUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase())
        if (existingAuthUser) {
          const { error } = await supabaseClient.auth.admin.updateUserById(
            existingAuthUser.id,
            { password: newPassword, email_confirm: true }
          )
          updateError = error;
          
          // Sync the user_id back to staff_profile if it was missing
          if (!staffProfile.user_id) {
            await supabaseClient
              .from('staff_profiles')
              .update({ user_id: existingAuthUser.id })
              .eq('id', staffProfile.id)
          }
        } else {
          // Trigger the 'User not found' creation logic
          updateError = { message: 'User not found' };
        }
      }
    }

    // If user doesn't exist, create them
    if (updateError && updateError.message.includes('User not found')) {
      console.log('User not found, creating new auth user for:', targetEmail)
      
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email: targetEmail,
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
        .eq('id', staffProfile.id)

      if (updateProfileError) {
        console.error('Error updating staff profile with new user_id:', updateProfileError)
      }

      return new Response(
        JSON.stringify({ success: true, created: true }),
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
