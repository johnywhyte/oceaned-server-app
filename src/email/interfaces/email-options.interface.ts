export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface WelcomeEmailContext {
  firstName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  appName: string;
  supportEmail: string;
}

export interface PasswordResetEmailContext {
  firstName: string;
  resetUrl: string;
  resetToken: string;
  expiryTime: string;
  appName: string;
  supportEmail: string;
}