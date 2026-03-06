import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createCase } from '../lib/api';
import type { ProductType, Channel, Priority } from '../types';
import { Loader2, ArrowLeft } from 'lucide-react';

const FIELD_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-1';

export default function CreateCase() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    claimant_name: '',
    claimant_email: '',
    incident_date: '',
    product_type: 'auto' as ProductType,
    channel: 'web' as Channel,
    description: '',
    estimated_amount: '',
    assigned_to: '',
    priority: 'medium' as Priority,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createCase({
        title: form.title,
        claimant_name: form.claimant_name,
        claimant_email: form.claimant_email,
        incident_date: form.incident_date,
        product_type: form.product_type,
        channel: form.channel,
        description: form.description || undefined,
        estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : undefined,
        assigned_to: form.assigned_to || undefined,
        priority: form.priority,
      }),
    onSuccess: (data) => navigate(`/cases/${data.id}`),
    onError: () => setError('Failed to create case. Please check all required fields.'),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">New Claim Case</h2>
        <p className="text-sm text-slate-500 mb-6">
          Fill out the form below. Requirements will be auto-generated based on the product type.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={LABEL_CLASS}>Case Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Brief title describing the claim"
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Claimant Name *</label>
              <input
                type="text"
                required
                value={form.claimant_name}
                onChange={(e) => set('claimant_name', e.target.value)}
                placeholder="Full name"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Claimant Email *</label>
              <input
                type="email"
                required
                value={form.claimant_email}
                onChange={(e) => set('claimant_email', e.target.value)}
                placeholder="email@example.com"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Incident Date *</label>
              <input
                type="date"
                required
                value={form.incident_date}
                onChange={(e) => set('incident_date', e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Product Type *</label>
              <select
                required
                value={form.product_type}
                onChange={(e) => set('product_type', e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="auto">Auto</option>
                <option value="health">Health</option>
                <option value="travel">Travel</option>
                <option value="property">Property</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Channel</label>
              <select
                value={form.channel}
                onChange={(e) => set('channel', e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="web">Web</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="portal">Portal</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Estimated Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.estimated_amount}
                onChange={(e) => set('estimated_amount', e.target.value)}
                placeholder="0.00"
                className={FIELD_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Assigned To</label>
              <input
                type="text"
                value={form.assigned_to}
                onChange={(e) => set('assigned_to', e.target.value)}
                placeholder="Adjuster name"
                className={FIELD_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the incident and nature of the claim..."
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
              Create Case
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
