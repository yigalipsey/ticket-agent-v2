import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  PORT: Joi.number().integer().min(1).max(65535).required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  JWT_SECRET: Joi.string().min(16).required(),
});
