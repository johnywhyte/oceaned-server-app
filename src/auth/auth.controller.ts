import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors, 
  ClassSerializerInterceptor,
  Req 
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterUserDto} from './dto/register-user.dto';
import { SignupDto } from './dto/signup.dto';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import{ForgotPasswordDto} from './dto/forgot-password.dto'; 
import { ResetPasswordDto} from './dto/reset-password.dto'; 
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor) 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

@Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new user',
    description: 'First user registers freely. All others require a SUPER_ADMIN token.',
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(
    @Body() createUserDto: RegisterUserDto,
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : undefined;
    const user = await this.authService.createUser(createUserDto, token);
    
    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  @Public()
  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Student self-registration',
    description:
      'Public sign-up. Always creates a STUDENT account and returns auth tokens.',
  })
  @ApiResponse({ status: 201, description: 'Account created and logged in.' })
  async signup(@Body() signupDto: SignupDto) {
    const result = await this.authService.signup(signupDto);
    return {
      success: true,
      message: 'Account created successfully',
      data: result,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('google')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in / sign up with a Google ID token' })
  async google(@Body() body: { idToken: string }) {
    const result = await this.authService.googleAuth(body.idToken);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update study-abroad recommendation preferences' })
  async updatePreferences(
    @CurrentUser() user: any,
    @Body()
    body: {
      preferredCountry?: string | null;
      preferredCourse?: string | null;
      preferredDegreeType?: string | null;
      budgetRange?: string | null;
    },
  ) {
    const updated = await this.authService.updatePreferences(user.id, body);
    return {
      success: true,
      message: 'Preferences updated',
      data: updated,
    };
  }

  
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: any) {
    const currentUser = await this.authService.getMe(user.id);
    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: currentUser,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return {
      success: true,
      message: result.message,
      ...(('devToken' in result && result.devToken)
        ? { devToken: result.devToken }
        : {}),
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return { success: true, message: result.message };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(user.id, changePasswordDto);
    return { success: true, message: result.message };
  }
}