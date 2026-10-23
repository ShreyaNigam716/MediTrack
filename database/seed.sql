USE meditrack;

INSERT INTO department VALUES
('CARD','Cardiology'),
('GEN','General Medicine'),
('PATH','Pathology Lab'),
('ADM','Administration');

INSERT INTO speciality VALUES
('CARDIO','Cardiologist'),
('GP','General Physician'),
('PATHO','Pathologist');

INSERT INTO employee_master (first_name,last_name,email,phone,role,hire_date,department_code) VALUES
('Anil','Sharma','anil.sharma@meditrack.com','9810000001','doctor','2020-06-15','CARD'),
('Meera','Kapoor','meera.kapoor@meditrack.com','9810000002','doctor','2021-02-01','GEN'),
('Rohit','Verma','rohit.verma@meditrack.com','9810000003','lab_technician','2022-08-10','PATH'),
('Sunita','Rao','sunita.rao@meditrack.com','9810000004','admin','2019-01-20','ADM');

INSERT INTO employee_specialty (employee_id,speciality_code) VALUES
(1,'CARDIO'),(2,'GP'),(3,'PATHO');

INSERT INTO employees_paycheck (employee_id,pay_date,basic_salary,bonus,deductions) VALUES
(1,'2026-09-30',150000,10000,5000),
(2,'2026-09-30',120000,5000,4000),
(3,'2026-09-30',45000,0,1500),
(4,'2026-09-30',60000,2000,2000);

INSERT INTO patient_master (first_name,last_name,dob,gender,phone,email,address,blood_group) VALUES
('Rahul','Mehta','1995-04-12','male','9820000001','rahul.mehta@mail.com','Indirapuram, Ghaziabad','B+'),
('Priya','Singh','1988-11-03','female','9820000002','priya.singh@mail.com','Vaishali, Ghaziabad','O+'),
('Aman','Gupta','2001-07-25','male','9820000003','aman.gupta@mail.com','Noida Sector 62','A+');

INSERT INTO patient_insurance (patient_id,provider_name,policy_number,coverage_amount,valid_till) VALUES
(1,'Star Health','SH123456',500000,'2027-03-31'),
(2,'HDFC Ergo','HE987654',300000,'2027-01-15');

INSERT INTO patient_emergency_contact (patient_id,contact_name,relation,phone) VALUES
(1,'Sneha Mehta','Wife','9830000001'),
(2,'Karan Singh','Husband','9830000002'),
(3,'Ritu Gupta','Mother','9830000003');

INSERT INTO room (room_no,room_type,daily_charge,patient_id,admitted_on) VALUES
('101','general',1500,1,'2026-10-20 10:30:00'),
('102','general',1500,NULL,NULL),
('201','private',4000,NULL,NULL),
('ICU1','icu',9000,NULL,NULL);

INSERT INTO billing (patient_id,description,amount,status) VALUES
(1,'Consultation + Room 101',3500,'pending'),
(2,'Consultation',800,'paid');

INSERT INTO test VALUES
('CBC','Complete Blood Count',400),
('LIPID','Lipid Profile',700),
('SUGAR','Blood Sugar Fasting',150);

INSERT INTO lab_report_results (test_code,patient_id,prescribed_by,generated_by,status,result_value,reported_on) VALUES
('CBC',1,1,3,'completed','Hb 13.5 g/dL, WBC 7200, Platelets 250000','2026-10-21 12:00:00'),
('LIPID',1,1,NULL,'pending',NULL,NULL),
('SUGAR',2,2,NULL,'pending',NULL,NULL);

INSERT INTO medicine_master VALUES
('PARA500','Paracetamol 500mg','Cipla',2.00),
('AMOX250','Amoxicillin 250mg','Sun Pharma',8.50),
('ATOR10','Atorvastatin 10mg','Dr. Reddys',6.00);

INSERT INTO med_prescription (patient_id,prescribed_by,medicine_sku,dosage,duration_days) VALUES
(1,1,'ATOR10','1 tablet at night',30),
(2,2,'PARA500','1 tablet twice a day',5);

INSERT INTO med_inventory (medicine_sku,batch_no,quantity,expiry_date,received_on) VALUES
('PARA500','B-001',500,'2027-12-31','2026-09-01'),
('AMOX250','B-002',200,'2027-06-30','2026-09-05'),
('ATOR10','B-003',300,'2028-01-31','2026-09-10');

INSERT INTO med_sale (patient_id,medicine_sku,inv_line_id,quantity,total_amount) VALUES
(2,'PARA500',1,10,20.00);