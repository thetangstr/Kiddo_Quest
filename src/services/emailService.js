import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Email Service for Kiddo Quest
 * 
 * This service handles all email-related functionality including:
 * - Sending invitations
 * - Password reset notifications
 * - Account verification
 * 
 * Note: In a production environment, this would connect to a real email service
 * such as SendGrid, Mailgun, Firebase Cloud Functions, etc.
 */
class EmailService {
  /**
   * Send an invitation email
   * @param {Object} invitationData - Invitation data
   * @returns {Promise<boolean>} Success status
   */
  async sendInvitationEmail(invitationData) {
    try {
      // Log the email send attempt
      const emailLogRef = await addDoc(collection(db, 'emailLogs'), {
        type: 'invitation',
        to: invitationData.email,
        subject: 'Invitation to Kiddo Quest',
        htmlContent: this.formatHtmlEmail(invitationData.message),
        sentAt: serverTimestamp(),
        sentBy: invitationData.sentBy || 'system',
        status: 'pending'
      });

      // In a real implementation, you would make an API call to your email service here
      // For example:
      // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     personalizations: [{ to: [{ email: invitationData.email }] }],
      //     from: { email: 'noreply@kiddoquest.com', name: 'Kiddo Quest' },
      //     subject: 'Invitation to Kiddo Quest',
      //     content: [{ type: 'text/html', value: this.formatHtmlEmail(invitationData.message) }],
      //   }),
      // });
      
      // For this implementation, we'll simulate a successful email send
      console.log(`SIMULATED EMAIL: Invitation sent to ${invitationData.email}`);
      
      // Update the email log
      await updateDoc(doc(db, 'emailLogs', emailLogRef.id), {
        status: 'sent',
        sentAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }
  
  /**
   * Send a password reset notification
   * @param {string} email - User email
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(email) {
    try {
      // Log the email send attempt
      const emailLogRef = await addDoc(collection(db, 'emailLogs'), {
        type: 'password_reset',
        to: email,
        subject: 'Password Reset - Kiddo Quest',
        htmlContent: this.formatHtmlEmail(
          `<p>A password reset request has been initiated for your account. If you did not request this, please ignore this email.</p>
           <p>To reset your password, check your email for instructions from Firebase Authentication.</p>`
        ),
        sentAt: serverTimestamp(),
        sentBy: 'system',
        status: 'pending'
      });
      
      // Simulate successful email send
      console.log(`SIMULATED EMAIL: Password reset notification sent to ${email}`);
      
      // Update the email log
      await updateDoc(doc(db, 'emailLogs', emailLogRef.id), {
        status: 'sent',
        sentAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
  
  /**
   * Send account verification reminder
   * @param {string} email - User email
   * @returns {Promise<boolean>} Success status
   */
  async sendVerificationReminder(email) {
    try {
      // Log the email send attempt
      const emailLogRef = await addDoc(collection(db, 'emailLogs'), {
        type: 'verification_reminder',
        to: email,
        subject: 'Please Verify Your Email - Kiddo Quest',
        htmlContent: this.formatHtmlEmail(
          `<p>Please verify your email address to complete your registration with Kiddo Quest.</p>
           <p>If you didn't receive the verification email, you can request a new one from the login screen.</p>`
        ),
        sentAt: serverTimestamp(),
        sentBy: 'system',
        status: 'pending'
      });
      
      // Simulate successful email send
      console.log(`SIMULATED EMAIL: Verification reminder sent to ${email}`);
      
      // Update the email log
      await updateDoc(doc(db, 'emailLogs', emailLogRef.id), {
        status: 'sent',
        sentAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error sending verification reminder:', error);
      return false;
    }
  }
  
  /**
   * Format an HTML email with consistent branding
   * @param {string} content - Email content (can include HTML)
   * @returns {string} Formatted HTML email
   */
  formatHtmlEmail(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6366F1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { text-align: center; font-size: 12px; color: #666; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kiddo Quest</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kiddo Quest. All rights reserved.</p>
            <p>This email was sent to you as part of your Kiddo Quest account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();
