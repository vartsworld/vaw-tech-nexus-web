import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple WebAuthn helpers using the Web Authentication API
const bufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToBuffer = (base64: string): ArrayBuffer =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;

const generateChallenge = (): ArrayBuffer => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr.buffer;
};

export interface BiometricCredential {
  id: string;
  credential_id: string;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export const useBiometricAuth = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);

  useEffect(() => {
    const check = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      }
    };
    check();
  }, []);

  const loadCredentials = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("staff_biometric_credentials" as any)
      .select("id, credential_id, device_name, created_at, last_used_at")
      .eq("user_id", user.id);

    if (data) setCredentials(data as any as BiometricCredential[]);
  }, []);

  const register = useCallback(
    async (deviceName?: string): Promise<boolean> => {
      setIsRegistering(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get staff profile for username
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("username, full_name")
          .eq("user_id", user.id)
          .single();

        const challenge = generateChallenge();

        // Check platform authenticator is actually available before trying
        const platformAvailable =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!platformAvailable) {
          throw new Error(
            "This device does not have a built-in fingerprint or face sensor."
          );
        }

        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: {
              name: "VAW Staff Portal",
              id: window.location.hostname,
            },
            user: {
              id: new TextEncoder().encode(user.id),
              name: profile?.username || user.email || "staff",
              displayName: profile?.full_name || "Staff Member",
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" }, // ES256
              { alg: -257, type: "public-key" }, // RS256
            ],
            authenticatorSelection: {
              // Force the BUILT-IN sensor (Touch ID / Windows Hello / Android fingerprint)
              // and prevent the browser from offering "use phone / security key" flow
              authenticatorAttachment: "platform",
              userVerification: "required",
              requireResidentKey: false,
              residentKey: "discouraged",
            },
            attestation: "none",
            // Hint modern browsers to prefer client-device only
            hints: ["client-device"] as never,
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;

        if (!credential) throw new Error("Registration cancelled");

        const response = credential.response as AuthenticatorAttestationResponse;
        const credentialId = bufferToBase64(credential.rawId);
        const publicKey = bufferToBase64(response.attestationObject);

        const { error } = await supabase
          .from("staff_biometric_credentials" as any)
          .insert({
            user_id: user.id,
            credential_id: credentialId,
            public_key: publicKey,
            device_name:
              deviceName ||
              (navigator.userAgent.includes("Mobile") ? "Phone" : "Computer"),
          });

        if (error) throw error;

        await loadCredentials();
        return true;
      } catch (err) {
        console.error("Biometric registration error:", err);
        return false;
      } finally {
        setIsRegistering(false);
      }
    },
    [loadCredentials]
  );

  const authenticate = useCallback(async (): Promise<{
    success: boolean;
    userId?: string;
    email?: string;
    role?: string;
    isDepartmentHead?: boolean;
  }> => {
    setIsAuthenticating(true);
    try {
      const challenge = generateChallenge();

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) throw new Error("Authentication cancelled");

      const credentialId = bufferToBase64(assertion.rawId);

      // Look up user by credential
      const { data, error } = await supabase.rpc("get_biometric_user" as any, {
        p_credential_id: credentialId,
      });

      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        return { success: false };
      }

      const userData = Array.isArray(data) ? data[0] : data;

      // Update last_used_at via a separate authenticated call after login
      // For now, return the user info for the login page to handle auth
      return {
        success: true,
        userId: userData.user_id,
        email: userData.email,
        role: userData.staff_role,
        isDepartmentHead: userData.is_department_head,
      };
    } catch (err) {
      console.error("Biometric auth error:", err);
      return { success: false };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const removeCredential = useCallback(
    async (credentialDbId: string): Promise<boolean> => {
      const { error } = await supabase
        .from("staff_biometric_credentials" as any)
        .delete()
        .eq("id", credentialDbId);

      if (!error) await loadCredentials();
      return !error;
    },
    [loadCredentials]
  );

  return {
    isSupported,
    isRegistering,
    isAuthenticating,
    credentials,
    loadCredentials,
    register,
    authenticate,
    removeCredential,
  };
};
