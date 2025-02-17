import { Update, Ctx, Start, On, Hears, Command } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { MijozService } from "./mijoz.service";

@Update()
export class MijozUpdate {
  constructor(private readonly botService: MijozService) {}

  @Hears("Mijoz")
  async onCustomerRegister(@Ctx() ctx: Context) {
    await this.botService.registerCustomer(ctx);
  }

  @Hears("📄 Ma'lumotlarim")
  async onViewCustomerInfo(@Ctx() ctx: Context) {
    await this.botService.viewCustomerInfo(ctx);
  }

  @Hears("⚙️ Ma'lumotlarni o‘zgartirish")
  async onEditCustomerInfo(@Ctx() ctx: Context) {
    await ctx.reply("📋 O'zgartirmoqchi bo'lgan ma'lumotni tanlang:", {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📞 Telefonni o‘zgartirish", "edit_phone")],
        [Markup.button.callback("📍 Manzilni o‘zgartirish", "edit_address")],
      ]),
    });
  }

  @On("callback_query")
  async onCallback(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || typeof callbackQuery !== "object") {
      return;
    }

    const callbackData = "data" in callbackQuery ? callbackQuery.data : null;
    if (!callbackData) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    if (callbackData === "edit_phone") {
      await ctx.reply("📞 Yangi telefon raqamingizni kiriting:");
      this.botService.userSteps.set(userId, 1);
    }

    // ✅ Manzilni o‘zgartirish
    if (callbackData === "edit_address") {
      await ctx.reply("📍 Yangi manzilingizni kiriting:");
      this.botService.userSteps.set(userId, 2);
    }

    // ✅ Xizmat tanlash tugmachalarini ushlash
    if (callbackData.startsWith("service_")) {
      const selectedService = callbackData.replace("service_", "");
      await ctx.reply(`✅ Siz "${selectedService}" xizmatini tanladingiz.`);
    }

    await ctx.answerCbQuery();
  }

  @Hears("🔍 Xizmatlar")
  async onShowServices(@Ctx() ctx: Context) {
    console.log(655555);

    await this.botService.showServices(ctx);
  }
}
