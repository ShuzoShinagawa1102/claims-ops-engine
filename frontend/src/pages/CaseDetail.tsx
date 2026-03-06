import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  getCase,
  updateCaseStatus,
  addEvidence,
  updateEvidence,
  recommendDecision,
  confirmDecision,
  getDecisions,
} from '../lib/api';
import type { CaseStatus, Requirement, Evidence } from '../types';
import { VALID_TRANSITIONS } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ProductIcon from '../components/ProductIcon';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Plus, ClipboardList, FileText, Brain, Clock } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'overview' | 'requirements' | 'decision' | 'audit';

const REQ_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  fulfilled: 'bg-green-100 text-green-700',
  waived: 'bg-blue-100 text-blue-600',
  overdue: 'bg-red-100 text-red-700',
};

const RECOMMENDATION_STYLES: Record<string, string> = {
  approve: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  request_more_info: 'bg-amber-100 text-amber-700',
  escalate: 'bg-purple-100 text-purple-700',
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  approve: 'Approve',
  reject: 'Reject',
  request_more_info: 'Request More Info',
  escalate: 'Escalate',
};

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    title: '',
    evidence_type: 'document',
    description: '',
    requirement_id: '',
    notes: '',
  });
  const [confirmerName, setConfirmerName] = useState('');

  const { data: caseDetail, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: () => getCase(id!),
    enabled: !!id,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions', id],
    queryFn: () => getDecisions(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: CaseStatus) => updateCaseStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: () =>
      addEvidence(id!, {
        title: evidenceForm.title,
        evidence_type: evidenceForm.evidence_type,
        description: evidenceForm.description || undefined,
        requirement_id: evidenceForm.requirement_id || undefined,
        notes: evidenceForm.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      setShowAddEvidence(false);
      setEvidenceForm({ title: '', evidence_type: 'document', description: '', requirement_id: '', notes: '' });
    },
  });

  const updateEvidenceMutation = useMutation({
    mutationFn: ({ evidenceId, status }: { evidenceId: string; status: string }) =>
      updateEvidence(id!, evidenceId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case', id] }),
  });

  const recommendMutation = useMutation({
    mutationFn: () => recommendDecision(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', id] });
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (decisionId: string) => confirmDecision(id!, decisionId, confirmerName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decisions', id] }),
  });

  if (isLoading || !caseDetail) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const latestDecision = decisions[0];
  const allowedTransitions = VALID_TRANSITIONS[caseDetail.status] ?? [];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'requirements', label: 'Requirements & Evidence', icon: FileText },
    { id: 'decision', label: 'Decision', icon: Brain },
    { id: 'audit', label: 'Audit Trail', icon: Clock },
  ];

  const getEvidenceForReq = (req: Requirement): Evidence[] =>
    caseDetail.evidence.filter((e) => e.requirement_id === req.id);

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5"
      >
        <ArrowLeft size={15} /> All Cases
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ProductIcon type={caseDetail.product_type} size={22} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">{caseDetail.case_number}</span>
                <StatusBadge status={caseDetail.status} />
                <PriorityBadge priority={caseDetail.priority} size="sm" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{caseDetail.title}</h2>
            </div>
          </div>
          {allowedTransitions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allowedTransitions.map((s) => (
                <button
                  key={s}
                  onClick={() => statusMutation.mutate(s)}
                  disabled={statusMutation.isPending}
                  className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  → {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tabId
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                Claimant Information
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-800">{caseDetail.claimant_name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="text-slate-700">{caseDetail.claimant_email}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Channel</dt><dd className="capitalize text-slate-700">{caseDetail.channel}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Assigned To</dt><dd className="text-slate-700">{caseDetail.assigned_to ?? '—'}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                Incident Details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Product Type</dt><dd className="capitalize text-slate-800 font-medium">{caseDetail.product_type}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Incident Date</dt><dd className="text-slate-700">{caseDetail.incident_date}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Estimated Amount</dt><dd className="text-slate-700">{caseDetail.estimated_amount != null ? `$${caseDetail.estimated_amount.toLocaleString()}` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Approved Amount</dt><dd className="text-green-700 font-medium">{caseDetail.approved_amount != null ? `$${caseDetail.approved_amount.toLocaleString()}` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd className="text-slate-700">{format(new Date(caseDetail.created_at), 'MMM d, yyyy h:mm a')}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Updated</dt><dd className="text-slate-700">{format(new Date(caseDetail.updated_at), 'MMM d, yyyy h:mm a')}</dd></div>
              </dl>
            </div>
            {caseDetail.description && (
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Description</h3>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{caseDetail.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Requirements & Evidence */}
        {activeTab === 'requirements' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Requirements ({caseDetail.requirements.length})
              </h3>
              <button
                onClick={() => setShowAddEvidence(!showAddEvidence)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <Plus size={13} /> Add Evidence
              </button>
            </div>

            {showAddEvidence && (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Submit Evidence</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                    <input
                      type="text"
                      value={evidenceForm.title}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Evidence title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                    <select
                      value={evidenceForm.evidence_type}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, evidence_type: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="document">Document</option>
                      <option value="photo">Photo</option>
                      <option value="video">Video</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Linked Requirement</label>
                    <select
                      value={evidenceForm.requirement_id}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, requirement_id: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      {caseDetail.requirements.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                    <input
                      type="text"
                      value={evidenceForm.notes}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={evidenceForm.description}
                      onChange={(e) => setEvidenceForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Brief description of this evidence"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addEvidenceMutation.mutate()}
                    disabled={!evidenceForm.title || addEvidenceMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {addEvidenceMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                    Submit
                  </button>
                  <button
                    onClick={() => setShowAddEvidence(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {caseDetail.requirements.map((req) => {
                const linkedEvidence = getEvidenceForReq(req);
                return (
                  <div key={req.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 text-sm">{req.name}</span>
                          {req.is_mandatory && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Required</span>
                          )}
                        </div>
                        {req.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{req.description}</p>
                        )}
                        <span className="text-xs text-slate-400 capitalize mt-0.5 block">
                          Evidence type: {req.required_evidence_type}
                        </span>
                      </div>
                      <span className={clsx('text-xs px-2 py-1 rounded-full font-medium capitalize', REQ_STATUS_STYLES[req.status])}>
                        {req.status}
                      </span>
                    </div>

                    {linkedEvidence.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {linkedEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs"
                          >
                            <div>
                              <span className="font-medium text-slate-700">{ev.title}</span>
                              <span className={clsx('ml-2 px-1.5 py-0.5 rounded-full capitalize',
                                ev.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                ev.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-slate-200 text-slate-600'
                              )}>
                                {ev.status}
                              </span>
                            </div>
                            {ev.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => updateEvidenceMutation.mutate({ evidenceId: ev.id, status: 'accepted' })}
                                  disabled={updateEvidenceMutation.isPending}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-800"
                                >
                                  <CheckCircle size={14} /> Accept
                                </button>
                                <button
                                  onClick={() => updateEvidenceMutation.mutate({ evidenceId: ev.id, status: 'rejected' })}
                                  disabled={updateEvidenceMutation.isPending}
                                  className="flex items-center gap-1 text-red-500 hover:text-red-700"
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400 italic">No evidence submitted for this requirement.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Decision */}
        {activeTab === 'decision' && (
          <div className="max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Decision Support</h3>
              <button
                onClick={() => recommendMutation.mutate()}
                disabled={recommendMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {recommendMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Brain size={14} />
                )}
                Get Recommendation
              </button>
            </div>

            {latestDecision ? (
              <div className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={clsx('px-3 py-1.5 rounded-full text-sm font-semibold', RECOMMENDATION_STYLES[latestDecision.recommendation])}>
                    {RECOMMENDATION_LABELS[latestDecision.recommendation]}
                  </span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(latestDecision.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Evidence Completeness</span>
                    <span className="font-semibold">{(latestDecision.evidence_completeness_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${latestDecision.evidence_completeness_score * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Confidence Score</span>
                    <span className="font-semibold">{(latestDecision.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${latestDecision.confidence_score * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Reason</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{latestDecision.reason}</p>
                </div>

                {latestDecision.confirmed_by ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                    ✓ Confirmed by <strong>{latestDecision.confirmed_by}</strong>{' '}
                    on {format(new Date(latestDecision.confirmed_at!), 'MMM d, yyyy')}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={confirmerName}
                      onChange={(e) => setConfirmerName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => confirmMutation.mutate(latestDecision.id)}
                      disabled={!confirmerName || confirmMutation.isPending}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {confirmMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No decision recommendations yet. Click "Get Recommendation" to generate one.
              </p>
            )}
          </div>
        )}

        {/* Audit Trail */}
        {activeTab === 'audit' && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Audit Trail
            </h3>
            {caseDetail.audit_events?.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No audit events yet.</p>
            ) : (
              <div className="relative pl-4">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-slate-200" />
                {caseDetail.audit_events?.map((event) => (
                  <div key={event.id} className="relative flex gap-3 pb-4">
                    <div className="absolute left-[-11px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-white" />
                    <div className="flex-1 bg-slate-50 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-600">{event.event_type}</span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5">{event.description}</p>
                      <p className="text-xs text-slate-400 mt-1">by {event.actor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
