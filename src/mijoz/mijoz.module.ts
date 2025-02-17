import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Mijoz } from './models/mijoz.model';
import { MijozService } from './mijoz.service';
import { MijozUpdate } from './mijoz.update';
import { BotModule } from '../bot/bot.module';
import { Bot } from '../bot/models/bot.model';
import { BotService } from '../bot/bot.service';

@Module({
  imports:[SequelizeModule.forFeature([Mijoz,Bot])],
  providers: [MijozService,BotService,MijozUpdate],
  exports:[MijozService]
})
export class MijozModule {}
