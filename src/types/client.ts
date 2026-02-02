export type ProjectStatus = 'planning' | 'development' | 'progress' | 'active' | 'functional' | 'error' | 'paused' | 'cancel';
export type ProjectType = 'website' | 'marketing' | 'design' | 'ai' | 'vr-ar' | 'software' | 'other';
export type FileType = 'design' | 'preview' | 'data' | 'img' | 'video' | 'doc' | 'zip' | 'apk' | 'svg' | 'gif' | 'html' | 'json' | 'js';
export type FeedbackType = 'suggestion' | 'update_request' | 'feedback' | 'bug_report' | 'support';

export interface ClientProfile {
    id: string;
    user_id: string;
    company_name: string;
    contact_person: string;
    email: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
}

export interface ClientProject {
    id: string;
    client_id: string;
    title: string;
    description?: string;
    project_type: ProjectType;
    status: ProjectStatus;
    progress: number;
    total_amount: number;
    amount_paid: number;
    next_payment_date?: string;
    renewal_date?: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectFile {
    id: string;
    project_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_category: string;
    file_size_bytes?: number;
    uploaded_by_client: boolean;
    created_at: string;
}

export interface ClientFeedback {
    id: string;
    client_id: string;
    project_id?: string;
    type: FeedbackType;
    subject: string;
    message: string;
    status: 'pending' | 'reviewed' | 'in_progress' | 'resolved';
    created_at: string;
    updated_at: string;
}

export interface ClientDocument {
    id: string;
    client_id: string;
    project_id?: string;
    title: string;
    file_url: string;
    doc_type: 'invoice' | 'agreement' | 'contract';
    amount?: number;
    status: string;
    created_at: string;
}
