import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferredCourse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  startPeriod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  budgetRange?: string;
}
