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
const billing = { href: '/billing', label: 'Billing' };

export const NAV = {
  doctor: [home, patients, labs, rooms],
  lab_technician: [home, { href: '/lab-reports', label: 'Lab Queue' }],
  patient: [home, { href: '/my-records', label: 'My Records' }],
  admin: [home, patients, { href: '/employees', label: 'Employees' }, labs, rooms, medicines, billing],
  staff: [home, patients, rooms, medicines, billing],
};