'use client';
import Link from 'next/link';
import { useUser } from '@/components/Shell';
import { useFetch } from '@/lib/useFetch';
import {
  PageHeader, Card, Stat, Table, Badge, Info, Status,
  fmtDate, money, btnPrimary, statusTone,
} from '@/components/ui';

export default function Dashboard() {
  const user = useUser();
  switch (user.role) {
    case 'patient': return <PatientHome user={user} />;
    case 'doctor': return <DoctorHome user={user} />;
    case 'lab_technician': return <LabHome />;
    default: return <AdminHome user={user} />;
  }
}

/* ---------------- Patient ---------------- */
function PatientHome({ user }) {
  const profile = useFetch('/me/profile');
  const labs = useFetch('/me/lab-reports');
  const meds = useFetch('/me/prescriptions');
  const bills = useFetch('/me/bills');
  const p = profile.data;

  const due = (bills.data || [])
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Your health records in one place">
        <Link href="/my-records" className={btnPrimary}>View my records</Link>
      </PageHeader>

      <Status loading={profile.loading} error={profile.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Lab reports" value={labs.data?.length ?? '…'} />
        <Stat label="Prescriptions" value={meds.data?.length ?? '…'} />
        <Stat label="Amount due" value={bills.data ? money(due) : '…'} />
      </div>

      {p && (
        <Card title="My profile">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <Info label="Email" value={p.email} />
            <Info label="Phone" value={p.phone} />
            <Info label="Blood group" value={p.blood_group} />
            <Info label="Date of birth" value={fmtDate(p.dob)} />
            <Info label="Address" value={p.address} />
            <Info
              label="Admitted in"
              value={p.room ? `Room ${p.room.room_no} (${p.room.room_type})` : 'Not admitted'}
            />
            <Info label="Insurance" value={p.insurance.map((i) => i.provider_name).join(', ')} />
            <Info
              label="Emergency contact"
              value={
                p.emergencyContacts[0]
                  ? `${p.emergencyContacts[0].contact_name} (${p.emergencyContacts[0].relation}) ${p.emergencyContacts[0].phone}`
                  : ''
              }
            />
          </dl>
        </Card>
      )}
    </>
  );
}

/* ---------------- Doctor ---------------- */
function DoctorHome({ user }) {
  const reports = useFetch(`/lab-reports?prescribed_by=${user.id}`);
  const presc = useFetch(`/prescriptions?prescribed_by=${user.id}`);
  const patients = useFetch('/patients');
  const r = reports.data || [];

  return (
    <>
      <PageHeader title={`Welcome, Dr. ${user.name}`} subtitle="Your patients and tests at a glance">
        <Link href="/patients" className={btnPrimary}>View patients</Link>
      </PageHeader>

      <Status loading={reports.loading} error={reports.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Patients in hospital" value={patients.data?.length ?? '…'} />
        <Stat label="Tests awaiting result" value={reports.data ? r.filter((x) => x.status === 'pending').length : '…'} />
        <Stat label="Prescriptions written" value={presc.data?.length ?? '…'} />
      </div>

      <Card title="Latest results for your patients">
        <Table
          rows={reports.data ? r.filter((x) => x.status === 'completed').slice(0, 5) : null}
          columns={[
            { key: 'patient_name', label: 'Patient' },
            { key: 'test_name', label: 'Test' },
            { key: 'result_value', label: 'Result' },
            { key: 'reported_on', label: 'Reported', render: (x) => fmtDate(x.reported_on) },
          ]}
          empty="No completed results yet"
        />
      </Card>
    </>
  );
}

/* ---------------- Lab technician ---------------- */
function LabHome() {
  const pending = useFetch('/lab-reports?status=pending');
  const done = useFetch('/lab-reports?status=completed');

  return (
    <>
      <PageHeader title="Lab dashboard" subtitle="Tests waiting for results">
        <Link href="/lab-reports" className={btnPrimary}>Open lab queue</Link>
      </PageHeader>

      <Status loading={pending.loading} error={pending.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Stat label="Pending tests" value={pending.data?.length ?? '…'} />
        <Stat label="Completed reports" value={done.data?.length ?? '…'} />
      </div>

      <Card title="Next in queue">
        <Table
          rows={pending.data ? pending.data.slice(0, 5) : null}
          columns={[
            { key: 'patient_name', label: 'Patient' },
            { key: 'test_name', label: 'Test' },
            { key: 'doctor_name', label: 'Prescribed by' },
            { key: 'prescribed_on', label: 'Date', render: (x) => fmtDate(x.prescribed_on) },
          ]}
          empty="Queue is empty"
        />
      </Card>
    </>
  );
}

/* ---------------- Admin / Staff ---------------- */
const LOW_STOCK = 250;

function AdminHome({ user }) {
  const patients = useFetch('/patients');
  const employees = useFetch('/employees');
  const rooms = useFetch('/rooms');
  const medicines = useFetch('/medicines');
  const bills = useFetch('/billing?status=pending');

  const occupied = (rooms.data || []).filter((r) => r.patient_id).length;
  const pendingTotal = (bills.data || []).reduce((s, b) => s + Number(b.amount), 0);
  const low = (medicines.data || []).filter((m) => Number(m.total_stock) < LOW_STOCK);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Hospital overview" />

      <Status loading={patients.loading} error={patients.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Patients" value={patients.data?.length ?? '…'} />
        <Stat label="Employees" value={employees.data?.length ?? '…'} />
        <Stat label="Rooms occupied" value={rooms.data ? `${occupied} / ${rooms.data.length}` : '…'} />
        <Stat label="Pending bills" value={bills.data ? money(pendingTotal) : '…'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Pending bills">
          <Table
            rows={bills.data ? bills.data.slice(0, 5) : null}
            columns={[
              { key: 'patient_name', label: 'Patient' },
              { key: 'description', label: 'Description' },
              { key: 'amount', label: 'Amount', render: (b) => money(b.amount) },
            ]}
            empty="No pending bills"
          />
        </Card>

        <Card title={`Low stock (under ${LOW_STOCK} units)`}>
          <Table
            rows={medicines.data ? low : null}
            columns={[
              { key: 'medicine_name', label: 'Medicine' },
              { key: 'total_stock', label: 'In stock', render: (m) => <Badge tone="red">{m.total_stock}</Badge> },
            ]}
            empty="All medicines well stocked"
          />
        </Card>
      </div>
    </>
  );
}