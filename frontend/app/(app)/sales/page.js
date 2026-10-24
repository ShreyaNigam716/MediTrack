'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/api';
import {
  PageHeader, Card, Table, Status, Alert, Field,
  fmtDateTime, money, inputCls, btnPrimary,
} from '@/components/ui';

export default function SalesPage() {
  const sales = useFetch('/sales');
  const patients = useFetch('/patients');
  const meds = useFetch('/medicines');

  const [form, setForm] = useState({ patient_id: '', medicine_sku: '', quantity: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const chosen = (meds.data || []).find((m) => m.medicine_sku === form.medicine_sku);
  const preview = chosen && form.quantity ? Number(chosen.unit_price) * Number(form.quantity) : 0;

  async function sell(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await api('/sales', {
        method: 'POST',
        body: {
          patient_id: Number(form.patient_id),
          medicine_sku: form.medicine_sku,
          quantity: Number(form.quantity),
        },
      });
      setMsg({ type: 'success', text: `Sale completed. Bill #${r.bill_no} created for ${money(r.total_amount)}` });
      setForm({ patient_id: '', medicine_sku: '', quantity: '' });
      sales.reload();
      meds.reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Pharmacy sales" subtitle="Sell medicines. Stock is reduced and a bill is created automatically." />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      <Card title="New sale" className="mb-6">
        <form onSubmit={sell} className="grid gap-4 sm:grid-cols-4">
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
          <Field label="Medicine">
            <select required className={inputCls} value={form.medicine_sku} onChange={set('medicine_sku')}>
              <option value="">Select</option>
              {(meds.data || []).map((m) => (
                <option key={m.medicine_sku} value={m.medicine_sku}>
                  {m.medicine_name} ({m.total_stock} in stock)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input required type="number" min="1" className={inputCls} value={form.quantity} onChange={set('quantity')} />
          </Field>
          <div className="flex flex-col justify-end gap-1">
            {preview > 0 && <p className="text-sm text-slate-500">Total: {money(preview)}</p>}
            <button className={btnPrimary} disabled={busy}>{busy ? 'Processing…' : 'Complete sale'}</button>
          </div>
        </form>
      </Card>

      <Card title="Sales history">
        <Status loading={sales.loading && !sales.data} error={sales.error} />
        <Table
          rows={sales.data}
          columns={[
            { key: 'sales_trac_no', label: 'Sale #' },
            { key: 'patient_name', label: 'Patient' },
            { key: 'medicine_name', label: 'Medicine' },
            { key: 'inv_line_id', label: 'Batch line' },
            { key: 'quantity', label: 'Qty' },
            { key: 'total_amount', label: 'Amount', render: (s) => money(s.total_amount) },
            { key: 'sale_date', label: 'Date', render: (s) => fmtDateTime(s.sale_date) },
          ]}
        />
      </Card>
    </>
  );
}