import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/applications.entity';
import { UserApplication } from './entities/user-application.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, UserApplication, User, Role]),
    EmailModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}