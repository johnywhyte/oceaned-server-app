import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scholarship } from './entities/scholarship.entity';
import { Country } from './entities/country.entity';
import { DegreeType } from './entities/degree-type.entity';
import { FieldOfStudy } from './entities/field-of-study.entity';
import { Program } from '../programs/entities/program.entity';
import { ScholarshipRepository } from './scholarship.repository';
import { ScholarshipService } from './scholarship.service';
import { ScholarshipController } from './scholarship.controller';
import { ScholarshipAdminController } from './scholarship-admin.controller';
import { SavedScholarship } from './entities/saved-schol.entity';
import { ScholarshipApplication } from './entities/schol-application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Scholarship,
      SavedScholarship,
      ScholarshipApplication,
      Country,
      DegreeType,
      FieldOfStudy,
      Program,
    ]),
  ],
  controllers: [ScholarshipController, ScholarshipAdminController],
  providers: [ScholarshipRepository, ScholarshipService],
  exports: [ScholarshipService],
})
export class ScholarshipModule {}
