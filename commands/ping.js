// ==================== commands/ping.js ====================

import os from 'os';
import { performance } from 'perf_hooks';
import { cmd } from '../command.js';

// =========================================================
//  MODULE: PING / SPEED CHECK
// =========================================================

cmd({
  pattern: 'ping',
  alias: ['speed', 'pong', 'status'],
  desc: '🏓 Check bot response time, RAM usage and uptime.',
  category: 'main',
  react: '🏓',
  filename: __filename,
}, 
async (conn, mek, m, { from }) => {
  try {
    const start = performance.now();

    // Send initial message (check speed)
    const temp = await conn.sendMessage(from, { text: '⏳ Checking speed...' }, { quoted: mek });
    const end = performance.now();
    const ping = (end - start).toFixed(2);

    // Calculate uptime
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const mU = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    // RAM usage
    const usedRam = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

    // Create final status message
    const statusText = `
╭───〔 *MINI-JESUS-CRASH STATUS* 〕───⬣
│ 🏓 *Ping:* ${ping} ms
│ ⏱️ *Uptime:* ${h}h ${mU}m ${s}s
│ 💾 *RAM:* ${usedRam}MB / ${totalRam}GB
│ ⚙️ *OS:* ${os.platform().toUpperCase()} ${os.release()}
╰────────────────────────⬣
    `.trim();

    // Send the final result
    await conn.sendMessage(from, {
      text: statusText,
      contextInfo: { mentionedJid: [m.sender], forwardingScore: 1, isForwarded: true },
      edit: temp.key
    });

  } catch (e) {
    console.error('Ping Error:', e);
    await conn.sendMessage(from, { text: '❌ Error while checking ping.' }, { quoted: mek });
  }
});

// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'ping',
  category: 'main'
};
