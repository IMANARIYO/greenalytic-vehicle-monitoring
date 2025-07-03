import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  SOCKET_SERVER_PORT: process.env.SOCKET_SERVER_PORT || '4000',
  EXPRESS_SERVER_PORT: process.env.EXPRESS_SERVER_PORT || '5000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  SALT_ROUNDS: process.env.saltRounds || '2',
  JWT_EXP: (process.env.JWT_EXP as `${number}${"d" | "h" | "m" | "s"}`) || "10h",
  CLOUD_NAME: process.env.CLOUD_NAME || '',
  API_KEY: process.env.API_KEY || '',
  API_SECRET: process.env.API_SECRET || '',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  APPLICATION_ID: process.env.APPLICATION_ID || '',
  APPLICATION_SECRET: process.env.APPLICATION_SECRET || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
