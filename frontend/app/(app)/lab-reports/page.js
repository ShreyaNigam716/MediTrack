'use client';
import { useState } from 'react';
import { useUser } from '@/components/Shell';
import { useFetch } from '@/lib/useFetch';
import { api } from '@/lib/api';
import {
  PageHeader, Card, Table, Badge, Status, Alert,
  fmtDate, statusTone, inputCls, selectSm, btnPrimary, btnSmall, btnGhost,
} from '@/components/ui';

export default function LabReportsPage() {
  const user = useUser();
  const isTech = user.role === 'lab_technician';
  const canCancel = ['doctor', 'admin'].includes(user.role);

  const [status, setStatus] = useState(isTech ? 'pending' : '');
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (user.role === 'doctor') params.set('prescribed_by', user.id);
  const qs = params.toString();

  const { data, error, loading, reload } = useFetch(`/lab-reports${qs ? `?${qs}` : ''}`);

  const [active, setActive] = useState(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api(`/lab-reports/${active.lab_report_id}/result`, {
        method: 'PUT',
        body: { result_value: text },
      });
      setMsg({ type: 'success', text: 'Result uploaded' });
      setActive(null);
      setText('');
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    if (!confirm('Cancel this prescribed test?')) return;
    setMsg(null);
    try {
      await api(`/lab-reports/${id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Test cancelled' });
      reload();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  }

  const columns = [
    { key: 'lab_report_id', label: 'ID' },
    { key: 'patient_name', label: 'Patient' },
    { key: 'test_name', label: 'Test' },
    { key: 'doctor_name', label: 'Prescribed by' },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
    { key: 'result_value', label: 'Result' },
    { key: 'prescribed_on', label: 'Date', render: (r) => fmtDate(r.prescribed_on) },
  ];

  if (isTech || canCancel) {
    columns.push({
      key: 'actions',
      label: '',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex gap-2">
            {isTech && (
              <button className={btnSmall} onClick={() => { setActive(r); setText(''); setMsg(null); }}>
                Upload result
              </button>
            )}
            {canCancel && (
              <button className={btnGhost} onClick={() => cancel(r.lab_report_id)}>Cancel</button>
            )}
          </div>
        ) : null,
    });
  }

  return (
    <>
      <PageHeader
        title={isTech ? 'Lab queue' : 'Lab reports'}
        subtitle={isTech ? 'Upload results for prescribed tests' : 'Tests and their results'}
      >
        <select className={selectSm} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </PageHeader>

      {msg && <Alert type={msg.type}>{msg.text}</Alert>}

      {active && (
        <Card title={`Upload result: ${active.test_name} for ${active.patient_name}`} className="mb-4">
          <form onSubmit={upload} className="space-y-3">
            <textarea
              required
              rows={3}
              className={inputCls}
              placeholder="e.g. Hb 13.5 g/dL, WBC 7200, Platelets 250000"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={busy}>
                {busy ? 'Uploading…' : 'Submit result'}
              </button>
              <button type="button" className={btnGhost} onClick={() => setActive(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <Status loading={loading && !data} error={error} />
        <Table rows={data} columns={columns} empty="No lab reports found" />
      </Card>
    </>
  );
}