import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? ''

const buildUserMetadata = (fullName?: string | null, username?: string | null) => ({
  ...(fullName ? { full_name: fullName } : {}),
  ...(username ? { username } : {}),
})

export const findAuthUserByEmail = async (supabaseClient: any, email: string) => {
  const { data, error } = await supabaseClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error) {
    throw error
  }

  return data?.user ?? null
}

const syncStaffProfileUserId = async (supabaseClient: any, profileId: string | undefined, userId: string) => {
  if (!profileId) return

  const { error } = await supabaseClient
    .from('staff_profiles')
    .update({ user_id: userId })
    .eq('id', profileId)

  if (error) {
    console.error('Error syncing staff profile user_id:', error)
  }
}

if (import.meta.main) {
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

      const { userId, email, newPassword, fullName, username } = await req.json()
      const normalizedEmail = normalizeEmail(email)

      if ((!userId && !normalizedEmail) || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'userId or email, and newPassword are required' }),
          { status: 400, headers: jsonHeaders }
        )
      }

      let staffProfile = null

      if (userId || normalizedEmail) {
        let query = supabaseClient.from('staff_profiles').select('id, email, full_name, username, user_id')

        if (userId) {
          query = query.eq('user_id', userId)
        } else {
          query = query.eq('email', normalizedEmail)
        }

        const { data, error: profileError } = await query.maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching staff profile:', profileError)
        } else {
          staffProfile = data
        }
      }

      const targetEmail = normalizeEmail(staffProfile?.email || normalizedEmail)

      if (!targetEmail) {
        return new Response(
          JSON.stringify({ error: 'A valid email address is required' }),
          { status: 400, headers: jsonHeaders }
        )
      }

      const userMetadata = buildUserMetadata(
        staffProfile?.full_name || fullName,
        staffProfile?.username || username,
      )

      let resolvedUserId = staffProfile?.user_id || userId || null
      let created = false

      if (resolvedUserId) {
        const { error } = await supabaseClient.auth.admin.updateUserById(
          resolvedUserId,
          {
            email: targetEmail,
            password: newPassword,
            email_confirm: true,
            ...(Object.keys(userMetadata).length ? { user_metadata: userMetadata } : {}),
          }
        )

        if (error) {
          console.error('Error updating password by user ID:', error)

          if (!error.message?.includes('User not found')) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 400, headers: jsonHeaders }
            )
          }

          resolvedUserId = null
        }
      }

      if (!resolvedUserId) {
        console.log('Creating or reusing auth user for:', targetEmail)

        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email: targetEmail,
          password: newPassword,
          email_confirm: true,
          ...(Object.keys(userMetadata).length ? { user_metadata: userMetadata } : {}),
        })

        if (createError) {
          console.error('Error creating user:', createError)

          if (createError.message?.includes('already been registered')) {
            const existingAuthUser = await findAuthUserByEmail(supabaseClient, targetEmail)

            if (!existingAuthUser) {
              return new Response(
                JSON.stringify({ error: 'User already exists but could not be resolved for password reset' }),
                { status: 400, headers: jsonHeaders }
              )
            }

            resolvedUserId = existingAuthUser.id

            const { error: updateExistingError } = await supabaseClient.auth.admin.updateUserById(
              resolvedUserId,
              {
                email: targetEmail,
                password: newPassword,
                email_confirm: true,
                ...(Object.keys(userMetadata).length ? { user_metadata: userMetadata } : {}),
              }
            )

            if (updateExistingError) {
              console.error('Error updating existing auth user:', updateExistingError)
              return new Response(
                JSON.stringify({ error: updateExistingError.message }),
                { status: 400, headers: jsonHeaders }
              )
            }
          } else {
            return new Response(
              JSON.stringify({ error: createError.message }),
              { status: 400, headers: jsonHeaders }
            )
          }
        } else {
          resolvedUserId = newUser.user.id
          created = true
        }
      }

      if (!resolvedUserId) {
        return new Response(
          JSON.stringify({ error: 'Unable to resolve auth user for this staff account' }),
          { status: 500, headers: jsonHeaders }
        )
      }

      if (staffProfile?.id && staffProfile.user_id !== resolvedUserId) {
        await syncStaffProfileUserId(supabaseClient, staffProfile.id, resolvedUserId)
      }

      return new Response(
        JSON.stringify({ success: true, created, userId: resolvedUserId, email: targetEmail }),
        { status: 200, headers: jsonHeaders }
      )
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: jsonHeaders }
      )
    }
  })
}
