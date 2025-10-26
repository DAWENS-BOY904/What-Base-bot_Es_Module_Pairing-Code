// ==================== /commands/menu.js ====================
import os from 'os';
import { cmd, commands } from '../command.js';
import config from '../config.js';

// Small caps function
function toSmallCaps(str) {
  const smallCaps = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
    Y: 'ʏ', Z: 'ᴢ'
  };
  return str.toUpperCase().split('').map(c => smallCaps[c] || c).join('');
}

// Utility to sleep
const wait = ms => new Promise(res => setTimeout(res, ms));

cmd({
  pattern: 'menu',
  alias: ['allmenu', 'jesus'],
  desc: 'Show command menu (requires reaction to confirm)',
  category: 'menu',
  react: '📜',
  filename: import.meta.url
}, async (conn, mek, m, { from, pushname, isOwner }) => {

  const reply = async (text) => {
    try { 
      return await conn.sendMessage(from, { text }, { quoted: mek }); 
    } catch (e) { 
      console.error('reply err', e); 
    }
  };

  try {
    const prefix = config.PREFIX || '.';
    const botName = config.BOT_NAME || 'MINI-JESUS-CRASH';
    const ownerName = config.OWNER_NAME || '𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘';
    const menuImage = config.MENU_IMAGE_URL || 'https://files.catbox.moe/x16nfd.png';
    const userName = pushname || 'User';
    const mode = config.MODE || 'default';

    // Prompt for reaction confirmation
    const promptMsg = await conn.sendMessage(from, {
      text: '⚠️ You ready? React (✅ / 👍) or reply "ready" within 30s to open the menu.'
    }, { quoted: mek });

    const waitForConfirmation = (timeoutMs = 30000) => new Promise((resolve) => {
      let resolved = false;

      const attach = (ev, handler) => {
        if (conn.ev && conn.ev.on) conn.ev.on(ev, handler);
        else if (conn.on) conn.on(ev, handler);
      };
      const detach = (ev, handler) => {
        try {
          if (conn.ev && conn.ev.off) conn.ev.off(ev, handler);
          else if (conn.ev && conn.ev.removeListener) conn.ev.removeListener(ev, handler);
          else if (conn.removeListener) conn.removeListener(ev, handler);
        } catch (_) {}
      };

      const onReaction = (reaction) => {
        try {
          const react = Array.isArray(reaction) ? reaction[0] : reaction;
          if (!react) return;
          const key = react.key;
          const participantRaw = react.participant || react.author || '';
          const participant = String(participantRaw).split(':')[0] || participantRaw || '';
          const emoji = react.text || react.reaction || react.emoji || '';
          const matches = key && key.remoteJid === from && key.id === promptMsg.key.id;
          if (!matches) return;

          const initiatorJid = m.sender;
          if (participant !== initiatorJid) return;

          const accepted = ['✅', '👍', '😂', '❤️', '😹'].includes(emoji);
          if (accepted) {
            cleanup();
            resolved = true;
            resolve({ by: 'reaction', who: participant, reaction: emoji });
          }
        } catch (_) {}
      };

      const onUpsert = (upsert) => {
        try {
          const payload = Array.isArray(upsert) ? upsert : [upsert];
          for (const item of payload) {
            const msgs = item.messages || item;
            const arr = Array.isArray(msgs) ? msgs : [msgs];
            for (const msg of arr) {
              if (!msg || !msg.key || !msg.message) continue;
              const fromInitiator = msg.key.participant 
                ? msg.key.participant === m.sender 
                : msg.key.remoteJid === m.sender;
              if (!fromInitiator) continue;
              const ext = msg.message.extendedTextMessage;
              const isReplyToPrompt = ext?.contextInfo?.stanzaId === promptMsg.key.id;
              const textBody = (msg.message.conversation || ext?.text || '').toLowerCase();
              const positive = ['wi','yes','ok','✅','👍','❤️'];
              const matches = positive.some(p => textBody.includes(p));
              if (isReplyToPrompt || matches) {
                cleanup();
                resolved = true;
                resolve({ by: 'text', who: msg.key.participant || msg.key.remoteJid, text: textBody });
                return;
              }
            }
          }
        } catch (_) {}
      };

      const timeout = setTimeout(() => {
        if (resolved) return;
        cleanup();
        resolve(null);
      }, timeoutMs);

      const cleanup = () => {
        detach('messages.reaction', onReaction);
        detach('messages.upsert', onUpsert);
        clearTimeout(timeout);
      };

      attach('messages.reaction', onReaction);
      attach('messages.upsert', onUpsert);
    });

    const confirmation = await waitForConfirmation(30000);
    if (!confirmation) {
      await conn.sendMessage(from, { text: '⏳ No reaction received. Menu cancelled.' }, { quoted: promptMsg });
      return;
    }

    await conn.sendMessage(from, { react: { text: '⚡', key: promptMsg.key } }).catch(()=>{});

    // Loading animation
    const stages = [
      '⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜  0%',
      '🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜  10%',
      '🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜  25%',
      '🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜  50%',
      '🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜  75%',
      '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩  100%'
    ];
    let loadingMsg;
    try {
      loadingMsg = await conn.sendMessage(from, { text: `🖤 Loading...\n${stages[0]}` }, { quoted: promptMsg });
      for (let i = 1; i < stages.length; i++) {
        await wait(500);
        try {
          await conn.sendMessage(from, { edit: loadingMsg.key, text: `🖤 Loading...\n${stages[i]}` });
        } catch {
          loadingMsg = await conn.sendMessage(from, { text: `🖤 Loading...\n${stages[i]}` });
        }
      }
      await wait(900);
      try {
        await conn.sendMessage(from, { edit: loadingMsg.key, text: `✅ Loading complete! Preparing menu...` });
      } catch {
        loadingMsg = await conn.sendMessage(from, { text: `✅ Loading complete! Preparing menu...` });
      }
    } catch (e) {
      console.warn('Loading animation failed', e);
    }

    // Uptime & RAM usage
    const uptime = () => {
      const sec = process.uptime();
      const h = Math.floor(sec / 3600);
      const mU = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      return `${h}h ${mU}m ${s}s`;
    };
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);

    // Group commands
    const grouped = {};
    for (const plugin of commands) {
      const category = (plugin.category || 'other').toUpperCase();
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(plugin);
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
    for (let k of Object.keys(grouped)) {
      menuText += `\n\n╔═══❖•ೋ 🌐 *${k} MENU* ೋ•❖═══╗\n`;
      const cmds = grouped[k].filter(c => c.pattern)
        .sort((a, b) => a.pattern.localeCompare(b.pattern));
      cmds.forEach((cmd) => {
        const usage = cmd.pattern.split('|')[0];
        menuText += `║ ➤ ${prefix}${toSmallCaps(usage)}\n`;
      });
      menuText += `╚════════════════════╝`;
    }
    menuText += `\n\n🔋 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐃𝐀𝐖𝐄𝐍𝐒 𝐁𝐎𝐘`;

    const quotedMsg = loadingMsg?.key ? loadingMsg : promptMsg;
    await conn.sendMessage(from, {
      image: { url: menuImage },
      caption: (header + menuText).trim(),
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 777,
        isForwarded: true
      }
    }, { quoted: quotedMsg });

    // Optional audio
    const audioOptions = [
      'https://files.catbox.moe/3cj1e3.mp4',
      'https://files.catbox.moe/vq3odo.mp4',
      'https://files.catbox.moe/fo2kz0.mp4'
    ];
    const randomAudio = audioOptions[Math.floor(Math.random() * audioOptions.length)];
    try {
      await conn.sendMessage(from, {
        audio: { url: randomAudio },
        mimetype: 'audio/mp4',
        ptt: true
      });
    } catch (_) {}

  } catch (e) {
    console.error('❌ Menu error:', e);
    await conn.sendMessage(from, { text: `❌ Menu Error: ${e.message || e}` }, { quoted: mek });
  }
});

export default {};