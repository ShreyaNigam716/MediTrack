'use client';
import { useState } from 'react';
import { useUser } from '@/components/Shell';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/api';
import {
  PageHeader, Card, Table, Badge, Status, Alert, Field,
  money, inputCls, btnPrimary,
} from '@/components/ui';

const LOW_STOCK = 250;

export default function MedicinesPage() {
  const user = useUser();
  const { data, error, loading, reload } = useFetch('/medicines');
  const canEdit = ['admin', 'staff'].includes(user.role);

  const [form, setForm] = useState({ medicine_sku: '', batch_no: '', quantity: '', expiry_date: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function addStock(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/inventory', {
        method: 'POST',
        body: { ...form, quantity: Number(form.quantity) },
      });
      setMsg({ type: 'success', text: 'Stock batch added' });
      setForm({ medicine_sku: '', batch_no: '', quantity: '', expiry_date: '' });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Medicines & stock" subtitle="Current pharmacy inventory" />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {canEdit && (
        <Card title="Add stock batch" className="mb-6">
          <form onSubmit={addStock} className="grid gap-4 sm:grid-cols-5">
            <Field label="Medicine">
              <select required className={inputCls} value={form.medicine_sku} onChange={set('medicine_sku')}>
                <option value="">Select</option>
                {(data || []).map((m) => (
                  <option key={m.medicine_sku} value={m.medicine_sku}>{m.medicine_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Batch no.">
              <input required className={inputCls} value={form.batch_no} onChange={set('batch_no')} />
            </Field>
            <Field label="Quantity">
              <input required type="number" min="1" className={inputCls} value={form.quantity} onChange={set('quantity')} />
            </Field>
            <Field label="Expiry date">
              <input required type="date" className={inputCls} value={form.expiry_date} onChange={set('expiry_date')} />
            </Field>
            <div className="flex items-end">
              <button className={`${btnPrimary} w-full`} disabled={busy}>Add batch</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Status loading={loading && !data} error={error} />
        <Table
          rows={data}
          columns={[
            { key: 'medicine_sku', label: 'SKU' },
            { key: 'medicine_name', label: 'Medicine' },
            { key: 'manufacturer', label: 'Manufacturer' },
            { key: 'unit_price', label: 'Unit price', render: (m) => money(m.unit_price) },
            {
              key: 'total_stock',
              label: 'In stock',
              render: (m) => (
                <Badge tone={Number(m.total_stock) < LOW_STOCK ? 'red' : 'green'}>{m.total_stock}</Badge>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}