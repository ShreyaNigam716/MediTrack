'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/api';
import {
  PageHeader, Card, Table, Badge, Status, Alert,
  fmtDate, selectSm, btnSmall, btnGhost, money,
} from '@/components/ui';

export default function RoomsPage() {
  const rooms = useFetch('/rooms');
  const patients = useFetch('/patients');
  const [pick, setPick] = useState({});
  const [msg, setMsg] = useState(null);

  // patients who are not already in a room
  const occupiedIds = new Set((rooms.data || []).filter((r) => r.patient_id).map((r) => r.patient_id));
  const free = (patients.data || []).filter((p) => !occupiedIds.has(p.patient_id));

  async function act(fn, okText) {
    setMsg(null);
    try {
      await fn();
      setMsg({ type: 'success', text: okText });
      rooms.reload();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  }

  const columns = [
    { key: 'room_no', label: 'Room' },
    { key: 'room_type', label: 'Type' },
    { key: 'daily_charge', label: 'Per day', render: (r) => money(r.daily_charge) },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (r.patient_id ? <Badge tone="red">Occupied</Badge> : <Badge tone="green">Available</Badge>),
    },
    { key: 'patient_name', label: 'Patient' },
    { key: 'admitted_on', label: 'Admitted', render: (r) => fmtDate(r.admitted_on) },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.patient_id ? (
          <button
            className={btnGhost}
            onClick={() => act(() => api(`/rooms/${r.room_no}/discharge`, { method: 'PUT' }), 'Patient discharged')}
          >
            Discharge
          </button>
        ) : (
          <div className="flex gap-2">
            <select
              className={selectSm}
              value={pick[r.room_no] || ''}
              onChange={(e) => setPick({ ...pick, [r.room_no]: e.target.value })}
            >
              <option value="">Select patient</option>
              {free.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
            <button
              className={btnSmall}
              disabled={!pick[r.room_no]}
              onClick={() =>
                act(
                  () =>
                    api(`/rooms/${r.room_no}/assign`, {
                      method: 'PUT',
                      body: { patient_id: Number(pick[r.room_no]) },
                    }),
                  'Room assigned'
                )
              }
            >
              Assign
            </button>
          </div>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Rooms" subtitle="Assign rooms to patients and discharge them" />
      {msg && <Alert type={msg.type}>{msg.text}</Alert>}
      <Card>
        <Status loading={rooms.loading && !rooms.data} error={rooms.error} />
        <Table rows={rooms.data} columns={columns} />
      </Card>
    </>
  );
}