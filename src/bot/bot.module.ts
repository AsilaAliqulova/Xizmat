import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { SequelizeModule } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { BotUpdate } from "./bot.update";
import { MijozModule } from "../mijoz/mijoz.module";


@Module({
  imports: [SequelizeModule.forFeature([Bot]),MijozModule],
  providers: [BotService, BotUpdate],
  exports: [BotService,],
})
export class BotModule {}
