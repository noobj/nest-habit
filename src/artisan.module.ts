import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandsModule } from './app/console/commands.module';
import configuration from './config/configuration';

@Module({
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
        CommandsModule,
        ConfigModule.forRoot({ load: [configuration] }),
    ],
})
export class ArtisanModule {}
