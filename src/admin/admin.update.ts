import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';


@Update()
export class AdminUpdate {
  constructor(private readonly adminService: AdminService) {}
  @Command("/admin")
  async AdminShow(@Ctx() ctx: Context) {
    await this.adminService.showAdminPanel(ctx);
  }
}
