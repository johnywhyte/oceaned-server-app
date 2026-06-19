import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { SchoolsModule } from '../schools/schools.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), SchoolsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
