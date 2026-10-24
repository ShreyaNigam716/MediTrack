'use client';
import { useState } from 'react';
import { useFetch } from '@/lib/useFetch';
import { PageHeader, Card, Table, Badge, Status, fmtDate, selectSm } from '@/components/ui';

export default function EmployeesPage() {
  const [role, setRole] = useState('');
  const { data, error, loading } = useFetch(`/employees${role ? `?role=${role}` : ''}`);

  return (
    <>
      <PageHeader title="Employees" subtitle="Doctors, lab technicians and staff">
        <select className={selectSm} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="doctor">Doctors</option>
          <option value="lab_technician">Lab technicians</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
        </select>
      </PageHeader>

      <Card>
        <Status loading={loading && !data} error={error} />
        <Table
          rows={data}
          columns={[
            { key: 'employee_id', label: 'ID' },
            { key: 'name', label: 'Name', render: (e) => `${e.first_name} ${e.last_name}` },
            { key: 'role', label: 'Role', render: (e) => <Badge tone="blue">{e.role.replace('_', ' ')}</Badge> },
            { key: 'department_name', label: 'Department' },
            { key: 'specialities', label: 'Speciality' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'hire_date', label: 'Hired', render: (e) => fmtDate(e.hire_date) },
          ]}
        />
      </Card>
    </>
  );
}