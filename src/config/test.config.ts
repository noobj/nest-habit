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
