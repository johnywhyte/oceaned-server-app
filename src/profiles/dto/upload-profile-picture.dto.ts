import { ApiProperty } from '@nestjs/swagger';
export class UploadProfilePictureDto {
@ApiProperty({
description: 'Profile picture file (JPEG, PNG, max 5MB)',
type: 'string',
format: 'binary',
})
file: Express.Multer.File;
}