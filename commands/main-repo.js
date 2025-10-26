// ==================== commands/repo.js ====================

import config from '../config.js';
import { cmd, commands } from '../command.js';
import os from 'os';
import { runtime, sleep } from '../system/func.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// =========================================================
//  MODULE: REPO COMMAND
// =========================================================

cmd({
  pattern: 'repo',
  alias: ['sc', 'script', 'repository'],
  desc: 'Fetch information about the GitHub repository.',
  react: '📂',
  category: 'menu',
  filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
  const githubRepoURL = 'https://github.com/Dawensboytech/MINI-JESUS-CRASH-';

  try {
    // --- Extract username and repo name from URL ---
    const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);

    // --- Fetch repo data from GitHub API ---
    const { data: repo } = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);

    // --- Format text ---
    const formattedInfo = `
╭─〔 *${repo.name.toUpperCase()} REPOSITORY* 〕
│
├─ *👑 Owner:* ᴅᴀᴡᴇɴs-ʈ𝛆̽ɕ̄ⴙ
├─ *⭐ Stars:* ${repo.stargazers_count}
├─ *⑂ Forks:* ${repo.forks_count}
├─ *📝 Description:* ${repo.description || 'World Best WhatsApp Bot powered by DAWENS-TECHX'}
│
├─ *🔗 GitHub Link:*
│   ${repo.html_url}
│
├─ *🌐 Join Channel:*
│   https://whatsapp.com/channel/0029VbCHd5V1dAw132PB7M1B
│
╰─ *⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐃𝐀𝐖𝐄𝐍𝐒 𝐓𝐄𝐂𝐇𝐗*
`.trim();

    // --- Send Image + Caption ---
    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/4t5hvc.png' },
      caption: formattedInfo,
      contextInfo: { 
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363419768812867@newsletter',
          newsletterName: 'MINI-JESUS-CRASH',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    // --- Optional: Play Audio ---
    const audioPath = path.join(__dirname, '../all/menux.m4a');
    if (fs.existsSync(audioPath)) {
      await conn.sendMessage(from, {
        audio: { url: audioPath },
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: mek });
    }

  } catch (error) {
    console.error('Error in repo command:', error);
    reply('❌ Une erreur est survenue lors de la récupération des informations du dépôt GitHub.');
  }
});

// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'repo',
  category: 'menu'
};