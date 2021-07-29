import { IoAdapter } from '@nestjs/platform-socket.io';
import * as session from 'express-session';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from 'socket.io-redis';
import { ServerOptions } from 'socket.io';

const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

export class RedisSessionIoAdapter extends IoAdapter {
    private server;
    private redisClient;
    private configService: ConfigService;
    private subClient;
    private mode;

    constructor(app, mode: string) {
        super(app);
        this.configService = app.get(ConfigService);
        this.mode = mode;
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const RedisStore = connectRedis(session);
        this.redisClient = redis.createClient({ db: this.configService.get('redis.db') });
        port = this.configService.get(`socket.${this.mode}`);
        if (process.env.NODE_ENV === 'test') port = 3333;

        this.server = super.createIOServer(port, options);
        if (this.mode == 'main') {
            this.server.use(
                wrap(
                    session({
                        store: new RedisStore({ client: this.redisClient }),
                        secret: 'secret',
                        resave: false,
                        saveUninitialized: false
                    })
                )
            );

            // extract session from request
            this.server.use((socket, next) => {
                socket.session = socket?.request?.session;
                next();
            });
        }

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
