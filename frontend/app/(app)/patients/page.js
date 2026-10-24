'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/Shell';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/api';
import {
  PageHeader, Card, Table, Status, Alert, Field,
  fmtDate, inputCls, btnPrimary, btnGhost,
} from '@/components/ui';

function AddPatientForm({ onDone }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', dob: '', gender: 'male',
    phone: '', email: '', address: '', blood_group: '', password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await api('/patients', { method: 'POST', body });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Register a patient" className="mb-6">
      <Alert>{error}</Alert>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label="First name">
          <input required className={inputCls} value={form.first_name} onChange={set('first_name')} />
        </Field>
        <Field label="Last name">
          <input required className={inputCls} value={form.last_name} onChange={set('last_name')} />
        </Field>
        <Field label="Date of birth">
          <input type="date" required className={inputCls} value={form.dob} onChange={set('dob')} />
        </Field>
        <Field label="Gender">
          <select className={inputCls} value={form.gender} onChange={set('gender')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Email (needed for login)">
          <input type="email" className={inputCls} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Blood group">
          <select className={inputCls} value={form.blood_group} onChange={set('blood_group')}>
            <option value="">Select</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field label="Address">
          <input className={inputCls} value={form.address} onChange={set('address')} />
        </Field>
        <Field label="Login password (optional)">
          <input type="password" className={inputCls} value={form.password} onChange={set('password')} />
        </Field>
        <div className="sm:col-span-3">
          <button className={btnPrimary} disabled={busy}>{busy ? 'Saving…' : 'Save patient'}</button>
        </div>
      </form>
    </Card>
  );
}

export default function PatientsPage() {
  const user = useUser();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);

  // wait 300ms after typing stops before searching
  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, loading, reload } = useFetch(
    `/patients${q ? `?search=${encodeURIComponent(q)}` : ''}`
  );
  const canAdd = ['admin', 'staff'].includes(user.role);

  return (
    <>
      <PageHeader title="Patients" subtitle="Search, open and manage patient records">
        {canAdd && (
          <button className={btnGhost} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close form' : '+ Add patient'}
          </button>
        )}
      </PageHeader>

      {showForm && (
        <AddPatientForm
          onDone={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}

      <Card>
        <input
          className={`${inputCls} mb-4 max-w-sm`}
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Status loading={loading && !data} error={error} />
        <Table
          rows={data}
          columns={[
            { key: 'patient_id', label: 'ID' },
            {
              key: 'name',
              label: 'Name',
              render: (p) => (
                <Link href={`/patients/${p.patient_id}`} className="font-medium text-teal-700 underline">
                  {p.first_name} {p.last_name}
                </Link>
              ),
            },
            { key: 'gender', label: 'Gender' },
            { key: 'dob', label: 'DOB', render: (p) => fmtDate(p.dob) },
            { key: 'phone', label: 'Phone' },
            { key: 'blood_group', label: 'Blood' },
          ]}
        />
      </Card>
    </>
  );
}