// middlewares/validate.js
/**
 * Express middleware factory that validates req.body against a Joi schema.
 * Returns 400 with all field-level errors on failure.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
    console.log('[validate] Validation failed', { path: req.path, errors });
    return res.status(400).json({ success: false, errors });
  }
  next();
};

module.exports = validate;
