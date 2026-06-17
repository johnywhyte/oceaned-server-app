import {
Entity,
PrimaryGeneratedColumn,
Column,
OneToOne,
JoinColumn,
CreateDateColumn,
UpdateDateColumn,
DeleteDateColumn,
Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_profiles')
@Index('idx_user_profiles_user_id', ['userId'])
@Index('idx_user_profiles_is_complete', ['isComplete'])
export class UserProfile {
@PrimaryGeneratedColumn('increment', { type: 'bigint' })
id: number;
@Column({ name: 'user_id', type: 'bigint', unique: true })
userId: number;
@Column({ name: 'date_of_birth', type: 'date', nullable: true })
dateOfBirth: Date;
@Column({ type: 'varchar', length: 20, nullable: true, comment: 'MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY' })
gender: string;
@Column({ type: 'varchar', length: 100, nullable: true, comment: 'Country of citizenship' })
nationality: string;
@Column({ type: 'text', nullable: true, comment: 'Full street address' })
address: string;
@Column({ type: 'varchar', length: 100, nullable: true, comment: 'City of residence' })
city: string;
@Column({ type: 'varchar', length: 100, nullable: true, comment: 'State or province' })
state: string;
@Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true, comment: 'ZIP or postal code' })
postalCode: string;
@Column({ name: 'profile_picture_url', type: 'varchar', length: 500, nullable: true, comment: 'Profile photo URL' })
profilePictureUrl: string | null;
@Column({ name: 'profile_picture_public_id', type: 'varchar', length: 255, nullable: true, comment: 'Cloudinary public ID' })
profilePicturePublicId: string | null;
@Column({ name: 'highest_education', type: 'varchar', length: 200, nullable: true, comment: 'Highest degree obtained' })
highestEducation: string;
@Column({ name: 'field_of_study', type: 'varchar', length: 200, nullable: true, comment: 'Major or field of study' })
fieldOfStudy: string;
@Column({ name: 'institution_name', type: 'varchar', length: 255, nullable: true, comment: 'Name of institution' })
institutionName: string;
@Column({ name: 'graduation_year', type: 'int', nullable: true, comment: 'Year of graduation' })
graduationYear: number;
@Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, comment: 'Grade point average' })
gpa: number;
@Column({ name: 'english_proficiency', type: 'varchar', length: 50, nullable: true, comment: 'IELTS, TOEFL score' })
englishProficiency: string;
@Column({ name: 'work_experience', type: 'text', nullable: true, comment: 'Professional work history' })
workExperience: string;
@Column({ name: 'linkedin_url', type: 'varchar', length: 500, nullable: true, comment: 'LinkedIn profile URL' })
linkedinUrl: string;
@Column({ name: 'portfolio_url', type: 'varchar', length: 500, nullable: true, comment: 'Personal portfolio URL' })
portfolioUrl: string;
@Column({ type: 'text', nullable: true, comment: 'Personal statement or bio' })
bio: string;
@Column({ name: 'is_complete', type: 'tinyint', width: 1, default: 0, comment: 'Profile completion status' })
isComplete: boolean;
@CreateDateColumn({ name: 'created_at' })
createdAt: Date;
@UpdateDateColumn({ name: 'updated_at' })
updatedAt: Date;
@DeleteDateColumn({ name: 'deleted_at', nullable: true })
deletedAt: Date;
@OneToOne(() => User, (user) => user.profile)
@JoinColumn({ name: 'user_id' })
user: User;
}