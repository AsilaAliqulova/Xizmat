import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";
import { BOT_NAME } from "./app.constants";
import { BotModule } from './bot/bot.module';
import { Bot } from "./bot/models/bot.model";
import { session } from "telegraf";
import { MijozModule } from './mijoz/mijoz.module';
import { AdminModule } from './admin/admin.module';
import { Mijoz } from "./mijoz/models/mijoz.model";
import { Admin } from "./admin/models/admin.model";


@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN || "1234",
        middlewares: [session()],
        include: [BotModule],
      }),
    }),
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: "postgres",
      host: process.env.POSTGRES_HOST,
      username: process.env.POSTGRES_USER,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [Bot,Mijoz,Admin],
      autoLoadModels: true,
      sync: { alter: true },
      logging: false,
    }),
    BotModule,
    MijozModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
