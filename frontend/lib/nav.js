export const ROLE_LABEL = {
  doctor: 'Doctor',
  lab_technician: 'Lab Technician',
  patient: 'Patient',
  admin: 'Admin',
  staff: 'Staff',
};

const home = { href: '/dashboard', label: 'Overview' };
const patients = { href: '/patients', label: 'Patients' };
const labs = { href: '/lab-reports', label: 'Lab Reports' };
const rooms = { href: '/rooms', label: 'Rooms' };
const medicines = { href: '/medicines', label: 'Medicines' };
const sales = { href: '/sales', label: 'Pharmacy Sales' };
const billing = { href: '/billing', label: 'Billing' };
const reports = { href: '/reports', label: 'Reports' };

export const NAV = {
  doctor: [home, patients, labs, rooms],
  lab_technician: [home, { href: '/lab-reports', label: 'Lab Queue' }],
  patient: [home, { href: '/my-records', label: 'My Records' }],
  admin: [home, patients, { href: '/employees', label: 'Employees' }, labs, rooms, medicines, sales, billing, reports],
  staff: [home, patients, rooms, medicines, sales, billing],
};