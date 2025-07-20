import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ENV } from '../config/env.js';  // Adjust path to your env.ts

// Hash password
export const passHashing = async (password: string): Promise<string> => {
  const saltRounds = parseInt(ENV.SALT_ROUNDS, 10) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// Compare password with hashed password
export const passComparer = async (password: string, hashedPass: string): Promise<boolean> => {
  const result = await bcrypt.compare(password, hashedPass);
  return result;
};

// OTP return type
export interface OTPResult {
  code: string;
  expiresAt: Date;
}

// Generate OTP with expiry
export const generateOTP = (expiryMinutes = 30): OTPResult => {
  const otp = crypto.randomInt(100000, 999999);
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
  return {
    code: otp.toString(),
    expiresAt: expiryTime,
  };
};

// OTP validation result type
export interface OTPValidationResult {
  valid: boolean;
  message: string;
}

// Validate OTP
export const isOTPValid = (
  storedOTP: string,
  enteredOTP: string,
  expiresAt: Date | string
): OTPValidationResult => {
  if (storedOTP !== enteredOTP) {
    return {
      valid: false,
      message: "Invalid OTP provided",
    };
  }

  const currentDateTime = new Date();
  const storedExpiresAt = new Date(expiresAt);

  if (currentDateTime > storedExpiresAt) {
    return {
      valid: false,
      message: "The provided OTP has expired",
    };
  }

  return {
    valid: true,
    message: "OTP is valid",
  };
};
