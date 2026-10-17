import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): any {
    return (next.handle().pipe(
      map((res: any) => {
        // If response already matches standard format, return as is
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        let message = 'Success';
        let data = res;

        if (res && typeof res === 'object' && 'message' in res && 'data' in res) {
          message = res.message;
          data = res.data;
        }

        return {
          success: true,
          data,
          message,
        };
      }) as any,
    ) as any);
  }
}
