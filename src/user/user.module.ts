import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { EmailModule } from '../email/email.module';
import { RoleSeeder } from 'src/database/role.seeder';
import { AdminSeeder } from 'src/database/admin.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    EmailModule, 
  ],
  controllers: [UsersController],
  providers: [UsersService, RoleSeeder, AdminSeeder],
  exports: [UsersService],
})
export class UsersModule {}