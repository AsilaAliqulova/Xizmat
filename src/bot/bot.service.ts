import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "./models/bot.model";
import { BOT_NAME } from "../app.constants";
import { Ctx, InjectBot, On } from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { MijozService } from "../mijoz/mijoz.service";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    private readonly mijozService: MijozService
  ) {}

  async start(ctx: Context) {
    const userId = ctx.from?.id;
    const user = await this.botModel.findByPk(userId);

    if (!user) {
      await this.botModel.create({
        userId,
        username: ctx.from?.username,
        first_name: ctx.from?.first_name,
        last_name: ctx.from?.last_name,
        lang: ctx.from?.language_code,
      });
      await ctx.reply(
        `Iltimos,<b>📞Telefon raqamni yuborish</b> tugmasini bosing`,
        {
          parse_mode: "HTML",
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞Telefon raqamni yuborish")],
          ])
            .resize()
            .oneTime(),
        }
      );
    } else if (!user.status) {
      await ctx.reply(
        `Iltimos,<b>📞Telefon raqamni yuborish</b> tugmasini bosing`,
        {
          parse_mode: "HTML",
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞Telefon raqamni yuborish")],
          ])
            .resize()
            .oneTime(),
        }
      );
    } else {
      await this.bot.telegram.sendChatAction(userId!, "typing");
      await this.onRoleSelection(ctx);
    }
  }

  async OnContact(ctx: Context) {
    if ("contact" in ctx.message!) {
      const userId = ctx.from?.id;
      const user = await this.botModel.findByPk(userId);

      if (!user) {
        await ctx.reply(`Iltimos,<b>Start</b> tugmasini bosing`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (ctx.message!.contact.user_id !== userId) {
        await ctx.reply(`Iltimos, o'zingizning raqamingizni yuboring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([
            [Markup.button.contactRequest("📞 Telefon raqamni yuborish")],
          ])
            .resize()
            .oneTime(),
        });
      } else {
        let phone = ctx.message.contact.phone_number;
        if (phone[0] != "+") {
          phone = "+" + phone;
        }
        user.phone_number = phone;
        user.status = "true";
        await user.save();

        await ctx.reply(`\n O'z ro'lingizni tanlang:`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["Usta", "Mijoz"]])
            .resize()
            .oneTime(),
        });
      }
    }
  }

  async findUserById(userId: number) {
    return await this.botModel.findByPk(userId);
  }

  async onStop(ctx: Context) {
    try {
      const userId = ctx.from?.id;
      const user = await this.botModel.findByPk(userId);

      if (user && user.status) {
        await this.botModel.destroy({ where: { userId } });

        await ctx.reply(`Sizni yana kutub qolamiz`, {
          parse_mode: "HTML",
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log("onStop error:", error);
    }
  }

  async onRoleSelection(ctx: Context) {
    const userId = ctx.from!.id;
    const user = await this.findUserById(userId);

    if (!user) {
      await ctx.reply("Iltimos, avval /start ni bosing.");
      return;
    }

    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Iltimos, tugmalardan birini tanlang.");
      return;
    }

    const role = ctx.message.text.trim();
    if (role === "Usta" || role === "Mijoz") {
      user.role = role;
      await user.save();

      await ctx.reply(`Siz <b>${role}</b> sifatida ro'yxatdan o'tdingiz! ✅`, {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });

      if (role == "Usta") {
        await this.showSpecialties(ctx);
      } else if (role === "Mijoz") {
        await this.mijozService.registerCustomer(ctx);
      }
    } else {
      await ctx.reply("Iltimos, quyidagi variantlardan birini tanlang:", {
        parse_mode: "HTML",
        ...Markup.keyboard([["Usta", "Mijoz"]])
          .resize()
          .oneTime(),
      });
    }
  }

  async showSpecialties(ctx: Context) {
    const specialties = [
      "Sartaroshxona",
      "Go'zallik saloni",
      "Zargarlik ustaxonasi",
      "Soatsoz",
      "Poyabzal ustaxonasi",
    ];

    const inlineButtons = specialties.map((specialty) =>
      Markup.button.callback(specialty, `specialty_${specialty}`)
    );

    await ctx.reply("Iltimos, o'z mutaxassisligingizni tanlang:", {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard(inlineButtons, { columns: 2 }),
    });
  }

  @On("callback_query")
  async onSpecialtySelection(ctx: Context) {
    const userId = ctx.from!.id;
    const user = await this.findUserById(userId);

    if (!user) {
      await ctx.reply("Iltimos, avval /start ni bosing.");
      return;
    }

    if (!user.role || user.role !== "Usta") {
      await ctx.reply("Siz ushbu bo'limga kira olmaysiz.");
      return;
    }

    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || typeof callbackQuery !== "object") {
      await ctx.reply("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      return;
    }

    const callbackData = "data" in callbackQuery ? callbackQuery.data : null;
    if (!callbackData || !callbackData.startsWith("specialty_")) {
      await ctx.reply("Noto'g'ri tanlov. Iltimos, tugmalardan birini bosing.");
      return;
    }

    const selectedSpecialty = callbackData.replace("specialty_", "");
    user.specialty = selectedSpecialty;
    await user.save();

    console.log(`User ${userId} chose specialty: ${selectedSpecialty}`);

    await ctx.answerCbQuery();
    await ctx.reply(
      `Siz <b>${selectedSpecialty}</b> mutaxassisligi bo'yicha ro'yxatdan o'tdingiz! ✅`,
      { parse_mode: "HTML" }
    );

    await this.askMasterDetails(ctx);
  }

  userSteps = new Map<number, any>();
  userData = new Map<number, any>();

  public getUserStep(userId: number): number {
    return this.userSteps.get(userId) ?? 0;
  }

  async askMasterDetails(ctx: Context) {
    const userId = ctx.from!.id;
    this.userSteps.set(userId, 0);
    this.userData.set(userId, {});

    await ctx.reply("Ismingizni kiriting:");
  }

  async handleMasterResponse(ctx: Context) {
    const userId = ctx.from!.id;
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
        await ctx.reply("Telefon raqamingizni kiriting:");
        step++;
        break;
      case 1:
        userData.phone = userInput;
        await ctx.reply(
          "Ustaxona nomini kiriting, yoki 'O'tkazish' ni bosing:",
          {
            ...Markup.keyboard([["❌ O'tkazish"]])
              .resize()
              .oneTime(),
          }
        );
        step++;
        break;
      case 2:
        if (userInput !== "❌ O'tkazish") {
          userData.workshop = userInput;
        }
        await ctx.reply(
          "Manzilingizni kiriting, yoki '❌ O'tkazish' ni bosing:",
          {
            ...Markup.keyboard([["❌ O'tkazish"]])
              .resize()
              .oneTime(),
          }
        );
        step++;
        break;
      case 3:
        if (userInput !== "❌ O'tkazish") {
          userData.address = userInput;
        }
        await ctx.reply("Mo'ljalni kiriting, yoki '❌ O'tkazish' ni bosing:", {
          ...Markup.keyboard([["❌ O'tkazish"]])
            .resize()
            .oneTime(),
        });
        step++;
        break;
      case 4:
        if (userInput !== "❌ O'tkazish") {
          userData.landmark = userInput;
        }
        await ctx.reply("Lokatsiyangizni yuboring 📍:", {
          ...Markup.keyboard([
            [Markup.button.locationRequest("📍 Lokatsiyani yuborish")],
          ])
            .resize()
            .oneTime(),
        });
        step++;
        break;
      case 5:
        await ctx.reply("Ish boshlash vaqtini kiriting (masalan, 9:00):");
        step++;
        break;
      case 6:
        userData.startTime = userInput;
        await ctx.reply("Ish tugash vaqtini kiriting (masalan, 18:00):");
        step++;
        break;
      case 7:
        userData.endTime = userInput;
        await ctx.reply(
          "Har bir mijoz uchun o'rtacha vaqtni kiriting (daqiqa):"
        );
        step++;
        break;
      case 8:
        userData.avgTime = userInput;

        await ctx.reply(
          `Ma'lumotlaringiz:\n\n` +
            `👤 Ism: ${userData.name}\n` +
            `📞 Telefon: ${userData.phone}\n` +
            `🏠 Ustaxona: ${userData.workshop || "Kiritilmagan"}\n` +
            `📍 Manzil: ${userData.address || "Kiritilmagan"}\n` +
            `🗺 Mo'ljal: ${userData.landmark || "Kiritilmagan"}\n` +
            `🕒 Ish vaqti: ${userData.startTime} - ${userData.endTime}\n` +
            `⏳ Har mijoz uchun o'rtacha vaqt: ${userData.avgTime} min\n\n` +
            `Tasdiqlash uchun ✅ Tasdiqlash tugmasini bosing yoki bekor qilish uchun ❌ Bekor qilish tugmasini bosing.`,
          {
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback("✅ Tasdiqlash", "confirm_data"),
                Markup.button.callback("❌ Bekor qilish", "cancel_data"),
              ],
            ]),
          }
        );
        break;
    }

    this.userSteps.set(userId, step);
    this.userData.set(userId, userData);
  }

  async handleLocation(ctx: Context) {
    const userId = ctx.from!.id;
    const step = this.userSteps.get(userId) ?? 0;
    const userData = this.userData.get(userId) ?? {};

    if ("location" in ctx.message!) {
      userData.location = ctx.message.location;
      await ctx.reply("Ish boshlash vaqtini kiriting (masalan, 9:00):");
      this.userSteps.set(userId, step + 1);
      this.userData.set(userId, userData);
    } else {
      await ctx.reply("Lokatsiyani yuboring 📍:");
    }
  }

  async confirmData(ctx: Context) {
    const userId = ctx.from!.id;
    const userData = this.userData.get(userId);

    if (!userData) {
      await ctx.reply("Ma'lumotlarni oldin to'ldiring.");
      return;
    }

    try {
      const [user, created] = await this.botModel.findOrCreate({
        where: { userId },
        defaults: {
          name: userData.name,
          telefon: userData.phone,
          ustaxona: userData.workshop || null,
          manzil: userData.address || null,
          moljal: userData.landmark || null,
          lokatsiya: JSON.stringify(userData.location),
          boshlashVaqti: userData.startTime,
          yakunlashVaqti: userData.endTime,
          sarflanadiganVaqt: userData.avgTime,
          status: "pending",
        },
      });

      if (!created) {
        await user.update({
          name: userData.name,
          telefon: userData.phone,
          ustaxona: userData.workshop || null,
          manzil: userData.address || null,
          moljal: userData.landmark || null,
          lokatsiya: JSON.stringify(userData.location),
          boshlashVaqti: userData.startTime,
          yakunlashVaqti: userData.endTime,
          sarflanadiganVaqt: userData.avgTime,
          status: "pending",
        });
      }

       const adminId = process.env.ADMIN_ID!;

      await ctx.telegram.sendMessage(
        adminId,
        `🔔 Yangi ustaning ma'lumotlari tasdiqlash uchun yuborildi:\n\n` +
          `👤 Ism: ${userData.name}\n` +
          `📞 Telefon: ${userData.phone}\n` +
          `🏠 Ustaxona: ${userData.workshop || "Kiritilmagan"}\n` +
          `📍 Manzil: ${userData.address || "Kiritilmagan"}\n` +
          `🕒 Ish vaqti: ${userData.startTime} - ${userData.endTime}\n` +
          `⏳ Har mijoz uchun o'rtacha vaqt: ${userData.avgTime} min\n\n` +
          `✅ Tasdiqlash yoki ❌ Bekor qilish uchun quyidagi tugmalarni bosing.`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("✅ Tasdiqlash", `approve_${userId}`)],
            [Markup.button.callback("❌ Bekor qilish", `reject_${userId}`)],
          ]),
        }
      );

    
      await ctx.reply(
        "✅ Ma'lumotlaringiz adminga jo'natildi. Tez orada tasdiqlangandan so'ng xabar beramiz.",
        {
          parse_mode: "HTML",
          ...Markup.keyboard([
            ["🕵️ Tekshirish"],
            ["❌ Bekor qilish"],
            ["📞 Admin bilan bog'lanish"],
          ])
            .resize()
            .oneTime(),
        }
      );

      this.userSteps.delete(userId);
      this.userData.delete(userId);
    } catch (error) {
      console.error("Xatolik ma'lumotlarni saqlashda:", error);
      await ctx.reply(
        "❌ Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
      );
    }
  }

  async cancelData(ctx: Context) {
    const userId = ctx.from!.id;

    this.userSteps.delete(userId);
    this.userData.delete(userId);

    await ctx.reply(
      "❌ Ro'yxatdan o'tish bekor qilindi. Qayta boshlash uchun quyidagi tugmani bosing:",
      {
        parse_mode: "HTML",
        ...Markup.keyboard([["/start"]])
          .resize()
          .oneTime(),
      }
    );
  }



  async checkVerificationStatus(ctx: Context, userId: number) {
    const user = await this.botModel.findByPk(userId);

    if (!user) {
      await ctx.reply(
        "🚫 Siz hali ro'yxatdan o'tmagansiz. Iltimos, /start bosing."
      );
      return;
    }

    if (user.status === "pending") {
      await ctx.reply(
        "Ma'lumotlaringiz hali tasdiqlanmagan. Qayta tekshirish uchun kuting.",
        {
          parse_mode: "HTML",
          ...Markup.keyboard([
            ["🕵️ Tekshirish"],
            ["❌ Bekor qilish"],
            ["📞 Admin bilan bog'lanish"],
          ])
            .resize()
            .oneTime(),
        }
      );
    } else if (user.status === "approved") {
      await this.sendFinalMenu(ctx, userId);
    } else {
      await ctx.reply("❌ Sizning ro'yxatdan o'tishingiz rad etildi.");
    }
  }

  async approveUser(userId: number) {
    const user = await this.botModel.findByPk(userId);
    if (user) {
      user.status = "approved";
      await user.save();
    }
  }

  async rejectUser(userId: number) {
    const user = await this.botModel.findByPk(userId);
    if (user) {
      user.status = "rejected";
      await user.save();
    }
  }

  async sendFinalMenu(ctx: Context, userId: number) {
    await ctx.reply(
      "Ma'lumotlaringiz tasdiqlandi.",
      {
        parse_mode: "HTML",
        ...Markup.keyboard([
          ["📋 Mijozlar"],
          ["⏳ Vaqt"],
          ["⭐ Reyting"],
          ["⚙️ Ma'lumotlarni o'zgartirish"],
        ])
          .resize()
          .oneTime(),
      }
    );
  }
  async deleteUnCatchMessage(ctx: Context) {
    try {

      const contextmessage = ctx.message!.message_id;
      await ctx.deleteMessage(contextmessage);
    } catch (error) {
      console.log("deleteUnCatchMessage", error);
    }
  }

  //--------------------------Admin---------------------------

  async showAdminPanel(ctx: Context) {
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

  async listUsers(ctx: Context) {
    const adminId = ctx.from!.id;

    // **Adminligini tekshirish**

    const users = await this.botModel.findAll(); // Barcha foydalanuvchilarni olish

    if (users.length === 0) {
      await ctx.reply("📭 Hech qanday foydalanuvchi topilmadi.");
      return;
    }

    let message = "📋 <b>Barcha foydalanuvchilar:</b>\n\n";
    users.forEach((user, index) => {
      message += `${index + 1}. 👤 <b>${user.name || "Ism kiritilmagan"}</b>\n`;
      message += `🆔 ID: <code>${user.userId}</code>\n`;
      message += `📞 Telefon: ${user.telefon || "Kiritilmagan"}\n`;
      message += `📍 Manzil: ${user.manzil || "Kiritilmagan"}\n`;
      message += `🔹 Role: ${user.role}\n`;
      message += `──────────────\n`;
    });

    await ctx.reply(message, { parse_mode: "HTML" });
  }

  async deleteUser(ctx: Context) {
    const adminId = ctx.from!.id;

    this.userSteps.set(adminId, "deleteUser");
    await ctx.reply("🗑 O'chirmoqchi bo'lgan foydalanuvchi ID sini kiriting:");
  }
  // async approveUser(ctx: Context, userId: number) {
  //   const user = await this.findUserById(userId);
  //   if (user) {
  //     user.status = "approved";
  //     await user.save();

  //     await this.bot.telegram.sendMessage(
  //       userId,
  //       "✅ Sizning ustaxona ro'yxatdan o'tish arizangiz tasdiqlandi!"
  //     );

  //     await ctx.answerCbQuery("✅ Tasdiqlandi!");
  //   }
  // }

  // async rejectUser(ctx: Context, userId: number) {
  //   const user = await this.findUserById(userId);
  //   if (user) {
  //     user.status = "rejected";
  //     await user.save();

  //     await this.bot.telegram.sendMessage(
  //       userId,
  //       "❌ Sizning ustaxona ro'yxatdan o'tish arizangiz rad etildi."
  //     );

  //     await ctx.answerCbQuery("❌ Rad etildi!");
  //   }
  // }

  async sendToAdminForApproval(ctx: Context, userId: number) {
    const user = await this.botModel.findByPk(userId);

    if (!user) {
      await ctx.reply("❌ Foydalanuvchi topilmadi.");
      return;
    }

    // Adminga foydalanuvchi ma'lumotlarini yuborish
    const adminId = 1234567890; // 🔴 BU YERGA ADMIN ID NI KIRITING
    await ctx.telegram.sendMessage(
      adminId,
      `📌 <b>Yangi usta ro'yxatdan o'tdi!</b>\n\n` +
        `👤 Ism: ${user.name}\n` +
        `📞 Telefon: ${user.telefon}\n` +
        `🏠 Ustaxona: ${user.ustaxona || "Kiritilmagan"}\n` +
        `📍 Manzil: ${user.manzil || "Kiritilmagan"}\n` +
        `🕒 Ish vaqti: ${user.boshlashVaqti} - ${user.yakunlashVaqti}\n` +
        `⏳ Har mijoz uchun o'rtacha vaqt: ${user.sarflanadiganVaqt} min\n\n` +
        `✅ Tasdiqlash yoki ❌ Bekor qilish uchun tugmalardan foydalaning.`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Tasdiqlash", `approve_${userId}`)],
          [Markup.button.callback("❌ Bekor qilish", `reject_${userId}`)],
        ]),
      }
    );

    // Foydalanuvchiga tasdiqlash jarayoni haqida ma'lumot berish
    await ctx.reply(
      "✅ Ma'lumotlaringiz adminga jo'natildi. Tasdiqlash jarayoni kutilmoqda."
    );
  }
}
