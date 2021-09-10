import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { CommandsService } from './commands.service';
import { SummariesModule } from '../modules/summaries';
import configuration from 'src/config/configuration';

@Module({})
class IntermediateModule {
    public static async loadCommandModule(commandName): Promise<DynamicModule> {
        commandName = commandName.charAt(0).toLowerCase() + commandName.slice(1);

        const moduleName = this.convertToFileFormat(commandName);
        const filePath = `./modules/${moduleName}/${moduleName}.module`;
        try {
            const module = await import(filePath);

            return {
                module: IntermediateModule,
                imports: [module.default],
                exports: [module.default]
            };
        } catch (err) {
            console.log(`Command [${commandName}] doesn't exist`);
            process.exit(1);
        }
    }

    public static convertToFileFormat(name: string): string {
        return name
            .split('')
            .map((c) => {
                return c === c.toUpperCase() ? `-${c.toLowerCase()}` : c;
            })
            .join('');
    }
}

@Module({})
export class CommandsModule {
    static async fetchTheService(commandName: string): Promise<any> {
        commandName = commandName.charAt(0).toLowerCase() + commandName.slice(1);
        const serviceName =
            commandName.charAt(0).toUpperCase() + commandName.slice(1) + 'Service';
        const moduleName = IntermediateModule.convertToFileFormat(commandName);
        const filePath = `./modules/${moduleName}/${moduleName}.service`;
        let service = await import(filePath);
        service = service[serviceName];

        return service;
    }

    static async register(options): Promise<DynamicModule> {
        const service = await this.fetchTheService(options.command);

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
                        password: configService.get<string>('database.password'),
                        database: configService.get<string>('database.database'),
                        entities: configService.get('database.entities'),
                        synchronize: configService.get<boolean>('database.synchronize'),
                        logging: configService.get<boolean>('database.logging')
                    })
                }),
                SummariesModule,
                ConfigModule.forRoot({ load: [configuration] }),
                IntermediateModule.loadCommandModule(options.command),
                WinstonModule.forRoot({
                    transports: [
                        new winston.transports.Console({
                            format: winston.format.combine(
                                winston.format.timestamp(),
                                winston.format.ms(),
                                nestWinstonModuleUtilities.format.nestLike()
                            )
                        })
                    ]
                })
            ],
            module: CommandsModule,
            providers: [
                {
                    provide: 'COMMAND',
                    useFactory: async (service) => {
                        return service;
                    },
                    inject: [service]
                },
                {
                    provide: 'ARGV',
                    useValue: options.argv
                },
                CommandsService
            ],
            exports: [CommandsService]
        };
    }
}
