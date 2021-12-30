import { User, DailySummary, Project } from './entities';
import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
    database: {
        type: 'mysql',
        host: process.env.TYPEORM_HOST || '127.0.0.1',
        port: +process.env.TYPEORM_PORT || 3306,
        database: 'test',
        username: process.env.DB_USER || 'linuxj', // fetch the main.yml setting for github actions
        password: process.env.DB_PASSWORD || '1234', // fetch the main.yml setting for github actions
        entities: [User, DailySummary, Project],
        synchronize: true,
        logging: false
    },
    redis: {
        host: '127.0.0.1',
        db: 14
    }
};
