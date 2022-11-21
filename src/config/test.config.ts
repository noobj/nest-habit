import { User } from 'src/app/modules/users/users.entity';
import { DailySummary } from 'src/app/modules/summaries/entities/daily_summary.entity';
import { Project } from 'src/app/modules/summaries/entities/project.entity';

export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        type: 'mysql',
        host: process.env.TYPEORM_HOST || '127.0.0.1',
        port: process.env.TYPEORM_PORT || 3306,
        database: 'test',
        username: process.env.DB_USER || 'linuxj', // fetch the main.yml setting for github actions
        password: process.env.DB_PASSWORD || '1234', // fetch the main.yml setting for github actions
        entities: [User, DailySummary, Project],
        synchronize: true,
        logging: false
    },
    mongo: {
        prefix: process.env.MONGO_PREFIX || 'mongodb',
        // user: process.env.MONGO_USER || 'jjj',
        // password: process.env.MONGO_PASSWORD || '1234',
        host: process.env.MONGO_HOST || '127.0.0.1',
        database: 'test'
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
        host: '127.0.0.1',
        db: 14
    },
    aws: {
        s3: {
            key_id: process.env.AWS_S3_KEY_ID,
            secret: process.env.AWS_S3_SECRET_KEY
        }
    }
});
