import 'dotenv/config';

const configfactory = () => ({
    node_env: process.env.NODE_ENV || 'dev',
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        type: process.env.TYPEORM_CONNECTION || 'mysql',
        host: process.env.TYPEORM_HOST || '127.0.0.1',
        port: process.env.TYPEORM_PORT || 3306,
        username: process.env.TYPEORM_USERNAME || 'root',
        password: process.env.TYPEORM_PASSWORD || 'root',
        database: process.env.TYPEORM_DATABASE || 'test',
        entities: [process.env.TYPEORM_ENTITIES] || null,
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true' || false
    },
    mongo: {
        prefix: process.env.MONGO_PREFIX || 'mongodb',
        user: process.env.MONGO_USER || 'jjj',
        password: process.env.MONGO_PASSWORD || '1234',
        host: process.env.MONGO_HOST || '127.0.0.1'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'secret',
        expiration_time: process.env.JWT_EXPIRATION_TIME || 3600,
        refresh_secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'secret',
        refresh_expiration_time: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || 360000
    },
    session: {
        secret: process.env.SESSION_SECRET || 'secret'
    },
    toggl: {
        token: process.env.TOGGL_TOKEN || 'null'
    },
    redis: {
        host: process.env.REDIS_HOST || process.env.REDIS_SERVICE_HOST || '127.0.0.1',
        db: 0
    },
    socket: {
        main: 3002,
        sub: 3003
    },
    aws: {
        s3: {
            key_id: process.env.AWS_S3_KEY_ID,
            secret: process.env.AWS_S3_SECRET_KEY
        }
    },
    telegram: {
        bot_enable: false,
        bot_api_key: process.env.TELEGRAM_BOT_API_KEY || null
    }
});

export default configfactory;

export const configs = configfactory();
