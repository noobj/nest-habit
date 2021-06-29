export default () => ({
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
        logging: process.env.TYPEORM_LOGGING === 'true' || false,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'secret',
        expiration_time: process.env.JWT_EXPIRATION_TIME || 3600,
        refresh_secret: process.env.JWT_REFRESH_TOKEN_SECRET || 'secret',
        refresh_expiration_time: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || 360000,
    },
    session: {
        secret: process.env.SESSION_SECRET || 'secret',
    },
    toggl: {
        token: process.env.TOGGL_TOKEN || 'null',
    },
});
