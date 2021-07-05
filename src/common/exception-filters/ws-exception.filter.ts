import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class WSExceptionsFilter extends BaseWsExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        const status = exception?.status;
        const message = exception?.response?.message;

        client.emit('exception', { status, message });
    }
}
