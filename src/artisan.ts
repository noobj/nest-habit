import { NestFactory } from '@nestjs/core';
import { ArtisanModule } from './artisan.module';
import { CommandsService } from './app/console/commands.service';

async function bootstrap() {
    const application = await NestFactory.createApplicationContext(
        ArtisanModule
    );

    const command = process.argv[2];
    const commandsService = application.get(CommandsService);

    switch (command) {
        case 'syncToggl':
            await commandsService.syncWithToggl();
            break;
        default:
            console.log('Command not found');
            process.exit(1);
    }

    await application.close();
    process.exit(0);
}

bootstrap();
