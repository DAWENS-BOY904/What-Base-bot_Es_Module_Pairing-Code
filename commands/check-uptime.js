// ==================== commands/uptime.js ====================

import { cmd, commands } from '../command.js';

// =========================================================
//  MODULE: UPTIME COMMAND
// =========================================================

cmd({
  pattern: 'uptime',
  alias: ['runtime', 'alive'],
  desc: 'Check bot uptime and performance status.',
  category: 'utility',
  react: '⏱️',
  filename: __filename
}, 
async (conn, mek, m, { from, reply }) => {
  try {
    // Helper function pou formate uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      let timeString = '';
      if (days > 0) timeString += `📅 ${days}d `;
      if (hours > 0) timeString += `⏰ ${hours}h `;
      if (minutes > 0) timeString += `🕒 ${minutes}m `;
      timeString += `⏱️ ${secs}s`;
      
      return timeString.trim();
    };

    // Calcule uptime & ping
    const uptime = formatUptime(process.uptime());
    const ping = `${Date.now() - (m.messageTimestamp * 1000)}ms`;

    // Mesaj stylize
    const message = `
╭───〔 *MINI-JESUS-BOT STATUS* 〕───⬣
│ 🤖 *Uptime:* ${uptime}
│ ⚡ *Status:* Online ✅
│ 📡 *Ping:* ${ping}
│ 💫 *System:* Stable & Optimized
╰──────────────⬣
`.trim();

    // Voye mesaj la
    await conn.sendMessage(from, { 
      text: message,
      contextInfo: {
        isForwarded: true,
        forwardingScore: 777,
        mentionedJid: [m.sender]
      }
    }, { quoted: mek });

  } catch (e) {
    console.error('❌ Error in uptime command:', e);
    reply(`❌ Error checking uptime: ${e.message}`);
  }
});

// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'uptime',
  category: 'utility'
};