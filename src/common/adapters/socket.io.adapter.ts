import { IoAdapter } from '@nestjs/platform-socket.io';
import * as session from 'express-session';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import { ConfigService } from '@nestjs/config';

const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
export class SocketIoAdapter extends IoAdapter {
    private server;
    private redisClient;
    private configService: ConfigService;
    constructor(app) {
        super(app);
        this.configService = app.get(ConfigService);
    }

    createIOServer(port: number, options?: any): any {
        const RedisStore = connectRedis(session);
        this.redisClient = redis.createClient({ db: this.configService.get('redis.db') });
        if (process.env.NODE_ENV === 'test') port = 3333;

        this.server = super.createIOServer(port, options);
        this.server.use(
            wrap(
                session({
                    store: new RedisStore({ client: this.redisClient }),
                    secret: 'secret',
                    resave: false,
                    saveUninitialized: false,
                })
            )
        );

        // extract session from request
        this.server.use((socket, next) => {
            socket.session = socket?.request?.session;
            next();
        });
        return this.server;
    }

    async close() {
        await new Promise<void>((resolve) => {
            this.redisClient.quit(() => {
                resolve();
            });
        });
        // redis.quit() creates a thread to close the connection.
        // We wait until all threads have been run once to ensure the connection closes.
        await new Promise<void>((resolve) => setImmediate(resolve));
        this.server.close();
    }
}
