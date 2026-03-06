import type { CaseStatus } from '../types';
import clsx from 'clsx';

const STATUS_STYLES: Record<CaseStatus, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  IntakeValidated: 'bg-blue-100 text-blue-700',
  WaitingForEvidence: 'bg-amber-100 text-amber-700',
  InReview: 'bg-purple-100 text-purple-700',
  Exception: 'bg-red-100 text-red-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-rose-100 text-rose-800',
  Closed: 'bg-slate-200 text-slate-700',
  Reopened: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  Draft: 'Draft',
  IntakeValidated: 'Intake Validated',
  WaitingForEvidence: 'Waiting for Evidence',
  InReview: 'In Review',
  Exception: 'Exception',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Closed: 'Closed',
  Reopened: 'Reopened',
};

interface Props {
  status: CaseStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        STATUS_STYLES[status],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
