// ==================== commands/version.js ====================

import axios from 'axios';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { cmd, commands } from '../command.js';
import { contextInfo } from '../system/contextInfo.js';
import { contextInfo } from '../system/func.js';

// =========================================================
//   MODULE: VERSION / UPDATE CHECK
// =========================================================

cmd({
  pattern: 'version',
  alias: ['changelog', 'cupdate', 'checkupdate'],
  desc: "Check bot's version, system stats, and update info.",
  react: '🚀',
  category: 'utility',
  filename: __filename
}, 
async (conn, mek, m, { from, pushname, reply }) => {
  try {
    // --- LOCAL VERSION INFO ---
    const localVersionPath = path.join(__dirname, '../data/version.json');
    let localVersion = 'Unknown';
    let changelog = 'No changelog available.';
    if (fs.existsSync(localVersionPath)) {
      const localData = JSON.parse(fs.readFileSync(localVersionPath));
      localVersion = localData.version || 'Unknown';
      changelog = localData.changelog || 'No changelog available.';
    }

    // --- FETCH REMOTE VERSION FROM GITHUB ---
    const remoteURL = 'https://raw.githubusercontent.com/dawens8/MINI-JESUS-CRASH/main/data/version.json';
    let latestVersion = localVersion;
    let latestChangelog = changelog;

    try {
      const { data } = await axios.get(remoteURL, { timeout: 8000 });
      latestVersion = data.version || localVersion;
      latestChangelog = data.changelog || changelog;
    } catch (err) {
      console.warn('⚠️ Could not fetch remote version:', err.message);
    }

    // --- COUNT PLUGINS & COMMANDS ---
    const pluginPath = path.join(__dirname, '../commands');
    const pluginCount = fs.existsSync(pluginPath)
      ? fs.readdirSync(pluginPath).filter(f => f.endsWith('.js')).length
      : 0;

    const totalCommands = commands.length;

    // --- SYSTEM INFO ---
    const uptime = runtime(process.uptime());
    const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
    const hostName = os.hostname();
    const lastUpdate = fs.existsSync(localVersionPath)
      ? fs.statSync(localVersionPath).mtime.toLocaleString()
      : 'Unknown';

    // --- CHECK UPDATE STATUS ---
    const updateMessage =
      localVersion === latestVersion
        ? `✅ *Your MINI JESUS CRASH bot is up-to-date!*`
        : `⚠️ *Your bot is outdated!*\n🔹 Current: ${localVersion}\n🔹 Latest: ${latestVersion}\n\nUse *.update* to update.`;

    // --- BUILD STATUS MESSAGE ---
    const greeting = new Date().getHours() < 12 ? 'Morning' : 'Evening';
    const statusText = `
🌟 *Good ${greeting}, ${pushname || 'User'}!* 🌟

📌 *Bot Name:* MINI JESUS CRASH
🔖 *Current Version:* ${localVersion}
📢 *Latest Version:* ${latestVersion}
📂 *Total Plugins:* ${pluginCount}
🔢 *Total Commands:* ${totalCommands}

💾 *System Info:*
⏳ *Uptime:* ${uptime}
📟 *RAM Usage:* ${ramUsed}MB / ${totalRam}MB
⚙️ *Host:* ${hostName}
📅 *Last Update:* ${lastUpdate}

📝 *Changelog:*
${latestChangelog}

⭐ *GitHub:* https://github.com/dawens8/MINI-JESUS-CRASH
👤 *Owner:* [DAWENS8](https://github.com/dawens8)

${updateMessage}

🚀 *Don't forget to fork & star the repo!*`.trim();

    // --- SEND MESSAGE WITH IMAGE ---
    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/x16nfd.png' },
      caption: statusText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363419768812867@newsletter',
          newsletterName: 'MINI JESUS',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

  } catch (error) {
    console.error('❌ Version command error:', error);
    reply('❌ An error occurred while checking the bot version.');
  }
});

// =========================================================
//   EXPORT MODULE
// =========================================================
module.exports = {
  name: 'version',
  category: 'utility'
};