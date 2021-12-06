import { NestFactory } from '@nestjs/core';
import { CommandsService } from './app/console/commands.service';
import { CommandsModule } from './app/console/commands.module';

async function bootstrap() {
    const command = process.argv[2];

    const options = {
        command: command,
        argv: process.argv.slice(3)
    };

    const application = await NestFactory.createApplicationContext(
        CommandsModule.register(options),
        { logger: ['verbose'] }
    );

    const commandsService = application.get(CommandsService);
    try {
        await commandsService.runCommand();
    } catch (e) {
        console.log(e);
    }

    await application.close();
    process.exit(0);
}

bootstrap();
