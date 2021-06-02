export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        type: 'mysql',
        host: process.env.TYPEORM_HOST || '127.0.0.1',
        port: process.env.TYPEORM_PORT || 3306,
        database: 'test',
        username: process.env.TEST_DB_USERNAME || 'linuxj',
        password: process.env.TEST_DB_PASSWORD || '1234',
        entities: process.env.TYPEORM_ENTITIES,
        synchronize: false,
        logging: false,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'secret',
        expiration_time: process.env.JWT_EXPIRATION_TIME || 3600,
    },
    session: {
        secret: process.env.SESSION_SECRET || 'secret',
    },
    toggl: {
        token: process.env.TOGGL_TOKEN || 'null',
    },
});