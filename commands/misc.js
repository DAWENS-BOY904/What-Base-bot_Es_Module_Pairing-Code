// ==================== commands/misc.js ====================
import os from "os";
import config from "../config.js";

export default [
  // =========================================================
  //  VV1 - Send view-once video
  // =========================================================
  {
    name: "vv1",
    alias: ["viewonce", "once"],
    desc: "Send video as view-once media",
    category: "misc",
    react: "🎥",
    async run(conn, m, msg, args, { reply }) {
      try {
        if (!m.quoted || !m.quoted.message?.videoMessage)
          return reply("⚠️ Reply to a *video* message.");

        const media = await m.quoted.download();
        await conn.sendMessage(m.chat, {
          video: media,
          viewOnce: true,
          caption: "🎬 This video can be viewed once!"
        }, { quoted: m });

        await reply("✅ Video sent as *view-once*.");
      } catch (err) {
        console.error("VV1 Error:", err);
        reply("❌ Failed to send view-once video.");
      }
    }
  },

  // =========================================================
  //  VV2 - Convert view-once to normal
  // =========================================================
  {
    name: "vv2",
    alias: ["unview", "openviewonce"],
    desc: "Convert a view-once message to normal",
    category: "misc",
    react: "🔓",
    async run(conn, m, msg, args, { reply }) {
      try {
        if (!m.quoted || !m.quoted.message?.viewOnceMessageV2)
          return reply("⚠️ Reply to a *view-once* message.");

        const media = await m.quoted.download();
        const type = Object.keys(m.quoted.message.viewOnceMessageV2.message)[0];

        await conn.sendMessage(m.chat, {
          [type]: media,
          caption: "🔓 View-once removed!"
        }, { quoted: m });

        await reply("✅ View-once message unlocked.");
      } catch (err) {
        console.error("VV2 Error:", err);
        reply("❌ Failed to unlock view-once message.");
      }
    }
  },

  // =========================================================
  //  VV3 - View message type info
  // =========================================================
  {
    name: "vv3",
    alias: ["msginfo", "info"],
    desc: "Show type & data of replied message",
    category: "misc",
    react: "📦",
    async run(conn, m, msg, args, { reply }) {
      try {
        if (!m.quoted) return reply("⚠️ Reply to any message to inspect.");
        const type = Object.keys(m.quoted.message)[0];
        const msgType = type.replace(/Message$/, "");
        await reply(`🔍 *Message Type:* ${msgType}\n\n🧩 Raw: ${JSON.stringify(m.quoted.message[type], null, 2)}`);
      } catch (err) {
        console.error("VV3 Error:", err);
        reply("❌ Failed to inspect message.");
      }
    }
  },
  
  // =========================================================
  //  ABOUT - Bot info
  // =========================================================
  {
    name: "about",
    alias: ["info", "system"],
    desc: "Show bot information",
    category: "misc",
    react: "💡",
    async run(conn, m, msg, args, { reply }) {
      const botName = config.BOT_NAME || "MINI-JESUS-CRASH";
      const owner = config.OWNER_NAME || "Dawens Boy";
      const uptime = runtime(process.uptime());
      const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      const totalMem = (os.totalmem() / 1024 / 1024).toFixed(1);

      const info = `
╭───〔 *💡 ${botName} Info* 〕───◉
│👑 *Owner:* ${owner}
│⚙️ *Version:* 1.0.0
│🧠 *Memory:* ${memory}MB / ${totalMem}MB
│⏱️ *Uptime:* ${uptime}
│📲 *Platform:* ${os.platform()}
╰────────────────────◉
      `.trim();

      await reply(info);
    }
  }
];
