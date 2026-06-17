import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { School } from './entities/school.entity';
import { Country } from '../scholarship/entities/country.entity';
import { Program } from '../programs/entities/program.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AcademicCalendarService } from './academic-calendar.service';
import { UniversitiesApiService } from './universities-api.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([School, Country, Program]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    CloudinaryModule,
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService, AcademicCalendarService, UniversitiesApiService],
  exports: [SchoolsService, AcademicCalendarService],
})
export class SchoolsModule {}
