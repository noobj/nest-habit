import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebSocketGateway, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { WSExceptionsFilter } from 'src/common/exception-filters/ws-exception.filter';
import { User } from '../users';

@WebSocketGateway()
export class SummariesGateway {
    constructor(@InjectQueue('summary') private readonly summaryQueue: Queue) {}

    @WebSocketServer()
    server: Server;

    @UseFilters(new WSExceptionsFilter())
    @UseGuards(AuthGuard('jwt'))
    @SubscribeMessage('sync')
    async onEvent(socket: Socket & { user: Partial<User> }, data): Promise<void> {
        socket.join(`Room ${socket.user.id}`);
        await this.summaryQueue.add('sync', {
            user: socket.user,
            days: 365,
            socketId: socket.id
        });
    }
}
