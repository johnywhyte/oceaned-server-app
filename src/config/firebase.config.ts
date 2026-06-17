import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const getFirebaseConfig = (configService: ConfigService) => {
  const privateKey = configService
    .get<string>('FIREBASE_PRIVATE_KEY')
    ?.replace(/\\n/g, '\n');

  return {
    projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
    privateKey: privateKey,
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
  };
};

export const initializeFirebase = (
  configService: ConfigService,
): admin.app.App => {
  const firebaseConfig = getFirebaseConfig(configService);

  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      privateKey: firebaseConfig.privateKey,
      clientEmail: firebaseConfig.clientEmail,
    }),
  });
};
