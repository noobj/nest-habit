import { Help, InjectBot, Start, Update, Command } from 'nestjs-telegraf';
import { Context, Telegraf, deunionize } from 'telegraf';
import { Redis } from 'ioredis';

import { RedisService } from 'src/app/modules/redis';
import { UsersService } from 'src/app/modules/users/users.service';
import { NotificationService } from '../notification/notification.service';
import { Notification } from '../notification/notification.entity';
import { getCustomRepository } from 'typeorm';

@Update()
export class SummariesUpdate {
    private redisClient: Redis;

    constructor(
        @InjectBot()
        private readonly bot: Telegraf,
        private redisService: RedisService,
        private usersService: UsersService,
        private notificationService: NotificationService
    ) {
        this.redisClient = this.redisService.getClient();
        this.notificationService = getCustomRepository(NotificationService);
    }

    @Start()
    async onStart(): Promise<string> {
        const me = await this.bot.telegram.getMe();
        return `Hey, I'm ${me.first_name}`;
    }

    @Help()
    async onHelp(): Promise<string> {
        return 'Send me any text';
    }

    @Command('sub')
    async onSub(ctx: Context): Promise<void> {
        const regex = /\/sub (.*)/i;
        const text = deunionize(ctx.message)?.text.match(regex);
        const token = text === null ? null : text[1];
        const userIdFromRedis = await this.redisClient.get(`subtoken:${token}`);
        if (userIdFromRedis === null) {
            ctx.reply('Invalid token');
            return;
        }

        const user = await this.usersService.findOne(+userIdFromRedis);
        if (!user) {
            ctx.reply('User not found');
            return;
        }

        const notifyEntryId = await this.notificationService.findOne({
            where: {
                user: user
            }
        });

        const newEntry: Partial<Notification> = {
            user: user,
            notify_id: ctx.message.chat.id.toString()
        };

        if (notifyEntryId !== undefined) newEntry['id'] = notifyEntryId.id;

        await this.notificationService.save(newEntry);
        ctx.reply('Thanks for Subscribing');

        // delete token after subscribed
        await this.redisClient.del(`subtoken:${token}`);
    }
}
