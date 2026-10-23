import { supabase } from "@/integrations/supabase/client";

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export const CONTACT_PHONE = "+91 99468 82478";
export const CONTACT_PHONE_HREF = "tel:+919946882478";
export const CONTACT_EMAIL = "info.virtualarts@gmail.com";

/**
 * Stores a lead in the `inquiries` table.
 * Throws when the insert fails, so callers can show an honest error instead of
 * telling the visitor that their request was received when it was not.
 */
export const submitInquiry = async (payload: InquiryPayload): Promise<void> => {
  const { error } = await supabase.from("inquiries").insert({
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || null,
    service: payload.service?.trim() || null,
    message: payload.message,
    status: "new",
  });
  if (error) throw error;
};
