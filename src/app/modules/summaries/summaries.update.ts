import { Help, InjectBot, On, Message, Start, Update, Command } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

@Update()
export class SummariesUpdate {
    constructor(
        @InjectBot()
        private readonly bot: Telegraf
    ) {}

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
    onSub(ctx: Context): void {
        console.dir(ctx);
        ctx.reply('fuck');
        ctx.telegram.sendMessage(935973444, 'hell');
    }
}
