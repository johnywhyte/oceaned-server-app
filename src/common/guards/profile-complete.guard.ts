import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class ProfileCompleteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new BadRequestException('User not authenticated');
    }

    if (!user.profile || !user.profile.isComplete) {
      throw new BadRequestException(
        'Please complete your profile before creating an application',
      );
    }

    return true;
  }
}