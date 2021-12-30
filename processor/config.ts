import { User, DailySummary, Project } from './entities';
import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
    database: {
        type: process.env.TYPEORM_CONNECTION || 'mysql',
        host: process.env.TYPEORM_HOST || '127.0.0.1',
        port: process.env.TYPEORM_PORT || 3306,
        username: process.env.TYPEORM_USERNAME || 'root',
        password: process.env.TYPEORM_PASSWORD || 'root',
        database: process.env.TYPEORM_DATABASE || 'test',
        entities: [User, DailySummary, Project] || null,
        synchronize: false,
        logging: process.env.TYPEORM_LOGGING === 'true' || false
    },
    redis: {
        host: '127.0.0.1',
        db: 14
    }
};
