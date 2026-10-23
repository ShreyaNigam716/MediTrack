DROP DATABASE IF EXISTS meditrack;
CREATE DATABASE meditrack;
USE meditrack;

-- 1. department
CREATE TABLE department (
  department_code VARCHAR(10) PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. speciality
CREATE TABLE speciality (
  speciality_code VARCHAR(10) PRIMARY KEY,
  speciality_name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. employee_master
CREATE TABLE employee_master (
  employee_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15),
  role ENUM('doctor','lab_technician','staff','admin') NOT NULL,
  hire_date DATE NOT NULL,
  department_code VARCHAR(10) NOT NULL,
  password_hash VARCHAR(255),
  FOREIGN KEY (department_code) REFERENCES department(department_code)
);

-- 4. employee_specialty (bridge table for M:N)
CREATE TABLE employee_specialty (
  mapping_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  speciality_code VARCHAR(10) NOT NULL,
  UNIQUE (employee_id, speciality_code),
  FOREIGN KEY (employee_id) REFERENCES employee_master(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (speciality_code) REFERENCES speciality(speciality_code)
);

-- 5. employees_paycheck
CREATE TABLE employees_paycheck (
  paycheck_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  pay_date DATE NOT NULL,
  basic_salary DECIMAL(10,2) NOT NULL CHECK (basic_salary >= 0),
  bonus DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (employee_id) REFERENCES employee_master(employee_id)
);

-- 6. patient_master
CREATE TABLE patient_master (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(100) UNIQUE,
  address VARCHAR(255),
  blood_group VARCHAR(5),
  registered_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  password_hash VARCHAR(255)
);

-- 7. patient_insurance
CREATE TABLE patient_insurance (
  insurance_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  policy_number VARCHAR(50) NOT NULL,
  coverage_amount DECIMAL(12,2),
  valid_till DATE,
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id) ON DELETE CASCADE
);

-- 8. patient_emergency_contact
CREATE TABLE patient_emergency_contact (
  ec_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  relation VARCHAR(50),
  phone VARCHAR(15) NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id) ON DELETE CASCADE
);

-- 9. room (patient_id is NULL when the room is empty)
CREATE TABLE room (
  room_no VARCHAR(10) PRIMARY KEY,
  room_type ENUM('general','private','icu') NOT NULL,
  daily_charge DECIMAL(10,2) NOT NULL,
  patient_id INT NULL,
  admitted_on DATETIME NULL,
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id) ON DELETE SET NULL
);

-- 10. billing
CREATE TABLE billing (
  bill_no INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  description VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status ENUM('pending','paid') DEFAULT 'pending',
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id)
);

-- 11. test
CREATE TABLE test (
  test_code VARCHAR(10) PRIMARY KEY,
  test_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- 12. lab_report_results
CREATE TABLE lab_report_results (
  lab_report_id INT AUTO_INCREMENT PRIMARY KEY,
  test_code VARCHAR(10) NOT NULL,
  patient_id INT NOT NULL,
  prescribed_by INT NOT NULL,
  generated_by INT NULL,
  status ENUM('pending','completed') DEFAULT 'pending',
  result_value TEXT NULL,
  prescribed_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  reported_on DATETIME NULL,
  FOREIGN KEY (test_code) REFERENCES test(test_code),
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id),
  FOREIGN KEY (prescribed_by) REFERENCES employee_master(employee_id),
  FOREIGN KEY (generated_by) REFERENCES employee_master(employee_id)
);

-- 13. medicine_master
CREATE TABLE medicine_master (
  medicine_sku VARCHAR(20) PRIMARY KEY,
  medicine_name VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(100),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0)
);

-- 14. med_prescription
CREATE TABLE med_prescription (
  prescription_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  prescribed_by INT NOT NULL,
  medicine_sku VARCHAR(20) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  duration_days INT NOT NULL,
  prescribed_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id),
  FOREIGN KEY (prescribed_by) REFERENCES employee_master(employee_id),
  FOREIGN KEY (medicine_sku) REFERENCES medicine_master(medicine_sku)
);

-- 15. med_inventory
CREATE TABLE med_inventory (
  inv_line_id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_sku VARCHAR(20) NOT NULL,
  batch_no VARCHAR(30) NOT NULL,
  quantity INT NOT NULL CHECK (quantity >= 0),
  expiry_date DATE NOT NULL,
  received_on DATE NOT NULL,
  FOREIGN KEY (medicine_sku) REFERENCES medicine_master(medicine_sku)
);

-- 16. med_sale
CREATE TABLE med_sale (
  sales_trac_no INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_sku VARCHAR(20) NOT NULL,
  inv_line_id INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patient_master(patient_id),
  FOREIGN KEY (medicine_sku) REFERENCES medicine_master(medicine_sku),
  FOREIGN KEY (inv_line_id) REFERENCES med_inventory(inv_line_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_lab_patient ON lab_report_results(patient_id);
CREATE INDEX idx_presc_patient ON med_prescription(patient_id);
CREATE INDEX idx_bill_patient ON billing(patient_id);
CREATE INDEX idx_inv_medicine ON med_inventory(medicine_sku);