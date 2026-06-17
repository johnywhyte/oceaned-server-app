import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/entities/role.entity';
import { LocalStrategy } from 'src/auth/strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from 'src/common/strategies/jwt-refresh.strategy';
import { EmailModule } from 'src/email/email.module';
import { StringValue } from 'ms';
import { UsersService } from 'src/user/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
          }
        const expiresIn =
          (configService.get<StringValue>('JWT_EXPIRES_IN') as StringValue) ||
          ('7d' as StringValue);

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
    UsersService,
  ],
  exports: [AuthService],
})
export class AuthModule {}