'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useFetch } from '@/lib/useFetch';
import { Card, Alert, Field, inputCls, btnPrimary, btnGhost } from './ui';

// Runs an API action and tracks the success/error message
function useRunner(onChange) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(fn, okText) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: 'success', text: okText });
      onChange();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy(false);
    }
  }
  return { msg, busy, run };
}

function TestForm({ patientId, onChange }) {
  const tests = useFetch('/tests');
  const [code, setCode] = useState('');
  const { msg, busy, run } = useRunner(onChange);

  return (
    <Card title="Prescribe a lab test">
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => api('/lab-reports', { method: 'POST', body: { test_code: code, patient_id: Number(patientId) } }),
            'Test prescribed'
          ).then(() => setCode(''));
        }}
      >
        <Field label="Test">
          <select required className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">Select a test</option>
            {(tests.data || []).map((t) => (
              <option key={t.test_code} value={t.test_code}>{t.test_name}</option>
            ))}
          </select>
        </Field>
        <button className={btnPrimary} disabled={busy}>Prescribe test</button>
      </form>
    </Card>
  );
}

function MedForm({ patientId, onChange }) {
  const meds = useFetch('/medicines');
  const [form, setForm] = useState({ medicine_sku: '', dosage: '', duration_days: '' });
  const { msg, busy, run } = useRunner(onChange);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Card title="Prescribe a medicine">
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () =>
              api('/prescriptions', {
                method: 'POST',
                body: {
                  patient_id: Number(patientId),
                  medicine_sku: form.medicine_sku,
                  dosage: form.dosage,
                  duration_days: Number(form.duration_days),
                },
              }),
            'Medicine prescribed'
          ).then(() => setForm({ medicine_sku: '', dosage: '', duration_days: '' }));
        }}
      >
        <Field label="Medicine">
          <select required className={inputCls} value={form.medicine_sku} onChange={set('medicine_sku')}>
            <option value="">Select a medicine</option>
            {(meds.data || []).map((m) => (
              <option key={m.medicine_sku} value={m.medicine_sku}>{m.medicine_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Dosage">
          <input required className={inputCls} placeholder="1 tablet twice a day" value={form.dosage} onChange={set('dosage')} />
        </Field>
        <Field label="Duration (days)">
          <input required type="number" min="1" className={inputCls} value={form.duration_days} onChange={set('duration_days')} />
        </Field>
        <button className={btnPrimary} disabled={busy}>Prescribe medicine</button>
      </form>
    </Card>
  );
}

function RoomForm({ patientId, room, onChange }) {
  const rooms = useFetch('/rooms?status=available');
  const [roomNo, setRoomNo] = useState('');
  const { msg, busy, run } = useRunner(() => {
    onChange();
    rooms.reload();
  });

  return (
    <Card title="Room">
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      {room ? (
        <div className="space-y-3 text-sm">
          <p>
            Currently in <strong>Room {room.room_no}</strong> ({room.room_type}).
          </p>
          <button
            className={btnGhost}
            disabled={busy}
            onClick={() => run(() => api(`/rooms/${room.room_no}/discharge`, { method: 'PUT' }), 'Patient discharged')}
          >
            Discharge patient
          </button>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => api(`/rooms/${roomNo}/assign`, { method: 'PUT', body: { patient_id: Number(patientId) } }),
              'Room assigned'
            ).then(() => setRoomNo(''));
          }}
        >
          <Field label="Available rooms">
            <select required className={inputCls} value={roomNo} onChange={(e) => setRoomNo(e.target.value)}>
              <option value="">Select a room</option>
              {(rooms.data || []).map((r) => (
                <option key={r.room_no} value={r.room_no}>
                  {r.room_no} ({r.room_type})
                </option>
              ))}
            </select>
          </Field>
          <button className={btnPrimary} disabled={busy}>Assign room</button>
        </form>
      )}
    </Card>
  );
}

export default function DoctorActions({ patientId, room, onChange }) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <TestForm patientId={patientId} onChange={onChange} />
      <MedForm patientId={patientId} onChange={onChange} />
      <RoomForm patientId={patientId} room={room} onChange={onChange} />
    </div>
  );
}