'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import {
  PageHeader, Card, Table, Badge, Status,
  fmtDate, money, statusTone,
} from '@/components/ui';

const TABS = [
  { id: 'labs', label: 'Lab reports' },
  { id: 'meds', label: 'Prescriptions' },
  { id: 'bills', label: 'Bills' },
];

export default function MyRecords() {
  const [tab, setTab] = useState('labs');
  const labs = useFetch('/me/lab-reports');
  const meds = useFetch('/me/prescriptions');
  const bills = useFetch('/me/bills');

  return (
    <>
      <PageHeader title="My records" subtitle="Everything linked to your account" />

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? 'bg-teal-700 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {tab === 'labs' && (
          <>
            <Status loading={labs.loading} error={labs.error} />
            <Table
              rows={labs.data}
              columns={[
                { key: 'test_name', label: 'Test' },
                { key: 'doctor_name', label: 'Doctor' },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
                { key: 'result_value', label: 'Result', render: (r) => r.result_value || 'Awaiting result' },
                { key: 'prescribed_on', label: 'Prescribed', render: (r) => fmtDate(r.prescribed_on) },
                { key: 'reported_on', label: 'Reported', render: (r) => fmtDate(r.reported_on) },
              ]}
            />
          </>
        )}

        {tab === 'meds' && (
          <>
            <Status loading={meds.loading} error={meds.error} />
            <Table
              rows={meds.data}
              columns={[
                { key: 'medicine_name', label: 'Medicine' },
                { key: 'dosage', label: 'Dosage' },
                { key: 'duration_days', label: 'Days' },
                { key: 'doctor_name', label: 'Doctor' },
                { key: 'prescribed_on', label: 'Date', render: (r) => fmtDate(r.prescribed_on) },
              ]}
            />
          </>
        )}

        {tab === 'bills' && (
          <>
            <Status loading={bills.loading} error={bills.error} />
            <Table
              rows={bills.data}
              columns={[
                { key: 'bill_no', label: 'Bill #' },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount', render: (b) => money(b.amount) },
                { key: 'bill_date', label: 'Date', render: (b) => fmtDate(b.bill_date) },
                { key: 'status', label: 'Status', render: (b) => <Badge tone={statusTone[b.status]}>{b.status}</Badge> },
              ]}
            />
          </>
        )}
      </Card>
    </>
  );
}