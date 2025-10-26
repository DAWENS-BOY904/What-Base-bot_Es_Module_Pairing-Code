// ==================== commands/block.js ====================

import { cmd } from '../command.js';
import config from '../config.js';
import { contextInfo } from '../system/contextInfo.js';

// =========================================================
//  BLOCK COMMAND
// =========================================================

cmd({
  pattern: 'block',
  alias: ['blok', 'ban'],
  desc: 'Block a user (Owner only)',
  category: 'owner',
  react: '🚫',
  filename: __filename,
}, 
async (conn, mek, m, { reply, q, react }) => {
  try {
    const botOwner = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    if (m.sender !== botOwner) {
      await react('❌');
      return reply('❌ Only the bot owner can use this command.');
    }

    // --- Identify target user JID ---
    let jid;
    if (m.quoted) jid = m.quoted.sender;
    else if (m.mentionedJid && m.mentionedJid.length > 0) jid = m.mentionedJid[0];
    else if (q && q.includes('@')) jid = q.replace(/[@\s]/g, '') + '@s.whatsapp.net';
    else {
      await react('❌');
      return reply('⚠️ Please mention or reply to a user to block.');
    }

    // --- Perform block ---
    await conn.updateBlockStatus(jid, 'block');
    await react('✅');
    await reply(`🚫 User @${jid.split('@')[0]} has been *blocked*!`, { mentions: [jid] });

  } catch (error) {
    console.error('Block command error:', error);
    await react('❌');
    reply('❌ Failed to block the user.');
  }
});

// =========================================================
//  UNBLOCK COMMAND
// =========================================================

cmd({
  pattern: 'unblock',
  alias: ['ublock', 'unban'],
  desc: 'Unblock a user (Owner only)',
  category: 'owner',
  react: '🔓',
  filename: __filename,
}, 
async (conn, mek, m, { reply, q, react }) => {
  try {
    const botOwner = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    if (m.sender !== botOwner) {
      await react('❌');
      return reply('❌ Only the bot owner can use this command.');
    }

    // --- Identify target user JID ---
    let jid;
    if (m.quoted) jid = m.quoted.sender;
    else if (m.mentionedJid && m.mentionedJid.length > 0) jid = m.mentionedJid[0];
    else if (q && q.includes('@')) jid = q.replace(/[@\s]/g, '') + '@s.whatsapp.net';
    else {
      await react('❌');
      return reply('⚠️ Please mention or reply to a user to unblock.');
    }

    // --- Perform unblock ---
    await conn.updateBlockStatus(jid, 'unblock');
    await react('✅');
    await reply(`🔓 User @${jid.split('@')[0]} has been *unblocked*!`, { mentions: [jid] });

  } catch (error) {
    console.error('Unblock command error:', error);
    await react('❌');
    reply('❌ Failed to unblock the user.');
  }
});

// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'block-module',
  category: 'owner'
};