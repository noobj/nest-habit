import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { CommandsService } from './commands.service';
import { SummariesModule } from '../modules/summaries';
import configuration, { configs } from 'src/config/console.config';
import { SocketServerModule } from 'src/app/modules/socket-server/socket-server.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({})
class IntermediateModule {
    public static async loadCommandModule(commandName: string): Promise<DynamicModule> {
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

    static async register(options: {
        command: string;
        argv: string[];
    }): Promise<DynamicModule> {
        const service = await this.fetchTheService(options.command);

        return {
            imports: [
                MongooseModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => {
                        let url = '';
                        if (configService.get('mongo.user') == undefined)
                            url = `${configService.get(
                                'mongo.prefix'
                            )}://${configService.get('mongo.host')}/${configService.get(
                                'mongo.database'
                            )}`;
                        else
                            url = `${configService.get(
                                'mongo.prefix'
                            )}://${configService.get('mongo.user')}:${configService.get(
                                'mongo.password'
                            )}@${configService.get('mongo.host')}/${configService.get(
                                'mongo.database'
                            )}`;

                        return {
                            loggerLevel: 'debug',
                            uri: url
                        };
                    }
                }),
                // TODO: try to remove this
                TelegrafModule.forRoot({
                    token: configs.telegram.bot_api_key
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
                }),
                SocketServerModule
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
