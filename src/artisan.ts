import { NestFactory } from '@nestjs/core';
import { CommandsService } from './app/console/commands.service';
import { CommandsModule } from './app/console/commands.module';

async function bootstrap() {
    let command = process.argv[2];
    command = command.charAt(0).toUpperCase() + command.slice(1);

    const application = await NestFactory.createApplicationContext(
        CommandsModule.register(command)
    );

    const commandsService = application.get(CommandsService);
    await commandsService.runCommand();

    await application.close();
    process.exit(0);
}

bootstrap();
