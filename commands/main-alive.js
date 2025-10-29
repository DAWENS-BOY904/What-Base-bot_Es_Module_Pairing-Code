// ==================== commands/alive.js ====================

import os from "os";
import { runtime } from "../system/func.js";
import config from "../config.js";

// =========================================================
//  MODULE: ALIVE COMMAND (ESM COMPATIBLE)
// =========================================================

export default {
  name: "alive",
  alias: ["bot", "online"],
  desc: "Check if the bot is active and online.",
  category: "main",
  react: "⚡",

  async run(conn, m, msg, args, { reply }) {
    try {
      const botName = config.BOT_NAME || "MINI-JESUS-CRASH";
      const ownerName = config.OWNER_NAME || "𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘";
      const prefix = config.PREFIX || ".";
      const mode = config.MODE || "public";
      const imageUrl = config.ALIVE_IMAGE || "https://files.catbox.moe/x16nfd.png";

      // ==================== STATUS MESSAGE ====================
      const status = `
╭───〔 *🤖 ${botName} STATUS* 〕───◉
│✨ *Bot is Active & Online!*
│
│👨‍💻 *Owner:* ${ownerName}
│⚡ *Version:* 1.0.0
│📝 *Prefix:* [ ${prefix} ]
│📳 *Mode:* [ ${mode} ]
│💾 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(1)}MB
│🖥️ *Host:* ${os.hostname()}
│⌛ *Uptime:* ${runtime(process.uptime())}
╰────────────────────◉
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴡᴇɴꜱ-ᴛᴇᴄʜx*
      `.trim();

      // ==================== SEND STATUS ====================
      await conn.sendMessage(
        m.chat,
        {
          image: { url: imageUrl },
          caption: status,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 1000,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363419768812867@newsletter",
              newsletterName: botName,
              serverMessageId: 143
            }
          }
        },
        { quoted: m }
      );
    } catch (e) {
      console.error("Alive Error:", e);
      await reply(`❌ An error occurred while checking bot status:\n${e.message}`);
    }
  }
};
