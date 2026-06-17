// import { registerAs } from '@nestjs/config';

// export default registerAs('cloudinary', () => ({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// }));


// src/config/cloudinary.config.ts

import { registerAs } from '@nestjs/config';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
  maxFileSize?: number;
}

export default registerAs('cloudinary', (): CloudinaryConfig => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Validate required fields
  if (!cloudName) {
    throw new Error('CLOUDINARY_CLOUD_NAME is required');
  }
  if (!apiKey) {
    throw new Error('CLOUDINARY_API_KEY is required');
  }
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET is required');
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_DEFAULT_FOLDER || 'oceaned',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  };
});