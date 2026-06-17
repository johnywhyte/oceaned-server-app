import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the response already has the expected structure, return as-is
        if (
          responseData &&
          typeof responseData === 'object' &&
          'success' in responseData
        ) {
          return responseData;
        }

        // If the response has data and meta (paginated), wrap accordingly
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData &&
          'meta' in responseData
        ) {
          return {
            success: true,
            message: 'Success',
            data: responseData.data,
            meta: responseData.meta,
          };
        }

        return {
          success: true,
          message: 'Success',
          data: responseData,
        };
      }),
    );
  }
}
