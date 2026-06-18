import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { School } from '../schools/entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, School])],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
