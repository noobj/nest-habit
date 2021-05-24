import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommandsService } from './commands.service';
import { SummariesModule } from '../modules/summaries';
import configuration from 'src/config/configuration';

@Module({})
class IntermediateModule {
    public static async loadCommandModule(commandName): Promise<DynamicModule> {
        commandName = commandName.charAt(0).toLowerCase() + commandName.slice(1);

        const moduleName = this.convertToFileFormat(commandName);
        const filePath = `./modules/${moduleName}/${moduleName}.module`;
        let module;
        try {
            module = await import(filePath);

            return {
                module: IntermediateModule,
                imports: [module.default],
                exports: [module.default],
            };
        } catch (err) {
            console.log(`Command [${commandName}] doesn't exist`);
            process.exit(1);
        }
    }

    private static convertToFileFormat(name: string): string {
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
    static register(options): DynamicModule {
        // capitalize the arg
        const commandName = options.command.charAt(0).toUpperCase() + options.command.slice(1);
        const serviceName = commandName + 'Service';

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
                        entities: [configService.get('database.entities')],
                        synchronize: configService.get<boolean>('database.synchronize'),
                        logging: configService.get<boolean>('database.logging'),
                    }),
                }),
                SummariesModule,
                ConfigModule.forRoot({ load: [configuration] }),
                IntermediateModule.loadCommandModule(options.command),
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
                {
                    provide: 'ARGV',
                    useValue: options.argv,
                },
                CommandsService,
            ],
            exports: [CommandsService],
        };
    }
}
