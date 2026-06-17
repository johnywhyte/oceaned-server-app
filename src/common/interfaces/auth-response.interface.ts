import { User } from 'src/user/entities/user.entity';

export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  sub: number; 
  email: string;
  role: string;
}