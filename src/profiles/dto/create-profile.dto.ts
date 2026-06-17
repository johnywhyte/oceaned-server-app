import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
IsString,
IsOptional,
IsDateString,
IsInt,
IsNumber,
IsUrl,
Min,
Max,
MaxLength,
IsEnum,
} from 'class-validator';
export enum Gender {
MALE = 'MALE',
FEMALE = 'FEMALE',
OTHER = 'OTHER',
PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}
export class CreateProfileDto {
@ApiPropertyOptional({
description: 'Date of birth',
example: '1995-06-15',
type: 'string',
format: 'date',
})
@IsOptional()
@IsDateString()
dateOfBirth?: string;
@ApiPropertyOptional({
description: 'Gender',
enum: Gender,
example: Gender.MALE,
})
@IsOptional()
@IsEnum(Gender)
gender?: Gender;
@ApiPropertyOptional({
description: 'Nationality (Country of citizenship)',
example: 'Nigeria',
maxLength: 100,
})
@IsOptional()
@IsString()
@MaxLength(100)
nationality?: string;
@ApiPropertyOptional({
description: 'Full street address',
example: '123 Main Street, Apartment 4B',
})
@IsOptional()
@IsString()
address?: string;
@ApiPropertyOptional({
description: 'City of residence',
example: 'Lagos',
maxLength: 100,
})
@IsOptional()
@IsString()
@MaxLength(100)
city?: string;
@ApiPropertyOptional({
description: 'State or province',
example: 'Lagos State',
maxLength: 100,
})
@IsOptional()
@IsString()
@MaxLength(100)
state?: string;
@ApiPropertyOptional({
description: 'ZIP or postal code',
example: '100001',
maxLength: 20,
})
@IsOptional()
@IsString()
@MaxLength(20)
postalCode?: string;

@ApiPropertyOptional({
description: 'Highest degree obtained',
example: 'Bachelor of Science',
maxLength: 200,
})
@IsOptional()
@IsString()
@MaxLength(200)
highestEducation?: string;
@ApiPropertyOptional({
description: 'Major or field of study',
example: 'Computer Science',
maxLength: 200,
})
@IsOptional()
@IsString()
@MaxLength(200)
fieldOfStudy?: string;
@ApiPropertyOptional({
description: 'Name of institution',
example: 'University of Lagos',
maxLength: 255,
})
@IsOptional()
@IsString()
@MaxLength(255)
institutionName?: string;
@ApiPropertyOptional({
description: 'Year of graduation',
example: 2020,
minimum: 1950,
maximum: 2100,
})
@IsOptional()
@IsInt()
@Min(1950)
@Max(2100)
graduationYear?: number;
@ApiPropertyOptional({
description: 'Grade point average (0.00 - 4.00)',
example: 3.75,
minimum: 0,
maximum: 4,
})
@IsOptional()
@IsNumber({ maxDecimalPlaces: 2 })
@Min(0)
@Max(4)
gpa?: number;
@ApiPropertyOptional({
description: 'English proficiency test score (e.g., IELTS 7.5, TOEFL 100)',
example: 'IELTS 7.5',
maxLength: 50,
})
@IsOptional()
@IsString()
@MaxLength(50)
englishProficiency?: string;

@ApiPropertyOptional({
description: 'Professional work history',
example: 'Software Engineer at Tech Corp (2020-2023)',
})
@IsOptional()
@IsString()
workExperience?: string;
@ApiPropertyOptional({
description: 'LinkedIn profile URL',
example: 'https://www.linkedin.com/in/johndoe',
maxLength: 500,
})
@IsOptional()
@IsUrl()
@MaxLength(500)
linkedinUrl?: string;
@ApiPropertyOptional({
description: 'Personal portfolio URL',
example: 'https://johndoe.com',
maxLength: 500,
})
@IsOptional()
@IsUrl()
@MaxLength(500)
portfolioUrl?: string;
@ApiPropertyOptional({
description: 'Personal statement or bio',
example: 'Passionate about technology and innovation...',
})
@IsOptional()
@IsString()
bio?: string;
}