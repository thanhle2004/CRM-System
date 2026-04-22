const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = [
  "PORT",
  "MONGO_URI",
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
  IS_PROD: process.env.NODE_ENV,
};

module.exports = env;
