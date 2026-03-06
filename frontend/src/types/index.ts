export type ProductType = 'auto' | 'health' | 'travel' | 'property';
export type CaseStatus =
  | 'Draft'
  | 'IntakeValidated'
  | 'WaitingForEvidence'
  | 'InReview'
  | 'Exception'
  | 'Approved'
  | 'Rejected'
  | 'Closed'
  | 'Reopened';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Channel = 'web' | 'phone' | 'email' | 'portal';
export type RequirementStatus = 'pending' | 'fulfilled' | 'waived' | 'overdue';
export type EvidenceStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type Recommendation = 'approve' | 'reject' | 'request_more_info' | 'escalate';

export interface Requirement {
  id: string;
  case_id: string;
  name: string;
  description: string | null;
  required_evidence_type: string;
  is_mandatory: boolean;
  due_date: string | null;
  status: RequirementStatus;
}

export interface Evidence {
  id: string;
  case_id: string;
  requirement_id: string | null;
  evidence_type: string;
  title: string;
  description: string | null;
  file_name: string | null;
  status: EvidenceStatus;
  submitted_at: string;
  expires_at: string | null;
  notes: string | null;
}

export interface Decision {
  id: string;
  case_id: string;
  recommendation: Recommendation;
  confidence_score: number;
  reason: string;
  evidence_completeness_score: number;
  created_at: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
}

export interface AuditEvent {
  id: string;
  case_id: string;
  event_type: string;
  actor: string;
  description: string;
  event_metadata: string | null;
  created_at: string;
}

export interface ClaimCase {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  claimant_name: string;
  claimant_email: string;
  incident_date: string;
  product_type: ProductType;
  status: CaseStatus;
  channel: Channel;
  assigned_to: string | null;
  priority: Priority;
  estimated_amount: number | null;
  approved_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimCaseDetail extends ClaimCase {
  requirements: Requirement[];
  evidence: Evidence[];
  decisions: Decision[];
  audit_events: AuditEvent[];
}

export interface CreateCasePayload {
  title: string;
  description?: string;
  claimant_name: string;
  claimant_email: string;
  incident_date: string;
  product_type: ProductType;
  channel?: Channel;
  assigned_to?: string;
  priority?: Priority;
  estimated_amount?: number;
}

export interface CaseFilters {
  status?: CaseStatus;
  product_type?: ProductType;
  priority?: Priority;
}

export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  Draft: ['IntakeValidated'],
  IntakeValidated: ['WaitingForEvidence'],
  WaitingForEvidence: ['InReview'],
  InReview: ['Exception', 'Approved', 'Rejected'],
  Exception: ['InReview', 'Closed'],
  Approved: ['Closed'],
  Rejected: ['Closed', 'Reopened'],
  Closed: ['Reopened'],
  Reopened: ['IntakeValidated', 'WaitingForEvidence', 'InReview'],
};
