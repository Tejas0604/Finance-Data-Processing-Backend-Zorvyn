/**
 * Request Validation Middleware
 *
 * Uses Joi schemas to validate `req.body`, `req.query`, or `req.params`.
 * Returns 400 with detailed field-level error messages on failure.
 *
 * Usage:
 *   router.post('/items', validate(createItemSchema), handler);
 *   router.get('/items',  validate(listQuerySchema, 'query'), handler);
 */

const { BadRequestError } = require('../utils/errors');

function validate(schema, property = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,   // report all errors, not just the first
      stripUnknown: true,  // remove unknown fields
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(new BadRequestError(JSON.stringify(details)));
    }

    // Replace with sanitised values
    req[property] = value;
    next();
  };
}

module.exports = validate;
