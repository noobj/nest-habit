import { IoAdapter } from '@nestjs/platform-socket.io';
import * as session from 'express-session';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import { ConfigService } from '@nestjs/config';
import { createAdapter } from 'socket.io-redis';
import { ServerOptions, Socket } from 'socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction } from 'express';
import { INestApplicationContext } from '@nestjs/common/interfaces/nest-application-context.interface';

const wrap = (middleware: any) => (socket: Socket, next: NextFunction) =>
    middleware(socket.request, {}, next);

export class RedisSessionIoAdapter extends IoAdapter {
    private server: INestApplicationContext | any;
    private redisClient: redis.RedisClient;
    private configService: ConfigService;
    private subClient: redis.RedisClient;

    constructor(server: INestApplicationContext | any, app: NestExpressApplication) {
        super(server);
        this.configService = app.get(ConfigService);
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const RedisStore = connectRedis(session);
        this.redisClient = redis.createClient({
            host: this.configService.get('redis.host'),
            db: this.configService.get('redis.db')
        });
        if (process.env.NODE_ENV === 'test') port = 3333;

        const option = {
            ...options,
            cors: {
                origin: [
                    'http://192.168.56.101:3000',
                    // 'http://192.168.56.101:3001',
                    // 'http://localhost:3001',
                    // 'http://127.0.0.1:3001',
                    'http://nest-habit.io'
                ],
                credentials: true
            },
            allowEIO3: true
        };

        this.server = super.createIOServer(port, option);
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
        this.server.use(
            (
                socket: Socket & {
                    session: session.Session;
                    request: { session: session.Session };
                },
                next: NextFunction
            ) => {
                socket.session = socket?.request?.session;
                next();
            }
        );

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
