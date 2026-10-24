'use client';
import { useFetch } from '@/lib/useFetch';
import { PageHeader, Card, Stat, Table, Badge, Status, fmtDate, money } from '@/components/ui';

export default function ReportsPage() {
  const revenue = useFetch('/reports/revenue');
  const byMed = useFetch('/reports/sales-by-medicine');
  const monthly = useFetch('/reports/monthly-sales');
  const doctors = useFetch('/reports/doctor-workload');
  const expiring = useFetch('/reports/expiring?days=365');
  const summary = useFetch('/reports/patient-summary');

  const get = (s) => (revenue.data || []).find((r) => r.status === s);

  return (
    <>
      <PageHeader title="Reports" subtitle="Built from SQL joins, aggregates, subqueries and views" />
      <Status loading={revenue.loading} error={revenue.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Stat label="Revenue collected" value={revenue.data ? money(get('paid')?.total) : '…'} />
        <Stat label="Revenue pending" value={revenue.data ? money(get('pending')?.total) : '…'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sales by medicine">
          <Table
            rows={byMed.data}
            columns={[
              { key: 'medicine_name', label: 'Medicine' },
              { key: 'units_sold', label: 'Units sold' },
              { key: 'revenue', label: 'Revenue', render: (r) => money(r.revenue) },
            ]}
          />
        </Card>

        <Card title="Monthly pharmacy sales">
          <Table
            rows={monthly.data}
            columns={[
              { key: 'month', label: 'Month' },
              { key: 'transactions', label: 'Transactions' },
              { key: 'revenue', label: 'Revenue', render: (r) => money(r.revenue) },
            ]}
          />
        </Card>

        <Card title="Doctor workload">
          <Table
            rows={doctors.data}
            columns={[
              { key: 'doctor_name', label: 'Doctor' },
              { key: 'department_name', label: 'Department' },
              { key: 'patients_treated', label: 'Patients' },
              { key: 'tests_prescribed', label: 'Tests' },
              { key: 'medicines_prescribed', label: 'Medicines' },
            ]}
          />
        </Card>

        <Card title="Batches expiring within a year">
          <Table
            rows={expiring.data}
            columns={[
              { key: 'medicine_name', label: 'Medicine' },
              { key: 'batch_no', label: 'Batch' },
              { key: 'quantity', label: 'Qty' },
              { key: 'expiry_date', label: 'Expires', render: (r) => fmtDate(r.expiry_date) },
              { key: 'days_left', label: 'Days left', render: (r) => <Badge tone={r.days_left < 90 ? 'red' : 'yellow'}>{r.days_left}</Badge> },
            ]}
            empty="Nothing expiring soon"
          />
        </Card>
      </div>

      <Card title="Patient summary (from the patient_summary view)" className="mt-6">
        <Table
          rows={summary.data}
          columns={[
            { key: 'patient_name', label: 'Patient' },
            { key: 'room_no', label: 'Room', render: (r) => r.room_no || '—' },
            { key: 'total_tests', label: 'Tests' },
            { key: 'pending_tests', label: 'Pending tests' },
            { key: 'total_prescriptions', label: 'Prescriptions' },
            { key: 'amount_due', label: 'Amount due', render: (r) => money(r.amount_due) },
          ]}
        />
      </Card>
    </>
  );
}