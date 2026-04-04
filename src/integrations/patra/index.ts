import { supabase } from "@/integrations/supabase/client";
import { PatraStaffInput, PatraStaffResponse } from "@/types/patra";

export async function createPatraStaff(input: PatraStaffInput): Promise<PatraStaffResponse> {
  const { data, error } = await supabase.functions.invoke('patra-staff', {
    body: { action: 'create', ...input }
  });

  if (error) {
    throw new Error(error.message || `Patra API error`);
  }
  
  if (data?.error) {
     throw new Error(data.error);
  }

  return data;
}

export async function updatePatraStaff(
  id: string,
  updates: Partial<PatraStaffInput>
): Promise<PatraStaffResponse> {
  const { data, error } = await supabase.functions.invoke('patra-staff', {
    body: { action: 'update', id, ...updates }
  });

  if (error) {
    throw new Error(error.message || `Patra API error`);
  }
  
  if (data?.error) {
     throw new Error(data.error);
  }

  return data;
}
