'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Alert, Field, inputCls, btnPrimary } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '', last_name: '', dob: '', gender: 'male',
    email: '', password: '', phone: '', blood_group: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // send only the fields that were filled in
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await api('/auth/register', { method: 'POST', body });
      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-teal-800">Patient registration</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Create an account to view your records.</p>

        <Alert>{error}</Alert>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Email">
            <input type="email" required className={inputCls} value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password (min 6)">
            <input type="password" required minLength={6} className={inputCls} value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Blood group">
            <select className={inputCls} value={form.blood_group} onChange={set('blood_group')}>
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button className={`${btnPrimary} w-full`} disabled={busy}>
              {busy ? 'Creating…' : 'Register'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-teal-700 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}