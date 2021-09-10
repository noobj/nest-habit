import { Module, Global } from '@nestjs/common';
import { SocketServerGateway } from './socket-server.gateway';

@Global()
@Module({
    imports: [],
    providers: [SocketServerGateway],
    exports: [SocketServerGateway]
})
export class SocketServerModule {}
