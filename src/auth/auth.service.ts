import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload as GoogleTokenPayload } from 'google-auth-library';
import * as crypto from 'crypto';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/entities/role.entity';
import { EmailService } from '../email/email.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponse, TokenPayload } from 'src/common/interfaces/auth-response.interface';
import { UsersService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly userService: UsersService,
  ) {}

  async createUser(registerUserDto: RegisterUserDto, token?: string): Promise<User> {
    const userCount = await this.userRepository.count();

    if (userCount > 0) {
      if (!token) {
        throw new UnauthorizedException('System already initialized. A Superadmin token is required.');
      }

      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });

        if (payload.role !== 'SUPER_ADMIN') {
          throw new UnauthorizedException('Only a SUPER_ADMIN can register new users.');
        }
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired Superadmin token.');
      }
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: registerUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const role = await this.roleRepository.findOne({
      where: { id: registerUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${registerUserDto.roleId} not found`);
    }

    const user = this.userRepository.create({
      ...registerUserDto,
      role, 
    });

    const savedUser = await this.userRepository.save(user);

    await this.emailService.sendWelcomeEmail(
      savedUser.email,
      savedUser.firstName,
    );

    return savedUser;
  }

  /**
   * Public self-service registration. Always creates a STUDENT account and
   * returns auth tokens so the user is logged in immediately.
   */
  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const studentRole = await this.roleRepository.findOne({
      where: { name: 'STUDENT' },
    });
    if (!studentRole) {
      throw new NotFoundException('STUDENT role is not configured.');
    }

    const user = this.userRepository.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber ?? null,
      country: dto.country ?? null,
      role: studentRole,
    });

    const savedUser = await this.userRepository.save(user);
    // Fire-and-forget: never block signup on email delivery (SMTP may be
    // unconfigured or slow, which previously caused the request to hang).
    this.emailService
      .sendWelcomeEmail(savedUser.email, savedUser.firstName)
      .catch((err) =>
        this.logger.warn(`Welcome email failed: ${(err as Error).message}`),
      );

    const userWithRole = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });
    const tokens = await this.generateTokens(userWithRole!);
    return { user: userWithRole!, ...tokens };
  }

  /**
   * Sign in (or sign up) a user via a Google ID token. Verifies the token with
   * Google, then finds or creates a STUDENT account. No password is set for
   * Google-only accounts.
   */
  async googleAuth(idToken: string): Promise<AuthResponse> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException(
        'Google sign-in is not configured on the server.',
      );
    }

    const client = new OAuth2Client(clientId);
    let payload: GoogleTokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token.');
    }
    if (!payload?.email) {
      throw new UnauthorizedException('Google token has no email.');
    }

    let user = await this.userRepository.findOne({
      where: { email: payload.email },
      relations: ['role'],
    });

    if (!user) {
      const studentRole = await this.roleRepository.findOne({
        where: { name: 'STUDENT' },
      });
      if (!studentRole) {
        throw new NotFoundException('STUDENT role is not configured.');
      }
      const created = this.userRepository.create({
        email: payload.email,
        password: null,
        firstName: payload.given_name ?? payload.name ?? 'Student',
        lastName: payload.family_name ?? '',
        avatarUrl: payload.picture ?? null,
        googleId: payload.sub,
        role: studentRole,
      });
      const saved = await this.userRepository.save(created);
      user = await this.userRepository.findOne({
        where: { id: saved.id },
        relations: ['role'],
      });
    } else if (!user.googleId) {
      // Link Google to an existing email account.
      user.googleId = payload.sub;
      if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
      await this.userRepository.save(user);
    }

    const tokens = await this.generateTokens(user!);
    return { user: user!, ...tokens };
  }

  /** Update the recommendation preferences for the authenticated user. */
  async updatePreferences(
    userId: number,
    prefs: {
      preferredCountry?: string | null;
      preferredCourse?: string | null;
      preferredDegreeType?: string | null;
      budgetRange?: string | null;
    },
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found.');
    Object.assign(user, prefs);
    await this.userRepository.save(user);
    return user;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    
    if (user && await user.validatePassword(pass)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  async getMe(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: Number(payload.sub) },
        relations: ['role'],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(user);

      return {
        user,
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await user.validatePassword(changePasswordDto.currentPassword);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);

    await this.emailService.sendPasswordChangedEmail(user.email, user.firstName);

    return { message: 'Password changed successfully' };
  }


  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return { message: 'If email exists, a 6-digit reset token has been sent' };
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await this.userRepository.save(user);

    // Fire-and-forget so an unconfigured/slow SMTP never blocks the request.
    this.emailService
      .sendPasswordResetEmail(user.email, user.firstName, resetToken)
      .catch((err) =>
        this.logger.warn(`Reset email failed: ${(err as Error).message}`),
      );

    // When email isn't configured (local/dev), surface the token so the reset
    // flow is still usable. Never exposed once SMTP is set (e.g. production).
    const emailConfigured = !!process.env.SMTP_HOST;
    return {
      message: 'If email exists, a 6-digit reset token has been sent',
      ...(emailConfigured ? {} : { devToken: resetToken }),
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = resetPasswordDto.newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;

    await this.userRepository.save(user);

    await this.emailService.sendPasswordResetConfirmation(user.email, user.firstName);

    return { message: 'Password reset successful' };
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
  const userRole = typeof user.role === 'object' ? user.role.name : user.role;

  const payload: TokenPayload = {
    sub: user.id, 
    email: user.email,
    role: userRole, 
  };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h',
    }),
    this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    }),
  ]);

  return { accessToken, refreshToken };
}
}