// ==================== commands/group.js ====================

import config from '../config.js';
import { cmd, commands } from '../command.js';
import { getGroupAdmins, runtime, sleep } from '../lib/functions.js';

// =========================================================
// 🔇 MUTE GROUP COMMAND
// =========================================================
cmd({
  pattern: "mute",
  alias: ["groupmute"],
  react: "🔇",
  desc: "Mute the group (Only admins can send messages).",
  category: "group",
  filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");
    if (!isBotAdmins) return reply("❌ I need to be an admin to mute the group.");

    await conn.groupSettingUpdate(from, "announcement");
    await reply("✅ Group has been muted.\nOnly admins can send messages now.");
  } catch (e) {
    console.error("Error muting group:", e);
    reply("❌ Failed to mute the group. Please try again.");
  }
});


// =========================================================
// 📢 TAG ALL COMMAND
// =========================================================
cmd({
  pattern: "tagall",
  alias: ["all", "mentionall", "gp-tag"],
  react: "📣",
  desc: "Tag all group members.",
  category: "group",
  filename: __filename
},
async (conn, mek, m, { from, isGroup, participants, isAdmins, reply }) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins) return reply("❌ Only group admins can use this command.");

    const groupMetadata = await conn.groupMetadata(from);
    const groupName = groupMetadata.subject;
    const members = groupMetadata.participants || [];

    if (!members.length) return reply("⚠️ No members found in this group.");

    // Style header
    let tagHeader = `
╭───〔 *GROUP TAG* 〕───⬣
│ 📢 Group: *${groupName}*
│ 👑 Admin: @${m.sender.split('@')[0]}
│ 👥 Total Members: *${members.length}*
╰──────────────⬣

`.trim();

    // Liste tout manm yo avèk tag
    let tagBody = members.map((mem, i) => `🔹 ${i + 1}. @${mem.id.split('@')[0]}`).join('\n');

    // Konbine
    const caption = `${tagHeader}\n${tagBody}\n\n⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐃𝐀𝐖𝐄𝐍𝐒-𝐁𝐎𝐘`;

    // Envoye mesaj ak mention tout moun
    await conn.sendMessage(from, {
      text: caption,
      mentions: members.map(m => m.id)
    }, { quoted: mek });

    // Ti efè son (si ou vle)
    try {
      await sleep(1500);
      await conn.sendMessage(from, {
        audio: { url: 'https://files.catbox.moe/vq3odo.mp4' },
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: mek });
    } catch (e) { /* ignore */ }

  } catch (e) {
    console.error("Error tagging all members:", e);
    reply("❌ Failed to tag all members. Please try again.");
  }
});


// =========================================================
// EXPORT MODULE
// =========================================================
module.exports = {
  name: 'group',
  category: 'group'
};