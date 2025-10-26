// ==================== commands/alive.js ====================

import os from 'os';
import { cmd } from '../command.js';
import { runtime } from '../lib/functions.js';
import config from '../config.js';

// =========================================================
//  MODULE: ALIVE COMMAND
// =========================================================

cmd({
  pattern: 'alive',
  alias: ['bot', 'online'],
  desc: 'Check if the bot is active and online.',
  category: 'main',
  react: '⚡',
  filename: __filename,
},
async (conn, mek, m, { from, sender, reply }) => {
  try {
    const botName = config.BOT_NAME || 'MINI-JESUS-CRASH';
    const ownerName = config.OWNER_NAME || '𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘';
    const prefix = config.PREFIX || '.';
    const mode = config.MODE || 'public';
    const imageUrl = config.ALIVE_IMAGE || 'https://files.catbox.moe/x16nfd.png';

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
    await conn.sendMessage(from, {
      image: { url: imageUrl },
      caption: status,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 1000,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363419768812867@newsletter',
          newsletterName: botName,
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error('Alive Error:', e);
    reply(`❌ An error occurred while checking bot status:\n${e.message}`);
  }
});

// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'alive',
  category: 'main'
};