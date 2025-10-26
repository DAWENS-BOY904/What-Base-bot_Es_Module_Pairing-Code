// ==================== commands/pair.js ====================

import axios from 'axios';
import { cmd, commands } from '../command.js';


// =========================================================
//  MODULE: PAIRING COMMANDS (PAIR / PAIR2)
// =========================================================

cmd({
  pattern: 'pair',
  alias: ['getpair', 'clonebot'],
  react: '✅',
  desc: 'Get pairing code for GHAFFAR-MD bot',
  category: 'main',
  use: '.pair 923427582XXX',
  filename: __filename
}, async (conn, mek, m, { from, senderNumber, reply, q }) => {
  try {
    // --- Extract phone number ---
    const phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : senderNumber.replace(/[^0-9]/g, '');

    if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
      return await reply('❌ Please provide a valid phone number without `+`\nExample: `.pair 923427582XXX`');
    }

    // --- Request pairing code from API ---
    const response = await axios.get(`https://jesus-crash-v1-pair.onrender.com/code?number=${encodeURIComponent(phoneNumber)}`);
    const pairingCode = response.data?.code;

    if (!pairingCode) {
      return await reply('❌ Failed to retrieve pairing code. Please try again later.');
    }

    const doneMessage = '> *MINI-JESUS-CRASH PAIRING COMPLETED*';

    // --- Send results ---
    await reply(`${doneMessage}\n\n*Your pairing code is:* ${pairingCode}`);

    // Small delay
    await new Promise(res => setTimeout(res, 2000));

    // --- Resend clean code ---
    await reply(`${pairingCode}`);

  } catch (err) {
    console.error('Pair command error:', err);
    await reply('❌ An error occurred while getting pairing code. Please try again later.');
  }
});

// =========================================================
//  SECONDARY PAIR COMMAND (PAIR2)
// =========================================================

cmd({
  pattern: 'pair2',
  alias: ['getpair2', 'reqpair', 'clonebot2'],
  react: '📉',
  desc: 'Get pairing code for MINI-JESUS-CRASH bot',
  category: 'main',
  use: '.pair2 923427582XXX',
  filename: __filename
}, async (conn, mek, m, { from, isGroup, senderNumber, reply, q }) => {
  try {
    if (isGroup) {
      return await reply('❌ This command only works in private chat. Please message me directly.');
    }

    // Show ⏳ reaction
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    const phoneNumber = q ? q.trim().replace(/[^0-9]/g, '') : senderNumber.replace(/[^0-9]/g, '');
    if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
      return await reply('❌ Invalid phone number format!\n\nPlease use: `.pair2 923000000000`\n(Without + sign)');
    }

    // Fetch pairing code
    const response = await axios.get(`https://jesus-crash-v1-pair.onrender.com/code?number=${encodeURIComponent(phoneNumber)}`);
    const pairingCode = response.data?.code;

    if (!pairingCode) {
      return await reply('❌ Failed to get pairing code. Please try again later.');
    }

    // Send image with code caption
    await conn.sendMessage(from, {
      image: { url: 'https://files.catbox.moe/qfi0h5.jpg' },
      caption: `- *Pairing Code For MINI-JESUS-CRASH ⚡*\n\nNotification has been sent to your WhatsApp.\nPlease check your phone and copy this code to pair it and get your *MINI-JESUS-CRASH* session id.\n\n*🔢 Pairing Code:* *${pairingCode}*\n\n> *Copy it from below message 👇🏻*`
    }, { quoted: m });

    // Send clean pairing code
    await reply(pairingCode);

    // React ✅
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (err) {
    console.error('Pair2 command error:', err);
    await reply('❌ An error occurred. Please try again later.');
  }
});

// =========================================================
//  EXPORT MODULE INFO
// =========================================================
module.exports = {
  name: 'pair',
  category: 'main'
};