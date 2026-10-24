'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { Alert, Field, inputCls, btnPrimary } from '@/components/ui';

const DEMO = [
  { label: 'Doctor', email: 'anil.sharma@meditrack.com' },
  { label: 'Lab Technician', email: 'rohit.verma@meditrack.com' },
  { label: 'Admin', email: 'sunita.rao@meditrack.com' },
  { label: 'Patient', email: 'rahul.mehta@mail.com' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      saveSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-3xl font-bold text-teal-800">MediTrack</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-500">
          Patient, Lab and Pharmacy Management System
        </p>

        <Alert>{error}</Alert>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button className={`${btnPrimary} w-full`} disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          New patient?{' '}
          <Link href="/register" className="font-medium text-teal-700 underline">
            Create an account
          </Link>
        </p>

        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs uppercase text-slate-400">Demo accounts (password: meditrack123)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword('meditrack123');
                }}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}