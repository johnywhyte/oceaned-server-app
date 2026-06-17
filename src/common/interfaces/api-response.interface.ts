export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  error?: string;
  errors?: any[];
  timestamp?: string;
}