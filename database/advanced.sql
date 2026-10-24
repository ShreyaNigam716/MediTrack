USE meditrack;

DROP TRIGGER IF EXISTS trg_sale_check_stock;
DROP TRIGGER IF EXISTS trg_labreport_doctor_only;
DROP TRIGGER IF EXISTS trg_prescription_doctor_only;
DROP TRIGGER IF EXISTS trg_sale_deduct_stock;

DELIMITER $$

-- Trigger 1: a sale can never exceed the batch's stock or use an expired batch
CREATE TRIGGER trg_sale_check_stock
BEFORE INSERT ON med_sale
FOR EACH ROW
BEGIN
  DECLARE available INT DEFAULT NULL;
  DECLARE batch_expiry DATE DEFAULT NULL;

  SELECT quantity, expiry_date INTO available, batch_expiry
  FROM med_inventory WHERE inv_line_id = NEW.inv_line_id;

  IF available IS NULL OR NEW.quantity > available THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock in this batch';
  END IF;

  IF batch_expiry < CURDATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot sell an expired batch';
  END IF;
END$$

-- Trigger 2: only doctors can prescribe lab tests (enforced inside the database)
CREATE TRIGGER trg_labreport_doctor_only
BEFORE INSERT ON lab_report_results
FOR EACH ROW
BEGIN
  IF (SELECT role FROM employee_master WHERE employee_id = NEW.prescribed_by) <> 'doctor' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a doctor can prescribe a lab test';
  END IF;
END$$

-- Trigger 3: only doctors can prescribe medicines
CREATE TRIGGER trg_prescription_doctor_only
BEFORE INSERT ON med_prescription
FOR EACH ROW
BEGIN
  IF (SELECT role FROM employee_master WHERE employee_id = NEW.prescribed_by) <> 'doctor' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a doctor can prescribe medicines';
  END IF;
END$$

DELIMITER ;

-- View 1: one-row summary per patient
CREATE OR REPLACE VIEW patient_summary AS
SELECT p.patient_id,
       CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
       p.phone,
       r.room_no,
       (SELECT COUNT(*) FROM lab_report_results l
         WHERE l.patient_id = p.patient_id) AS total_tests,
       (SELECT COUNT(*) FROM lab_report_results l
         WHERE l.patient_id = p.patient_id AND l.status = 'pending') AS pending_tests,
       (SELECT COUNT(*) FROM med_prescription mp
         WHERE mp.patient_id = p.patient_id) AS total_prescriptions,
       (SELECT COALESCE(SUM(b.amount), 0) FROM billing b
         WHERE b.patient_id = p.patient_id AND b.status = 'pending') AS amount_due
FROM patient_master p
LEFT JOIN room r ON r.patient_id = p.patient_id;

-- View 2: total stock per medicine
CREATE OR REPLACE VIEW medicine_stock AS
SELECT m.medicine_sku, m.medicine_name, m.unit_price,
       COALESCE(SUM(i.quantity), 0) AS total_stock
FROM medicine_master m
LEFT JOIN med_inventory i ON i.medicine_sku = m.medicine_sku
GROUP BY m.medicine_sku, m.medicine_name, m.unit_price;




DELIMITER $$

CREATE TRIGGER trg_sale_deduct_stock
AFTER INSERT ON med_sale
FOR EACH ROW
BEGIN
    UPDATE med_inventory
    SET quantity = quantity - NEW.quantity
    WHERE inv_line_id = NEW.inv_line_id;
END$$

DELIMITER ;
