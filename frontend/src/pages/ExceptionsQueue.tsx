import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCases, updateCaseStatus } from '../lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExceptionsQueue() {
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases', { status: 'Exception' }],
    queryFn: () => getCases({ status: 'Exception' }),
  });

  const statusMutation = useMutation({
    mutationFn: (id: string) => updateCaseStatus(id, 'InReview'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle size={22} className="text-red-500" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Exceptions Queue</h2>
          <p className="text-sm text-slate-500">
            {cases.length} case{cases.length !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-indigo-500" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <AlertTriangle size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No exception cases at the moment</p>
          <p className="text-sm text-slate-400 mt-1">All claims are progressing normally.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-red-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <th className="px-6 py-3">Case</th>
                <th className="px-4 py-3">Claimant</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Time in Exception</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/cases/${c.id}`}
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      {c.case_number}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{c.title}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-700">{c.claimant_name}</p>
                    <p className="text-xs text-slate-400">{c.claimant_email}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {c.assigned_to ?? <span className="text-slate-400">Unassigned</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-red-600 font-medium text-xs">
                      {formatDistanceToNow(new Date(c.updated_at), { addSuffix: false })}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-xs">
                    {format(new Date(c.updated_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => statusMutation.mutate(c.id)}
                      disabled={statusMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                    >
                      {statusMutation.isPending && <Loader2 size={11} className="animate-spin" />}
                      Move to InReview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
