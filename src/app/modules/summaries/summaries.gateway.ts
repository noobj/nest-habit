import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { WSExceptionsFilter } from 'src/common/exception-filters/ws-exception.filter';
import { UserDocument } from 'src/schemas/user.schema';

@WebSocketGateway()
export class SummariesGateway {
    constructor(@InjectQueue('summary') private readonly summaryQueue: Queue) {}

    @UseFilters(new WSExceptionsFilter())
    @UseGuards(AuthGuard('jwt'))
    @SubscribeMessage('sync')
    async onEvent(socket: Socket & { user: UserDocument }): Promise<void> {
        socket.join(`Room ${socket.user.id}`);
        await this.summaryQueue.add('sync', {
            user: socket.user,
            days: 365,
            socketId: socket.id
        });
    }
}
