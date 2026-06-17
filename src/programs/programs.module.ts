import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { Program } from './entities/program.entity';
import { School } from '../schools/entities/school.entity';
import { Scholarship } from '../scholarship/entities/scholarship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Program, School, Scholarship])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
