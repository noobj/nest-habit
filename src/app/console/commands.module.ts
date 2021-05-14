import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommandsService } from './commands.service';
import { SummariesModule } from '../modules/summaries';
import { SyncTogglModule } from './modules/sync-toggl';
import configuration from 'src/config/configuration';

@Module({})
export class CommandsModule {
    static register(options): DynamicModule {
        const serviceName = options + 'Service';

        return {
            imports: [
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: async (configService: ConfigService) => ({
                        type: configService.get('database.type') as 'mysql',
                        host: configService.get('database.host'),
                        port: configService.get('database.port'),
                        username: configService.get('database.username'),
                        password: configService.get<string>(
                            'database.password'
                        ),
                        database: configService.get<string>(
                            'database.database'
                        ),
                        entities: [configService.get('database.entities')],
                        synchronize: configService.get<boolean>(
                            'database.synchronize'
                        ),
                        logging: configService.get<boolean>('database.logging'),
                    }),
                }),
                SummariesModule,
                ConfigModule.forRoot({ load: [configuration] }),
                SyncTogglModule,
            ],
            module: CommandsModule,
            providers: [
                {
                    provide: 'COMMAND',
                    useFactory: async (service) => {
                        return service;
                    },
                    inject: [serviceName],
                },
                CommandsService,
            ],
            exports: [CommandsService],
        };
    }
}
