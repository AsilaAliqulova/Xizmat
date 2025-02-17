import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Admin } from './models/admin.model';

@Module({
  imports:[SequelizeModule.forFeature([Admin])],
  providers: [AdminService],
  exports:[AdminService]
})
export class AdminModule {}
