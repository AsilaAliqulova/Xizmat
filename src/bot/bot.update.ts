import {
  Update,
  Ctx,
  Start,
  On,
  Hears,
  Command,
  InjectBot,
} from "nestjs-telegraf";
import { Context, Telegraf } from "telegraf";
import { BotService } from "./bot.service";
import { BOT_NAME } from "../app.constants";
import { MijozService } from "../mijoz/mijoz.service";

@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly mijozService: MijozService,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }
  @Command("stop")
  async onStop(@Ctx() ctx: Context) {
    await this.botService.onStop(ctx);
  }

  @Command("admin")
  async showAdminPanel(@Ctx() ctx: Context) {
    await this.botService.showAdminPanel(ctx);
  }

  @Hears(["📋 Foydalanuvchilar ro'yxati"])
  async AllUser(@Ctx() ctx: Context) {
    await this.botService.listUsers(ctx);
  }

  @Hears(["Usta", "Mijoz"])
  async onRoleSelection(@Ctx() ctx: Context) {
    await this.botService.onRoleSelection(ctx);
  }

  @Hears(["✅ Tasdiqlash"])
  async CheckAdmin(@Ctx() ctx: Context) {
    console.log("✅ Tasdiqlash tugmasi bosildi!");
    await ctx.reply("✅ Tasdiqlash so'rovi qabul qilindi.");
    await this.botService.sendToAdminForApproval(ctx, ctx.from!.id);
  }

  @Hears(["✅ Qabul qilish"])
  async QabulQilish(@Ctx() ctx: Context) {
    
    await ctx.reply("✅ Tasdiqlash so'rovi qabul qilindi.");
    await this.botService.confirmData(ctx);
  }

  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    await this.botService.OnContact(ctx);
  }

  @On("location")
  async onLocation(@Ctx() ctx: Context) {
    await this.botService.handleLocation(ctx);
  }

  @On("callback_query")
  async onCallback(@Ctx() ctx: Context) {
    const callbackQuery = ctx.callbackQuery;

    if (!callbackQuery || !("data" in callbackQuery)) {
      await ctx.reply("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      return;
    }

    const callbackData = callbackQuery.data;

    if (callbackData === "confirm_data") {
      await this.botService.confirmData(ctx);
    } else if (callbackData === "cancel_data") {
      await this.botService.cancelData(ctx);
    } else {
      await this.botService.onSpecialtySelection(ctx);
    }

    await ctx.answerCbQuery();
  }

  @On("text")
  async onText(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) {
      console.log("User ID is missing in onText.");
      return;
    }

    if (!ctx.message || !("text" in ctx.message)) {
      console.log(`User ${userId} sent a non-text message.`);
      await ctx.reply("🚫 Iltimos, faqat matnli xabar yuboring.");
      return;
    }

    const text = ctx.message.text.trim();
    console.log(`User ${userId} sent message: ${text}`);

    // 1️⃣ Foydalanuvchini bazadan topish
    let user = await this.botService.findUserById(userId);
    console.log(`User ${userId} found:`, user);

    // 2️⃣ Agar foydalanuvchi mavjud bo‘lmasa va u /start jo‘natmagan bo‘lsa
    if (!user && text !== "/start") {
      console.log(`User ${userId} is not registered.`);
      await ctx.reply(
        "🚫 Siz hali ro'yxatdan o'tmagansiz. Iltimos, /start bosing."
      );
      return;
    }

    // 3️⃣ `/start` bosilganda ro‘yxatdan o‘tish jarayonini boshlash
    if (text === "/start") {
      await this.botService.start(ctx);
      return;
    }

    // 4️⃣ Agar foydalanuvchi hali ro‘yxatdan o‘tmagan bo‘lsa, unga boshqa buyruqlarni ishlatishga ruxsat bermaymiz
    if (!user) {
      console.log(
        `User ${userId} is not registered but tried to use a command.`
      );
      return;
    }

    // 5️⃣ Role tanlash
    if (text === "Usta" || text === "Mijoz") {
      await this.botService.onRoleSelection(ctx);
      return;
    }

    if (user.status === "pending") {
      if (text === "🕵️ Tekshirish") {
        await this.botService.checkVerificationStatus(ctx, userId);
        return;
      }
      if (text === "❌ Bekor qilish") {
        await ctx.reply(
          "❌ Ro'yxatdan o'tish bekor qilindi. Qayta boshlash uchun /start ni bosing."
        );
        return;
      }
      if (text === "📞 Admin bilan bog'lanish") {
        await ctx.reply(
          "📞 Admin bilan bog'lanish uchun quyidagi tugmani bosing."
        );
        return;
      }
      if (text === "✅ Tasdiqlash") {
        console.log(64848498488);

        await this.botService.sendToAdminForApproval(ctx, userId);
        return;
      }

      await ctx.reply(
        "⏳ Sizning ma’lumotlaringiz admin tasdiqlashini kutmoqda. Faqat pastdagi tugmalardan foydalanishingiz mumkin."
      );
      return;
    }

    if (user.status === "rejected") {
      await ctx.reply(
        "❌ Sizning ma’lumotlaringiz admin tomonidan rad etilgan. Qayta ro‘yxatdan o‘tish uchun /start ni bosing."
      );
      return;
    }

    // 8️⃣ Agar foydalanuvchi tasdiqlangan bo‘lsa, usta yoki mijoz sifatida ishlov beramiz
    if (user.role === "Usta") {
      console.log(`User ${userId} is a Usta.`);
      await this.botService.handleMasterResponse(ctx);
    } else if (user.role === "Mijoz") {
      console.log(`User ${userId} is a Mijoz.`);
      await this.mijozService.handleCustomerResponse(ctx);
    } else {
      console.log(`User ${userId} has an unknown role: ${user.role}`);
    }
  }

  // @On("message")
  // async deleteUnCatchMessage(@Ctx() ctx: Context) {
  //   await this.botService.deleteUnCatchMessage(ctx);
  // }
}
