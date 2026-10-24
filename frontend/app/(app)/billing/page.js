'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/api';
import {
  PageHeader, Card, Table, Badge, Status, Alert, Field,
  fmtDate, money, statusTone, inputCls, selectSm, btnPrimary, btnSmall,
} from '@/components/ui';

export default function BillingPage() {
  const [status, setStatus] = useState('');
  const bills = useFetch(`/billing${status ? `?status=${status}` : ''}`);
  const patients = useFetch('/patients');

  const [form, setForm] = useState({ patient_id: '', description: '', amount: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/billing', {
        method: 'POST',
        body: {
          patient_id: Number(form.patient_id),
          description: form.description,
          amount: Number(form.amount),
        },
      });
      setMsg({ type: 'success', text: 'Bill created' });
      setForm({ patient_id: '', description: '', amount: '' });
      bills.reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(no) {
    setMsg(null);
    try {
      await api(`/billing/${no}/pay`, { method: 'PUT' });
      setMsg({ type: 'success', text: `Bill #${no} marked as paid` });
      bills.reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  return (
    <>
      <PageHeader title="Billing" subtitle="Create bills and record payments">
        <select className={selectSm} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All bills</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </PageHeader>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <Card title="New bill" className="mb-6">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-4">
          <Field label="Patient">
            <select required className={inputCls} value={form.patient_id} onChange={set('patient_id')}>
              <option value="">Select</option>
              {(patients.data || []).map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description">
            <input className={inputCls} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Amount (₹)">
            <input required type="number" min="0" step="0.01" className={inputCls} value={form.amount} onChange={set('amount')} />
          </Field>
          <div className="flex items-end">
            <button className={`${btnPrimary} w-full`} disabled={busy}>Create bill</button>
          </div>
        </form>
      </Card>

      <Card>
        <Status loading={bills.loading && !bills.data} error={bills.error} />
        <Table
          rows={bills.data}
          columns={[
            { key: 'bill_no', label: 'Bill #' },
            { key: 'patient_name', label: 'Patient' },
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount', render: (b) => money(b.amount) },
            { key: 'bill_date', label: 'Date', render: (b) => fmtDate(b.bill_date) },
            { key: 'status', label: 'Status', render: (b) => <Badge tone={statusTone[b.status]}>{b.status}</Badge> },
            {
              key: 'actions',
              label: '',
              render: (b) =>
                b.status === 'pending' ? (
                  <button className={btnSmall} onClick={() => markPaid(b.bill_no)}>Mark paid</button>
                ) : null,
            },
          ]}
        />
      </Card>
    </>
  );
}