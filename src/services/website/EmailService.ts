import { sendEmail } from '../../emailUtils.js';
import logger from '../../utils/logger.js';

interface EmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date;
}

export class EmailService {

  // Generate HTML template for user confirmation email
  private generateUserConfirmationEmail(data: EmailData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received - Greenalytic Motors</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 20px; }
            .content h2 { color: #059669; margin-bottom: 20px; font-size: 24px; }
            .content p { margin-bottom: 15px; font-size: 16px; }
            .message-summary { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; }
            .message-summary h3 { margin: 0 0 10px 0; color: #047857; }
            .contact-info { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .contact-info h3 { margin: 0 0 15px 0; color: #374151; }
            .contact-item { margin-bottom: 10px; }
            .footer { background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .footer a { color: #10b981; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Greenalytic Motors</h1>
                <p>Clean Mobility Solutions</p>
            </div>
            
            <div class="content">
                <h2>Thank you for contacting us!</h2>
                
                <p>Dear ${data.name},</p>
                
                <p>We have received your message and wanted to confirm that it has been successfully submitted. Our team will review your inquiry and get back to you within 24 hours.</p>
                
                <div class="message-summary">
                    <h3>Your Message Summary:</h3>
                    <p><strong>Subject:</strong> ${data.subject || 'No subject provided'}</p>
                    <p><strong>Submitted:</strong> ${data.submittedAt.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                </div>
                
                <p>In the meantime, feel free to:</p>
                <ul>
                    <li>Visit our website at <a href="https://greenalytic.rw" style="color: #059669;">greenalytic.rw</a> to learn more about our solutions</li>
                    <li>Follow us on social media for the latest updates</li>
                    <li>Contact us directly for urgent matters</li>
                </ul>
                
                <div class="contact-info">
                    <h3>Contact Information</h3>
                    <div class="contact-item"><strong>Email:</strong> info@greenalytic.rw</div>
                    <div class="contact-item"><strong>Phone:</strong> +250 796 895 138</div>
                    <div class="contact-item"><strong>WhatsApp:</strong> +250 796 895 138</div>
                    <div class="contact-item"><strong>Office:</strong> Kicukiro, Kigali, Rwanda</div>
                </div>
                
                <p>Thank you for your interest in Greenalytic Motors!</p>
                
                <p>Best regards,<br>
                <strong>The Greenalytic Motors Team</strong></p>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 Greenalytic Motors. All rights reserved.</p>
                <p>
                    <a href="https://greenalytic.rw">Website</a> | 
                    <a href="mailto:info@greenalytic.rw">Email</a> | 
                    <a href="tel:+250796895138">Phone</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate HTML template for admin notification email
  private generateAdminNotificationEmail(data: EmailData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message - Greenalytic Motors</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 30px 20px; }
            .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; }
            .alert h2 { margin: 0 0 10px 0; color: #dc2626; font-size: 18px; }
            .sender-info { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .sender-info h3 { margin: 0 0 15px 0; color: #374151; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #374151; min-width: 80px; }
            .info-value { color: #6b7280; }
            .message-content { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .message-content h3 { margin: 0 0 15px 0; color: #374151; }
            .message-text { background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
            .action-buttons { text-align: center; margin: 30px 0; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; }
            .btn:hover { background-color: #047857; }
            .footer { background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Contact Message</h1>
                <p>Greenalytic Motors - Admin Notification</p>
            </div>
            
            <div class="content">
                <div class="alert">
                    <h2>Action Required</h2>
                    <p>A new contact message has been submitted through the website and requires your attention.</p>
                </div>
                
                <div class="sender-info">
                    <h3>Sender Information</h3>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${data.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value"><a href="mailto:${data.email}" style="color: #059669;">${data.email}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Subject:</span>
                        <span class="info-value">${data.subject || 'No subject provided'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Submitted:</span>
                        <span class="info-value">${data.submittedAt.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}</span>
                    </div>
                </div>
                
                <div class="message-content">
                    <h3>Message Content</h3>
                    <div class="message-text">${data.message}</div>
                </div>
                
                <div class="action-buttons">
                    <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject || 'Your inquiry')}" class="btn">
                        Reply to ${data.name}
                    </a>
                </div>
                
                <p><strong>Response Time Goal:</strong> Please respond within 24 hours to maintain our service standards.</p>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li>Review the message content carefully</li>
                    <li>Prepare a personalized response</li>
                    <li>Click the "Reply" button above or respond directly from your email client</li>
                    <li>Update any relevant internal systems if needed</li>
                </ol>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from the Greenalytic Motors contact form system.</p>
                <p>Greenalytic Motors | Kicukiro, Kigali, Rwanda | info@greenalytic.rw</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Send confirmation email to user
  async sendUserConfirmationEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await sendEmail(
        data.email,
        'Message Received - We\'ll be in touch soon!',
        `Dear ${data.name},\n\nWe have received your message and will get back to you within 24 hours.\n\nSubject: ${data.subject}\nSubmitted: ${data.submittedAt.toLocaleDateString()}\n\nBest regards,\nThe Greenalytic Motors Team`,
        this.generateUserConfirmationEmail(data),
        'info@greenalytic.rw'
      );
      
      logger.info('EmailService::sendUserConfirmationEmail success', { 
        email: data.email,
        name: data.name
      });
      
      return { success: true };
    } catch (error: any) {
      logger.error('EmailService::sendUserConfirmationEmail failed', { 
        error: error.message,
        email: data.email,
        name: data.name
      });
      
      return { 
        success: false, 
        error: error.message || 'Failed to send confirmation email'
      };
    }
  }

  // Send notification email to admin
  async sendAdminNotificationEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      await sendEmail(
        'info@greenalytic.rw',
        `New Contact Message from ${data.name}`,
        `New contact message received:\n\nFrom: ${data.name} (${data.email})\nSubject: ${data.subject}\nMessage: ${data.message}\nSubmitted: ${data.submittedAt.toLocaleDateString()}`,
        this.generateAdminNotificationEmail(data),
        data.email
      );
      
      logger.info('EmailService::sendAdminNotificationEmail success', { 
        senderEmail: data.email,
        senderName: data.name
      });
      
      return { success: true };
    } catch (error: any) {
      logger.error('EmailService::sendAdminNotificationEmail failed', { 
        error: error.message,
        senderEmail: data.email,
        senderName: data.name
      });
      
      return { 
        success: false, 
        error: error.message || 'Failed to send admin notification email'
      };
    }
  }

  // Send both emails
  async sendContactEmails(data: EmailData): Promise<{
    userEmailSent: boolean;
    adminEmailSent: boolean;
    userEmailError?: string;
    adminEmailError?: string;
  }> {
    const [userResult, adminResult] = await Promise.all([
      this.sendUserConfirmationEmail(data),
      this.sendAdminNotificationEmail(data)
    ]);

    return {
      userEmailSent: userResult.success,
      adminEmailSent: adminResult.success,
      userEmailError: userResult.error,
      adminEmailError: adminResult.error
    };
  }
}

export default new EmailService();