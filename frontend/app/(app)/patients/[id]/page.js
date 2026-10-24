'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@/components/Shell';
import DoctorActions from '@/components/DoctorActions';
import { useFetch } from '@/lib/useFetch';
import {
  PageHeader, Card, Table, Badge, Info, Status,
  fmtDate, fmtDateTime, statusTone, btnGhost,
} from '@/components/ui';

export default function PatientDetail() {
  const { id } = useParams();
  const user = useUser();
  const patient = useFetch(`/patients/${id}`);
  const labs = useFetch(`/lab-reports?patient_id=${id}`);
  const meds = useFetch(`/prescriptions?patient_id=${id}`);
  const p = patient.data;

  const refresh = () => {
    patient.reload();
    labs.reload();
    meds.reload();
  };

  return (
    <>
      <PageHeader
        title={p ? `${p.first_name} ${p.last_name}` : 'Patient'}
        subtitle={p ? `Patient ID ${p.patient_id}` : ''}
      >
        <Link href="/patients" className={btnGhost}>← Back to patients</Link>
      </PageHeader>

      <Status loading={patient.loading && !p} error={patient.error} />

      {p && (
        <Card title="Details" className="mb-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <Info label="Gender" value={p.gender} />
            <Info label="Date of birth" value={fmtDate(p.dob)} />
            <Info label="Blood group" value={p.blood_group} />
            <Info label="Phone" value={p.phone} />
            <Info label="Email" value={p.email} />
            <Info label="Address" value={p.address} />
            <Info label="Room" value={p.room ? `Room ${p.room.room_no} (${p.room.room_type})` : 'Not admitted'} />
            <Info label="Insurance" value={p.insurance.map((i) => `${i.provider_name} (${i.policy_number})`).join(', ')} />
            <Info
              label="Emergency contact"
              value={p.emergencyContacts.map((c) => `${c.contact_name} - ${c.phone}`).join(', ')}
            />
          </dl>
        </Card>
      )}

      {p && user.role === 'doctor' && (
        <DoctorActions patientId={id} room={p.room} onChange={refresh} />
      )}

      <div className="grid gap-6">
        <Card title="Lab reports">
          <Status error={labs.error} />
          <Table
            rows={labs.data}
            columns={[
              { key: 'test_name', label: 'Test' },
              { key: 'doctor_name', label: 'Prescribed by' },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={statusTone[r.status]}>{r.status}</Badge> },
              { key: 'result_value', label: 'Result' },
              { key: 'prescribed_on', label: 'Date', render: (r) => fmtDateTime(r.prescribed_on) },
            ]}
          />
        </Card>

        <Card title="Prescriptions">
          <Status error={meds.error} />
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
        </Card>
      </div>
    </>
  );
}