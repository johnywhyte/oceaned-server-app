import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to OCEANED - Account Created',
        template: 'welcome', 
        context: {
          firstName,
          email,
          loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
          oceaned: this.configService.get('APP_NAME', 'OCEANED'),
          supportEmail: this.configService.get('EMAIL_FROM', 'support@oceaned.com'),
        },
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
    }
  }

  async sendAccountCredentialsEmail(
    email: string,
    firstName: string,
    password: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your OCEANED Account Credentials',
        template: 'account-credentials',
        context: {
          firstName,
          email,
          password,
          loginUrl: `${this.configService.get('FRONTEND_URL')}/account/login`,
          oceaned: this.configService.get('APP_NAME', 'OCEANED'),
          supportEmail: this.configService.get('EMAIL_FROM', 'support@oceaned.com'),
        },
      });
      this.logger.log(`Account credentials email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send credentials email to ${email}`,
        error.stack,
      );
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your Password Reset Token - OCEANED',
        template: 'forgot-password', 
        context: {
          firstName,
          resetToken,
          expiryTime: '1 hour',
          oceaned: this.configService.get('APP_NAME', 'OCEANED'),
        },
      });
      this.logger.log(`Password reset token sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send reset email to ${email}`, error.stack);
    }
  }

  async sendPasswordResetConfirmation(email: string, firstName: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Successfully Updated - OCEANED',
        template: 'reset-password-confirmation', 
        context: {
          firstName,
          loginUrl: `${this.configService.get('FRONTEND_URL')}/login`,
          oceaned: this.configService.get('APP_NAME', 'OCEANED'),
        },
      });
      this.logger.log(`Confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation to ${email}`, error.stack);
    }
  }

  async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
    return this.sendPasswordResetConfirmation(email, firstName);
  }
}