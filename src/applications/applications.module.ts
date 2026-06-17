import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/applications.entity';
import { UserApplication } from './entities/user-application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, UserApplication]),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}