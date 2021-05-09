import { NestFactory } from '@nestjs/core';
import { ArtisanModule } from './artisan.module';
import { TasksService } from './tasks/tasks.service';

async function bootstrap() {
    const application = await NestFactory.createApplicationContext(
        ArtisanModule
    );

    const command = process.argv[2];

    switch (command) {
        case 'FetchAndUpdateThirdParty':
            const tasksService = application.get(TasksService);
            await tasksService.syncWithToggl();
            break;
        default:
            console.log('Command not found');
            process.exit(1);
    }

    await application.close();
    process.exit(0);
}

bootstrap();
