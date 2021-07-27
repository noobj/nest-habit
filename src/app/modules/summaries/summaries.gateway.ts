import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebSocketGateway, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { WSExceptionsFilter } from 'src/common/exception-filters/ws-exception.filter';
import { User } from '../users';

@WebSocketGateway(3002, {
    cors: {
        origin: [
            'http://192.168.56.101:3000',
            'http://192.168.56.101:3001',
            'http://localhost:3001',
            'http://127.0.0.1:3001'
        ],
        credentials: true
    },
    allowEIO3: true
})
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
            project: data.projectName,
            socketId: socket.id
        });
    }
}
