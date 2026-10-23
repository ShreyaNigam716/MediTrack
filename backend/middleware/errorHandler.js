module.exports = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  switch (err.code) {
    case 'ER_DUP_ENTRY':
      status = 409;
      message = 'Duplicate entry: that record already exists';
      break;
    case 'ER_NO_REFERENCED_ROW_2':
      status = 400;
      message = 'Invalid reference: a related record (patient, employee, medicine, test...) does not exist';
      break;
    case 'ER_ROW_IS_REFERENCED_2':
      status = 409;
      message = 'Cannot delete: other records depend on this one';
      break;
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      status = 400;
      message = 'Value rejected by a database check constraint';
      break;
    case 'WARN_DATA_TRUNCATED':
    case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
    case 'ER_DATA_TOO_LONG':
      status = 400;
      message = 'Invalid value for a field (check allowed values like role, gender, room_type)';
      break;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ error: message });
};