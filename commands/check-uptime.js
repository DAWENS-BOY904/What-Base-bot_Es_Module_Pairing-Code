// ==================== commands/uptime.js ====================

import config from "../config.js";

// =========================================================
//  MODULE: UPTIME COMMAND
// =========================================================

// ==================== commands/uptime.js ====================
// ✅ ESM Light version — pi pwòp, modèn, senp

export default {
  name: "uptime",
  alias: ["runtime", "alive"],
  description: "Affiche le temps d'activité et le ping du bot.",
  category: "utility",

  async execute(conn, mek, m, { from, reply }) {
    try {
      // 🕒 Format tan
      const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return [
          days > 0 ? `📅 ${days}d` : "",
          hours > 0 ? `⏰ ${hours}h` : "",
          minutes > 0 ? `🕒 ${minutes}m` : "",
          `⏱️ ${secs}s`
        ].filter(Boolean).join(" ");
      };

      const uptime = formatUptime(process.uptime());
      const ping = `${Date.now() - (m.messageTimestamp * 1000)}ms`;

      const message = `
╭───〔 *MINI-JESUS-BOT STATUS* 〕───⬣
│ 🤖 *Uptime:* ${uptime}
│ ⚡ *Status:* Online ✅
│ 📡 *Ping:* ${ping}
│ 💫 *System:* Stable & Optimized
╰──────────────⬣
`.trim();

      await conn.sendMessage(from, { 
        text: message,
        contextInfo: {
          isForwarded: true,
          forwardingScore: 777,
          mentionedJid: [m.sender]
        }
      }, { quoted: mek });

    } catch (err) {
      console.error("❌ Erreur uptime:", err);
      reply(`❌ Erreur: ${err.message}`);
    }
  }
};
