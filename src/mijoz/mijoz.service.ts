import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { BOT_NAME } from "../app.constants";
import { Ctx, InjectBot, On } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { Mijoz } from "./models/mijoz.model";
import { Bot } from "../bot/models/bot.model";

@Injectable()
export class MijozService {
  userSteps = new Map<number, number>();
  userData = new Map<number, any>();

  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}
  async findUserById(userId: number) {
    return await this.botModel.findByPk(userId);
  }
  async registerCustomer(ctx: Context) {
    try {
      const userId = ctx.from?.id;
      if (!userId) {
        console.error("User ID not found.");
        return;
      }

      this.userSteps.set(userId, 0);
      this.userData.set(userId, { role: "Mijoz" });

      await ctx.reply("Ismingizni kiriting:");
    } catch (error) {
      console.error("registerCustomer error:", error);
    }
  }

  async handleCustomerResponse(ctx: Context) {
    try {
      const userId = ctx.from?.id;
      if (!userId) {
        console.error("User ID not found.");
        return;
      }

      let step = this.userSteps.get(userId) ?? 0;
      let userData = this.userData.get(userId) ?? {};

      if (!ctx.message || !("text" in ctx.message)) {
        await ctx.reply("Iltimos, faqat matn kiriting.");
        return;
      }

      const userInput = ctx.message.text.trim();

      switch (step) {
        case 0:
          userData.name = userInput;
          await ctx.reply("📞 Telefon raqamingizni kiriting:");
          step++;
          break;
        case 1:
          userData.phone = userInput;
          await ctx.reply("📍 Manzilingizni kiriting:");
          step++;
          break;
        case 2:
          userData.address = userInput;

          const [user, created] = await this.botModel.findOrCreate({
            where: { userId },
            defaults: {
              role: "Mijoz",
              name: userData.name,
              telefon: userData.phone,
              manzil: userData.address,
            },
          });

          if (!created) {
            await user.update({
              name: userData.name,
              telefon: userData.phone,
              manzil: userData.address,
            });
          }

          await this.showCustomerMenu(ctx);

          this.userSteps.delete(userId);
          this.userData.delete(userId);
          return;
      }

      this.userSteps.set(userId, step);
      this.userData.set(userId, userData);
    } catch (error) {
      console.error("handleCustomerResponse error:", error);
    }
  }

  async showCustomerMenu(ctx: Context) {
    await ctx.reply(
      "✅ Siz mijoz sifatida ro'yxatdan o'tdingiz! Xizmatlardan foydalanishingiz mumkin.",
      {
        parse_mode: "HTML",
        ...Markup.keyboard([
          ["🔍 Xizmatlar", "⭐ Tanlangan xizmatlar"],
          ["⚙️ Ma'lumotlarni o'zgartirish"],
        ])
          .resize()
          .oneTime(),
      }
    );
  }

  async viewCustomerInfo(ctx: Context) {
    try {
      const userId = ctx.from?.id;
      if (!userId) {
        console.error("User ID not found.");
        return;
      }

      const user = await this.botModel.findOne({ where: { userId } });

      if (!user) {
        await ctx.reply(
          "🚫 Siz hali ro'yxatdan o'tmagansiz. Iltimos, /start ni bosing."
        );
        return;
      }

      if (user.role !== "Mijoz") {
        await ctx.reply(
          "❌ Siz mijoz emassiz. Ushbu bo'lim faqat mijozlar uchun."
        );
        return;
      }

      await ctx.reply(
        `📄 Ma'lumotlaringiz:\n\n` +
          `👤 Ism: <b>${user.name}</b>\n` +
          `📞 Telefon: <b>${user.telefon || "Kiritilmagan"}</b>\n` +
          `📍 Manzil: <b>${user.manzil || "Kiritilmagan"}</b>\n\n` +
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("📞 Telefonni o'zgartirish", "edit_phone")],
            [
              Markup.button.callback(
                "📍 Manzilni o'zgartirish",
                "edit_address"
              ),
            ],
          ]),
        }
      );
    } catch (error) {
      console.error("viewCustomerInfo error:", error);
    }
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
      this.userSteps.set(userId, 1);
    }

    if (callbackData === "edit_address") {
      await ctx.reply("📍 Yangi manzilingizni kiriting:");
      this.userSteps.set(userId, 2);
    }

    await ctx.answerCbQuery();
  }

  async showServices(ctx: Context) {
    try {
      const services = [
        "Sartaroshxona",
        "Go'zallik saloni",
        "Zargarlik ustaxonasi",
        "Soatsoz",
        "Poyabzal ustaxonasi",
      ];

      const serviceButtons = services.map((service) => [
        Markup.button.callback(service, `service_${service}`),
      ]);

      await ctx.reply("🛠 Sizga qanday xizmat kerak?", {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard(serviceButtons),
      });
    } catch (error) {
      console.error("showServices error:", error);
      await ctx.reply(
        "❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring."
      );
    }
  }
}
