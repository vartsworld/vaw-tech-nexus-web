import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { client_profile_id, email, action } = await req.json();

    // Basic input validation
    if (!client_profile_id || !email || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields: client_profile_id, email, action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to verify the caller is HR/Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is HR or super admin
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('role, department_id')
      .eq('user_id', caller.id)
      .single();

    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', caller.id)
      .single();

    const isHR = staffProfile?.role === 'hr' || staffProfile?.role === 'admin';
    const isSuperAdmin = !!superAdmin;

    if (!isHR && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions. Only HR or Super Admin can manage client credentials.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the client profile
    const { data: clientProfile, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', client_profile_id)
      .single();

    if (profileError || !clientProfile) {
      return new Response(JSON.stringify({ error: 'Client profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new password
    const newPassword = generatePassword(12);

    if (action === 'create') {
      // Check if user already exists
      if (clientProfile.user_id) {
        return new Response(JSON.stringify({ error: 'Client already has login credentials. Use reset action instead.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: 'client',
          client_profile_id: client_profile_id,
          company_name: clientProfile.company_name
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ error: `Failed to create user: ${createError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update client profile with user_id
      const { error: updateError } = await supabase
        .from('client_profiles')
        .update({ user_id: newUser.user.id })
        .eq('id', client_profile_id);

      if (updateError) {
        console.error('Error updating client profile:', updateError);
        // Try to clean up the created user
        await supabase.auth.admin.deleteUser(newUser.user.id);
        return new Response(JSON.stringify({ error: 'Failed to link user to client profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log the credential management action
      await supabase.from('client_credential_management').insert({
        client_id: client_profile_id,
        managed_by: caller.id,
        action: 'create'
      });

      console.log(`Client credentials created for: ${email} by ${caller.email}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Client credentials created successfully',
        email: email,
        password: newPassword, // Return password for HR to share with client
        note: 'Please share these credentials securely with the client. They should change their password after first login.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'reset') {
      // Reset password for existing user
      if (!clientProfile.user_id) {
        return new Response(JSON.stringify({ error: 'Client does not have login credentials. Use create action instead.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update the user's password
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        clientProfile.user_id,
        { password: newPassword }
      );

      if (resetError) {
        console.error('Error resetting password:', resetError);
        return new Response(JSON.stringify({ error: `Failed to reset password: ${resetError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log the credential management action
      await supabase.from('client_credential_management').insert({
        client_id: client_profile_id,
        managed_by: caller.id,
        action: 'reset'
      });

      console.log(`Client password reset for: ${email} by ${caller.email}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Client password reset successfully',
        email: email,
        password: newPassword,
        note: 'Please share this new password securely with the client.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use "create" or "reset".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Client password management error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred during credential management' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
