import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting using in-memory store (resets on function restart)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return false;
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
    return false;
  }
  
  // Check if rate limited
  if (attempts.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  // Increment count
  attempts.count++;
  attempts.lastAttempt = now;
  loginAttempts.set(identifier, attempts);
  return false;
}

function resetAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// Constant-time string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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

    const { email, password } = await req.json();

    // Basic input validation
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      console.log('Invalid input received');
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting by email
    const emailLower = email.toLowerCase().trim();
    if (isRateLimited(emailLower)) {
      console.log(`Rate limited: ${emailLower}`);
      return new Response(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch admin user by email
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, password_hash')
      .eq('email', emailLower)
      .single();

    if (fetchError || !adminUser) {
      console.log(`Admin not found: ${emailLower}`);
      // Don't reveal whether email exists
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compare password using constant-time comparison
    // NOTE: Passwords are currently stored as plaintext in password_hash column
    // For production, migrate to bcrypt hashing with edge function:
    // const isValid = await bcrypt.compare(password, adminUser.password_hash);
    const isValid = secureCompare(password, adminUser.password_hash);

    if (!isValid) {
      console.log(`Invalid password for: ${emailLower}`);
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reset rate limit on successful login
    resetAttempts(emailLower);

    // Generate a simple session token (for real production, use JWT with proper signing)
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    console.log(`Successful login for admin: ${emailLower}`);

    return new Response(JSON.stringify({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role,
      },
      session: {
        token: sessionToken,
        expires_at: expiresAt,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred during authentication' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
