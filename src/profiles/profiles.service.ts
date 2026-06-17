import {
Injectable,
NotFoundException,
BadRequestException,
ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Injectable()
export class ProfilesService {
constructor(
@InjectRepository(UserProfile)
private readonly userProfileRepository: Repository<UserProfile>,
private readonly cloudinaryService: CloudinaryService,
) {}

async create(
userId: number,
createProfileDto: CreateProfileDto,
): Promise<UserProfile> {
const existingProfile = await this.userProfileRepository.findOne({
where: { userId },
});

if (existingProfile) {
  throw new ConflictException('Profile already exists for this user');
}

const profile = this.userProfileRepository.create({
  userId,
  ...createProfileDto,
});

profile.isComplete = this.calculateCompletionStatus(profile);

return await this.userProfileRepository.save(profile);
}

async findByUserId(userId: number): Promise<UserProfile> {
const profile = await this.userProfileRepository.findOne({
where: { userId },
relations: ['user'],
});

if (!profile) {
  throw new NotFoundException('Profile not found');
}

return profile;
}

async update(
userId: number,
updateProfileDto: UpdateProfileDto,
): Promise<UserProfile> {
const profile = await this.userProfileRepository.findOne({
where: { userId },
});

if (!profile) {
  throw new NotFoundException('Profile not found');
}

Object.assign(profile, updateProfileDto);
profile.isComplete = this.calculateCompletionStatus(profile);

return await this.userProfileRepository.save(profile);
}

async uploadProfilePicture(
userId: number,
file: Express.Multer.File,
): Promise<{ profilePictureUrl: string; message: string }> {
if (!file) {
throw new BadRequestException('No file uploaded');
}

const profile = await this.userProfileRepository.findOne({
  where: { userId },
});

if (!profile) {
  throw new NotFoundException('Profile not found');
}

if (profile.profilePicturePublicId) {
  try {
    await this.cloudinaryService.deleteImage(profile.profilePicturePublicId);
  } catch (error) {
    console.error('Failed to delete old profile picture:', error);
  }
}

const uploadResult = await this.cloudinaryService.uploadImage(
  file,
  'profile-pictures',
);

profile.profilePictureUrl = uploadResult.url;
profile.profilePicturePublicId = uploadResult.publicId;
profile.isComplete = this.calculateCompletionStatus(profile);
await this.userProfileRepository.save(profile);

return {
  profilePictureUrl: uploadResult.url,
  message: 'Profile picture uploaded successfully',
};
}

async deleteProfilePicture(
userId: number,
): Promise<{ message: string }> {
const profile = await this.userProfileRepository.findOne({
where: { userId },
});

if (!profile) {
  throw new NotFoundException('Profile not found');
}

if (!profile.profilePictureUrl) {
  throw new BadRequestException('No profile picture to delete');
}

if (profile.profilePicturePublicId) {
  try {
    await this.cloudinaryService.deleteImage(profile.profilePicturePublicId);
  } catch (error) {
    console.error('Failed to delete profile picture:', error);
  }
}

profile.profilePictureUrl = null;
profile.profilePicturePublicId = null;
profile.isComplete = this.calculateCompletionStatus(profile);
await this.userProfileRepository.save(profile);

return {
  message: 'Profile picture deleted successfully',
};
}

async getCompletionPercentage(userId: number): Promise<{ percentage: number; missingFields: string[] }> {
const profile = await this.userProfileRepository.findOne({
where: { userId },
});

if (!profile) {
  throw new NotFoundException('Profile not found');
}

const requiredFields = [
  'dateOfBirth',
  'gender',
  'nationality',
  'address',
  'city',
  'state',
  'postalCode',
  'highestEducation',
  'fieldOfStudy',
  'institutionName',
  'graduationYear',
  'gpa',
  'profilePictureUrl',
];

const filledFields = requiredFields.filter((field) => profile[field] != null);
const percentage = Math.round((filledFields.length / requiredFields.length) * 100);
const missingFields = requiredFields.filter((field) => profile[field] == null);

return {
  percentage,
  missingFields,
};
}

async remove(userId: number): Promise<{ message: string }> {
const profile = await this.userProfileRepository.findOne({
where: { userId },
});

if (!profile) {
  throw new NotFoundException('Profile not found');
}

if (profile.profilePicturePublicId) {
  try {
    await this.cloudinaryService.deleteImage(profile.profilePicturePublicId);
  } catch (error) {
    console.error('Failed to delete profile picture:', error);
  }
}

await this.userProfileRepository.softDelete(profile.id);

return {
  message: 'Profile deleted successfully',
};
}

private calculateCompletionStatus(profile: UserProfile): boolean {
const requiredFields = [
'dateOfBirth',
'gender',
'nationality',
'address',
'city',
'state',
'postalCode',
'highestEducation',
'fieldOfStudy',
'institutionName',
'graduationYear',
'gpa',
'profilePictureUrl',
];

const filledFields = requiredFields.filter((field) => profile[field] != null);
const completionPercentage = (filledFields.length / requiredFields.length) * 100;
return completionPercentage >= 80;
}
}