// ==================== commands/pair.js ====================
// ✅ Full ESM version (no CommonJS require)

import axios from "axios";
import config from "../config.js";

/**
 * MINI-JESUS-CRASH Pair Command
 * Exporte yon fonksyon ki ka itilize pa loader ou (ex: system ki scanne commands/)
 */
export default {
  name: "pair",
  alias: ["getpair", "clonebot"],
  category: "main",
  description: "Get pairing code for MINI-JESUS-CRASH bot",

  /**
   * Fonksyon prensipal command lan
   * @param {object} conn - Connection WhatsApp
   * @param {object} m - Message object
   * @param {object} ctx - Context (reply, senderNumber, q, isGroup, etc.)
   */
  async execute(conn, m, { reply, senderNumber, q, isGroup }) {
    try {
      if (isGroup) {
        return await reply("❌ This command only works in private chat.");
      }

      const phoneNumber = q
        ? q.trim().replace(/[^0-9]/g, "")
        : senderNumber.replace(/[^0-9]/g, "");

      if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
        return await reply(
          "❌ Please provide a valid phone number without `+`\nExample: `.pair 923427582XXX`"
        );
      }

      await reply("⏳ Getting pairing code...");

      // --- API call ---
      const res = await axios.get(
        `https://jesus-crash-v1-pair.onrender.com/code?number=${encodeURIComponent(
          phoneNumber
        )}`
      );

      const pairingCode = res.data?.code;
      if (!pairingCode)
        return await reply("❌ Failed to retrieve pairing code. Try again later.");

      // --- Send pairing info ---
      await conn.sendMessage(m.chat, {
        image: { url: "https://files.catbox.moe/qfi0h5.jpg" },
        caption: `✅ *PAIRING SUCCESSFUL*\n\n*Phone:* ${phoneNumber}\n*Code:* ${pairingCode}\n\n> Copy the code below 👇`,
      });

      await reply(pairingCode);

    } catch (err) {
      console.error("PAIR ERROR:", err);
      await reply("❌ An error occurred while getting pairing code.");
    }
  },
};
