const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
});

const env = {
  PORT: Number(process.env.PORT),
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_DAYS: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  REFRESH_TOKEN_COOKIE_NAME: process.env.REFRESH_TOKEN_COOKIE_NAME || 'crm_refresh_token',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  IS_PROD: process.env.NODE_ENV === 'production',
};

module.exports = env;
