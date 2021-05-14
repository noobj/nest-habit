import { NestFactory } from '@nestjs/core';
import { CommandsService } from './app/console/commands.service';
import { CommandsModule } from './app/console/commands.module';

async function bootstrap() {
    let command = process.argv[2];

    // capitalize the arg
    command = command.charAt(0).toUpperCase() + command.slice(1);

    const options = {
        command: command,
        argv: process.argv.slice(3),
    };

    const application = await NestFactory.createApplicationContext(
        CommandsModule.register(options)
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
