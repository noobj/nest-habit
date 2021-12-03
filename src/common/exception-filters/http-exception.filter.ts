import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        console.log(exception);
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionRes: Record<string, any> | string = exception.getResponse();
        const message =
            typeof exceptionRes == 'object' ? exceptionRes['message'] : exceptionRes;

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            message: message
        });
    }
}
