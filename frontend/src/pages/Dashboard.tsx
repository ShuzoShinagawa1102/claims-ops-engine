import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { getCases, seedData } from '../lib/api';
import type { CaseStatus, ProductType, Priority, CaseFilters } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ProductIcon from '../components/ProductIcon';
import { format } from 'date-fns';

const STATUSES: CaseStatus[] = [
  'Draft', 'IntakeValidated', 'WaitingForEvidence', 'InReview',
  'Exception', 'Approved', 'Rejected', 'Closed', 'Reopened',
];
const PRODUCTS: ProductType[] = ['auto', 'health', 'travel', 'property'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CaseFilters>({});

  const { data: cases = [], isLoading, isError } = useQuery({
    queryKey: ['cases', filters],
    queryFn: () => getCases(filters),
  });

  const seedMutation = useMutation({
    mutationFn: seedData,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cases'] }),
  });

  const totalCases = cases.length;
  const pendingReview = cases.filter((c) => c.status === 'InReview').length;
  const exceptions = cases.filter((c) => c.status === 'Exception').length;
  const awaitingEvidence = cases.filter((c) => c.status === 'WaitingForEvidence').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Claims Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage and track all insurance claims</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {seedMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Seed Data
          </button>
          <Link
            to="/cases/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            New Case
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cases', value: totalCases, color: 'text-slate-700' },
          { label: 'In Review', value: pendingReview, color: 'text-purple-600' },
          { label: 'Exceptions', value: exceptions, color: 'text-red-600' },
          { label: 'Awaiting Evidence', value: awaitingEvidence, color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <select
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: (e.target.value as CaseStatus) || undefined }))
          }
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.product_type ?? ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              product_type: (e.target.value as ProductType) || undefined,
            }))
          }
        >
          <option value="">All Products</option>
          {PRODUCTS.map((p) => (
            <option key={p} value={p} className="capitalize">{p}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.priority ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, priority: (e.target.value as Priority) || undefined }))
          }
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p} className="capitalize">{p}</option>
          ))}
        </select>
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({})}
            className="text-sm text-indigo-600 hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-red-500 text-sm">
            Failed to load cases. Is the backend running?
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No cases found. Click "Seed Data" to populate sample data.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-6 py-3">Case</th>
                <th className="px-4 py-3">Claimant</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/cases/${c.id}`)}
                >
                  <td className="px-6 py-3.5">
                    <Link
                      to={`/cases/${c.id}`}
                      className="font-semibold text-indigo-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.case_number}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{c.title}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    <p className="font-medium">{c.claimant_name}</p>
                    <p className="text-xs text-slate-400">{c.claimant_email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 capitalize text-slate-600">
                      <ProductIcon type={c.product_type} size={15} />
                      {c.product_type}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={c.priority} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {c.assigned_to ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">
                    {format(new Date(c.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
