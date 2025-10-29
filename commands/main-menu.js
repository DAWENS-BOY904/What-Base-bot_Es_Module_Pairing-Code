// ==================== commands/menu.js ====================
import os from 'os';
import config from '../config.js';
import { commands } from '../handler.js';

// Small caps util
const toSmallCaps = (str) => {
  const smallCaps = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
    Y: 'ʏ', Z: 'ᴢ'
  };
  return str.toUpperCase().split('').map(c => smallCaps[c] || c).join('');
};

// Delay helper
const wait = (ms) => new Promise(res => setTimeout(res, ms));

export default {
  name: 'menu',
  description: 'Afficher le menu complet des commandes',
  category: 'general',

  async run(conn, m, msg, args, context) {
    try {
      const { sender, isOwner } = context;
      const from = m.chat;
      const userName = msg.pushName || 'User';
      const prefix = config.PREFIX || '.';
      const botName = config.BOT_NAME || 'MINI-JESUS-CRASH';
      const ownerName = config.OWNER_NAME || '𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘';
      const mode = config.MODE || 'default';
      const menuImage = config.MENU_IMAGE_URL || 'https://files.catbox.moe/x16nfd.png';

      // Ask for confirmation
      const promptMsg = await conn.sendMessage(from, {
        text: '⚠️ Ready to open the menu?\nReact (✅ / 👍) or reply "yes" within 30s.'
      }, { quoted: m });

      // Wait for confirmation
      const waitForConfirmation = (timeout = 30000) => new Promise((resolve) => {
        let done = false;

        const cleanup = () => {
          conn.ev.off('messages.reaction', onReaction);
          conn.ev.off('messages.upsert', onUpsert);
          clearTimeout(timer);
        };

        const onReaction = (react) => {
          const data = Array.isArray(react) ? react[0] : react;
          if (!data) return;
          const emoji = data.text || data.reaction || data.emoji;
          const matches = data.key.remoteJid === from && data.key.id === promptMsg.key.id;
          if (matches && ['✅', '👍', '❤️'].includes(emoji)) {
            cleanup();
            done = true;
            resolve(true);
          }
        };

        const onUpsert = (ev) => {
          const msgs = ev.messages || [];
          for (const msg of msgs) {
            const txt = msg.message?.conversation?.toLowerCase() || '';
            if (msg.key.remoteJid === from && msg.key.participant === sender && ['yes', 'wi', 'ok', '✅'].includes(txt)) {
              cleanup();
              done = true;
              resolve(true);
            }
          }
        };

        conn.ev.on('messages.reaction', onReaction);
        conn.ev.on('messages.upsert', onUpsert);

        const timer = setTimeout(() => {
          if (!done) {
            cleanup();
            resolve(false);
          }
        }, timeout);
      });

      const confirmed = await waitForConfirmation();
      if (!confirmed) {
        await conn.sendMessage(from, { text: '⏳ No confirmation received. Menu cancelled.' }, { quoted: promptMsg });
        return;
      }

      // Show loading animation
      const stages = [
        '⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜  0%',
        '🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜  10%',
        '🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜  25%',
        '🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜  50%',
        '🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜  75%',
        '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩  100%'
      ];
      let loadingMsg = await conn.sendMessage(from, { text: `🖤 Loading...\n${stages[0]}` }, { quoted: promptMsg });
      for (let i = 1; i < stages.length; i++) {
        await wait(500);
        try {
          await conn.sendMessage(from, { edit: loadingMsg.key, text: `🖤 Loading...\n${stages[i]}` });
        } catch {
          loadingMsg = await conn.sendMessage(from, { text: `🖤 Loading...\n${stages[i]}` });
        }
      }
      await wait(700);
      await conn.sendMessage(from, { text: '✅ Menu ready! Displaying...' }, { quoted: loadingMsg });

      // Prepare info
      const uptime = () => {
        const sec = process.uptime();
        const h = Math.floor(sec / 3600);
        const mU = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${h}h ${mU}m ${s}s`;
      };
      const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);

      // Group all commands by category
      const grouped = {};
      for (const [, cmd] of commands) {
        const cat = (cmd.category || 'other').toUpperCase();
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(cmd);
      }

      let header = `╭───〔 *${botName} MENU* 〕───⬣
│ 🤖 Bot de: *${ownerName}*
│ 💬 User: *${userName}*
│ ⏱️ Uptime: *${uptime()}*
│ ⏺️ Mode: *${mode}*
│ 🛠️ RAM: *${ramUsage}MB / ${totalRam}MB*
│ 🔰 Prefix: *${prefix}*
╰──────────────⬣\n`;

      let menuText = '';
      for (const cat of Object.keys(grouped)) {
        menuText += `\n\n╔═══❖•ೋ 🌐 *${cat} MENU* ೋ•❖═══╗\n`;
        const cmds = grouped[cat].filter(c => c.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        cmds.forEach((cmd) => {
          menuText += `║ ➤ ${prefix}${toSmallCaps(cmd.name)}\n`;
        });
        menuText += `╚════════════════════╝`;
      }

      menuText += `\n\n🔋 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘`;

      await conn.sendMessage(from, {
        image: { url: menuImage },
        caption: header + menuText,
        contextInfo: { mentionedJid: [sender] }
      }, { quoted: m });

      // Play optional sound
      const sounds = [
        'https://files.catbox.moe/3cj1e3.mp4',
        'https://files.catbox.moe/vq3odo.mp4',
        'https://files.catbox.moe/fo2kz0.mp4'
      ];
      const random = sounds[Math.floor(Math.random() * sounds.length)];
      await conn.sendMessage(from, { audio: { url: random }, mimetype: 'audio/mp4', ptt: true });

    } catch (e) {
      console.error('❌ Menu Error:', e);
      await conn.sendMessage(m.chat, { text: `⚠️ Menu Error: ${e.message}` }, { quoted: m });
    }
  }
};
