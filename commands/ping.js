// ==================== commands/ping.js ====================

import os from "os";
import { runtime } from "../system/func.js";
import { performance } from "perf_hooks";
import config from "../config.js";

// =========================================================
//  MODULE: PING COMMAND (ESM)
// =========================================================

export default {
  name: "ping",
  alias: ["speed", "latency"],
  desc: "Check the bot's response speed.",
  category: "main",
  react: "🏓",

  async run(conn, m, msg, args, { reply }) {
    try {
      const start = performance.now();

      // Envoie un premier message
      const sent = await conn.sendMessage(m.chat, { text: "🏓 *Pinging...*" }, { quoted: m });

      const end = performance.now();
      const ping = (end - start).toFixed(2);
      const uptime = runtime(process.uptime());
      const cpu = os.cpus()[0].model;
      const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);

      const botName = config.BOT_NAME || "MINI-JESUS-CRASH";

      // Message final
      const msgPing = `
╭───〔 *🏓 ${botName} PING* 〕───◉
│⚡ *Response:* ${ping}ms
│🕐 *Uptime:* ${uptime}
│💾 *RAM:* ${ramUsed}MB / ${totalRam}MB
│🧠 *CPU:* ${cpu.split(" ")[0]} ${cpu.split(" ")[1]}
│
│✅ *Status:* Online & Active
╰────────────────────◉
> _ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴡᴇɴꜱ-ᴛᴇᴄʜx_
      `.trim();

      await conn.sendMessage(
        m.chat,
        {
          text: msgPing,
          edit: sent.key, // (Si ou vle ke li edite msg “Pinging...” a)
        },
        { quoted: m }
      );
    } catch (e) {
      console.error("Ping Error:", e);
      await reply(`❌ Ping failed: ${e.message}`);
    }
  }
};
