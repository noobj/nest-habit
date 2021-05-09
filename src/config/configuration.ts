export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
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
