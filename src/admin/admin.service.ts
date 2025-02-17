import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Admin } from './models/admin.model';
import { InjectBot } from 'nestjs-telegraf';
import { BOT_NAME } from '../app.constants';
import { Context, Markup, Telegraf } from 'telegraf';


@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
  ) {}

  async showAdminPanel(ctx: Context) {
    console.log(55555555);
    
    await ctx.reply(" Admin paneliga xush kelibsiz!", {
      parse_mode: "HTML",
      ...Markup.keyboard([
        ["📋 Foydalanuvchilar ro'yxati"],
        ["➕ Yangi foydalanuvchi qo'shish", "🗑 Foydalanuvchini o'chirish"],
      ])
        .resize()
        .oneTime(),
    });
  }
}
