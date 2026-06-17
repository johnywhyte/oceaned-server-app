import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';


export const getEmailConfig = (configService: ConfigService): MailerOptions => {
  return {
    transport: {
      host: configService.get<string>('SMTP_HOST'), // sandbox.smtp.mailtrap.io
      port: configService.get<number>('SMTP_PORT', 2525),
      secure: configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASSWORD'),
      },
    },
    defaults: {
      from: `"${configService.get<string>('APP_NAME', 'OCEANED')}" <${configService.get<string>('EMAIL_FROM')}>`,
    },
    template: {
      // Points to the compiled templates in the dist folder
      dir: join(process.cwd(), 'dist/src/email/templates'),
      adapter: new HandlebarsAdapter(),
      options: {
        strict: true,
      },
    },
  };
};