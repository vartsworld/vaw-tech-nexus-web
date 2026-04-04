export interface PatraStaffInput {
  display_name: string;            // Required
  email: string;                   // Required
  job_title: string;               // Required
  phone?: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
  location?: string;
  design?: string;                 // Override default card template ID
  metadata?: Record<string, unknown>;
}

export interface PatraStaffResponse {
  message: string;
  card_url: string;                // Live URL — share this with the employee
  data: {
    id: string;                    // UUID — use for PATCH calls
    staff_id: string;              // Short ID e.g. "ABC123" — in the card URL
    status: 'joined' | 'invited' | 'rejected';
    is_approved: boolean;
  };
}

export interface PatraWebhookPayload {
  event: 'staff.added' | 'staff.updated' | 'card.viewed';
  timestamp: number;               // Unix epoch seconds
  payload: PatraStaffResponse['data'] & {
    card_url: string;
    data_submitted: PatraStaffInput;
  };
}
