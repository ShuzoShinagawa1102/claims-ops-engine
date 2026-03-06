import axios from 'axios';
import type {
  ClaimCase,
  ClaimCaseDetail,
  CreateCasePayload,
  CaseFilters,
  CaseStatus,
  Evidence,
  Decision,
  AuditEvent,
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Cases
export const getCases = (filters?: CaseFilters) =>
  api.get<ClaimCase[]>('/api/cases', { params: filters }).then((r) => r.data);

export const createCase = (data: CreateCasePayload) =>
  api.post<ClaimCaseDetail>('/api/cases', data).then((r) => r.data);

export const getCase = (id: string) =>
  api.get<ClaimCaseDetail>(`/api/cases/${id}`).then((r) => r.data);

export const updateCaseStatus = (id: string, status: CaseStatus) =>
  api.patch<ClaimCase>(`/api/cases/${id}/status`, { status }).then((r) => r.data);

export const deleteCase = (id: string) =>
  api.delete(`/api/cases/${id}`).then((r) => r.data);

// Evidence
export const getEvidence = (caseId: string) =>
  api.get<Evidence[]>(`/api/cases/${caseId}/evidence`).then((r) => r.data);

export const addEvidence = (
  caseId: string,
  data: {
    title: string;
    evidence_type: string;
    description?: string;
    requirement_id?: string;
    notes?: string;
    file_name?: string;
  },
) => api.post<Evidence>(`/api/cases/${caseId}/evidence`, data).then((r) => r.data);

export const updateEvidence = (
  caseId: string,
  evidenceId: string,
  data: { status?: string; notes?: string },
) =>
  api
    .patch<Evidence>(`/api/cases/${caseId}/evidence/${evidenceId}`, data)
    .then((r) => r.data);

// Decisions
export const getDecisions = (caseId: string) =>
  api
    .get<Decision[]>(`/api/cases/${caseId}/decisions`)
    .then((r) => r.data);

export const recommendDecision = (caseId: string) =>
  api
    .post<Decision>(`/api/cases/${caseId}/decisions/recommend`)
    .then((r) => r.data);

export const confirmDecision = (
  caseId: string,
  decisionId: string,
  confirmedBy: string,
) =>
  api
    .post<Decision>(`/api/cases/${caseId}/decisions/${decisionId}/confirm`, {
      confirmed_by: confirmedBy,
    })
    .then((r) => r.data);

// Audit
export const getAuditTrail = (caseId: string) =>
  api
    .get<AuditEvent[]>(`/api/cases/${caseId}/audit`)
    .then((r) => r.data);

// Seed
export const seedData = () =>
  api.post<{ message: string; count: number }>('/api/seed').then((r) => r.data);
