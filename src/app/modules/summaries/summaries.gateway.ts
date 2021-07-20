import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WebSocketGateway, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { WSExceptionsFilter } from 'src/common/exception-filters/ws-exception.filter';

@WebSocketGateway(3002)
export class SummariesGateway {
    constructor(@InjectQueue('summary') private readonly summaryQueue: Queue) {}

    @WebSocketServer()
    server: Server;

    @UseFilters(new WSExceptionsFilter())
    @UseGuards(AuthGuard('jwt'))
    @SubscribeMessage('sync')
    async onEvent(socket, data): Promise<void> {
        await this.summaryQueue.add('sync', {
            user: socket.user,
            project: data.projectName,
            socketId: socket.id
        });
    }
}
