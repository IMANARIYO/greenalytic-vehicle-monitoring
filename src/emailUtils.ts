import nodemailer from 'nodemailer';
import { ENV } from './config/env.js';
import { AppError } from './middlewares/errorHandler.js';


const validateEmailConfig = (): void => {
  if (!ENV.EMAIL_USER || !ENV.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
  }
};
validateEmailConfig();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: ENV.EMAIL_USER,
      pass: ENV.EMAIL_PASS,
    },
  });
};

interface SendEmailResult {
  success: boolean;
  message: string;
  data: {
    messageId: string;
    to: string;
    subject: string;
  };
}

export const sendEmail = async (
  to: string,
  subject: string,
  textContent?: string,
  htmlContent?: string,
  adminEmail?: string | null
): Promise<SendEmailResult> => {
  try {
    if (!to || !subject) {
      throw new AppError('Email recipient and subject are required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new AppError('Invalid email format', 400);
    }

    const transporter = createTransporter();
    const fromEmail = adminEmail ?? ENV.EMAIL_USER;

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${to}`);

    return {
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId,
        to,
        subject,
      },
    };
  } catch (error: unknown) {
    console.error('Failed to send email:', error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to send email', 500);
  }
};
