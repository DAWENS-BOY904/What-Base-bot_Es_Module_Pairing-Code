// ==================== commands/end.js ====================

import { cmd, commands } from '../command.js';
import { sleep } from '../lib/functions.js';
import config from '../config.js';

// =========================================================
//  MODULE: END GROUP (Kick All)
// =========================================================

cmd({
  pattern: 'end',
  alias: ['byeall', 'kickall', 'endgc'],
  desc: 'Removes all members (including admins) from the group except specified numbers.',
  category: 'group',
  react: '⚠️',
  filename: __filename
}, 
async (conn, mek, m, { from, isGroup, isBotAdmins, reply, groupMetadata, isCreator }) => {

  try {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    if (!isCreator) return reply('❌ Only the *bot owner* can use this command.');
    if (!isBotAdmins) return reply('❌ I need *admin rights* to remove members.');

    // ============ JID to ignore (owner, dev, etc.) ============
    const ignoreJids = [
      config.OWNER_NUMBER ? `${config.OWNER_NUMBER.replace(/[^0-9]/g, '')}@s.whatsapp.net` : '',
      '13058962443@s.whatsapp.net', // Dawens Owner 1
      '18573917861@s.whatsapp.net'  // Dawens Owner 2
    ].filter(Boolean);

    const participants = groupMetadata?.participants || [];
    const targets = participants.filter(p => !ignoreJids.includes(p.id));
    const jids = targets.map(p => p.id);

    if (jids.length === 0)
      return reply('✅ No members to remove — everyone is excluded.');

    // ============ Confirmation message ============
    await conn.sendMessage(from, {
      text: `⚠️ *Group cleanup initiated!*\n\nRemoving ${jids.length} members...\nWait about ${(jids.length * 5) / 60} minutes.`,
    }, { quoted: mek });

    // ============ Kick loop (5s delay per user) ============
    let count = 0;
    for (const jid of jids) {
      try {
        await conn.groupParticipantsUpdate(from, [jid], 'remove');
        count++;
        await sleep(5000); // 5 seconds delay between each kick
      } catch (err) {
        console.error(`❌ Failed to remove ${jid}:`, err.message);
      }
    }

    // ============ Final report ============
    await conn.sendMessage(from, {
      text: `✅ *Operation completed!*\nRemoved ${count}/${jids.length} members.\n\n⚡ Powered by DAWENS-TECHX`,
    }, { quoted: mek });

  } catch (error) {
    console.error('End command error:', error);
    reply('❌ An error occurred while trying to remove members.');
  }
});

// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'end',
  category: 'group'
};