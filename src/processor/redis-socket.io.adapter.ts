import { IoAdapter } from '@nestjs/platform-socket.io';
import * as redis from 'redis';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from 'socket.io-redis';
import { ServerOptions } from 'socket.io';

export class RedisSocketIoAdapter extends IoAdapter {
    private server;
    private redisClient;
    private configService: ConfigService;
    private subClient;

    constructor(server, app) {
        super(server);
        this.configService = app.get(ConfigService);
    }

    createIOServer(port: number, options?: ServerOptions): any {
        this.redisClient = redis.createClient({
            host: this.configService.get('redis.host'),
            db: this.configService.get('redis.db')
        });

        this.server = super.createIOServer(port, options);

        const pubClient = this.redisClient;
        this.subClient = pubClient.duplicate();
        const redisAdapter = createAdapter({ pubClient, subClient: this.subClient });

        this.server.adapter(redisAdapter);
        return this.server;
    }

    async close() {
        await new Promise<void>((resolve) => {
            this.redisClient.quit(() => {
                resolve();
            });
        });
        await new Promise<void>((resolve) => setImmediate(resolve));

        await new Promise<void>((resolve) => {
            this.subClient.quit(() => {
                resolve();
            });
        });
        // redis.quit() creates a thread to close the connection.
        // We wait until all threads have been run once to ensure the connection closes.
        await new Promise<void>((resolve) => setImmediate(resolve));
        this.server.close();
    }
}
