const success = (res, data = null, message = 'success') => {
  return res.json({ code: 200, message, data });
};

const error = (res, statusCode = 500, message = 'Internal Server Error', data = null) => {
  return res.status(statusCode).json({ code: statusCode, message, data });
};

const created = (res, data = null, message = 'Created successfully') => {
  return res.status(201).json({ code: 201, message, data });
};

const unauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ code: 401, message, data: null });
};

const forbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ code: 403, message, data: null });
};

module.exports = { success, error, created, unauthorized, forbidden };
