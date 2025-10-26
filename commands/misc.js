// ==================== commands/viewonce.js ====================

import { cmd } from "../command.js";
import axios from "axios";

// =========================================================
//  MODULE VIEWONCE SYSTEM by DAWENS TECHX
// =========================================================

// =============== MODEL 1: BASIC VIEWONCE FETCH ===============
cmd({
  pattern: 'vv3',
  alias: ['retrieve', '🔥', 'viewonce'],
  desc: 'Fetch and resend a ViewOnce media message (image, video, audio).',
  category: 'misc',
  use: '<reply_to_viewonce>',
  filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
  try {
    const quoted = m.quoted || m.msg?.contextInfo?.quotedMessage;
    if (!quoted) return reply('⚠️ Please reply to a ViewOnce message.');

    let messageObj = quoted.viewOnceMessageV2?.message || quoted.message || null;
    if (!messageObj) return reply('❌ Not a valid ViewOnce message.');

    // Handle each media type
    if (messageObj.imageMessage) {
      const cap = messageObj.imageMessage.caption || '';
      const file = await conn.downloadAndSaveMediaMessage(messageObj.imageMessage);
      return conn.sendMessage(from, { image: { url: file }, caption: cap }, { quoted: mek });
    } 
    if (messageObj.videoMessage) {
      const cap = messageObj.videoMessage.caption || '';
      const file = await conn.downloadAndSaveMediaMessage(messageObj.videoMessage);
      return conn.sendMessage(from, { video: { url: file }, caption: cap }, { quoted: mek });
    }
    if (messageObj.audioMessage) {
      const file = await conn.downloadAndSaveMediaMessage(messageObj.audioMessage);
      return conn.sendMessage(from, { audio: { url: file } }, { quoted: mek });
    }

    return reply('⚠️ Unsupported ViewOnce media type.');
  } catch (e) {
    console.error('ViewOnce fetch error:', e);
    reply('❌ Error while fetching ViewOnce message.');
  }
});


// =============== MODEL 2: FULL VIEWONCE FETCH (ALL TYPES) ===============
cmd({
  pattern: 'vv3full',
  alias: ['viewoncefull', 'vfull'],
  desc: 'Fetch and resend any ViewOnce message (image, video, audio, sticker, document).',
  category: 'misc',
  use: '<reply_to_viewonce>',
  filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
  try {
    const quoted = m.quoted || m.msg?.contextInfo?.quotedMessage;
    if (!quoted) return reply('⚠️ Please reply to a ViewOnce message.');

    let msg = quoted.viewOnceMessageV2?.message || quoted.message || null;
    if (!msg) return reply('❌ Not a valid ViewOnce message.');

    if (msg.imageMessage) {
      const cap = msg.imageMessage.caption || '';
      const file = await conn.downloadAndSaveMediaMessage(msg.imageMessage);
      return conn.sendMessage(from, { image: { url: file }, caption: cap }, { quoted: mek });
    }
    if (msg.videoMessage) {
      const cap = msg.videoMessage.caption || '';
      const file = await conn.downloadAndSaveMediaMessage(msg.videoMessage);
      return conn.sendMessage(from, { video: { url: file }, caption: cap }, { quoted: mek });
    }
    if (msg.audioMessage) {
      const file = await conn.downloadAndSaveMediaMessage(msg.audioMessage);
      return conn.sendMessage(from, { audio: { url: file } }, { quoted: mek });
    }
    if (msg.stickerMessage) {
      const file = await conn.downloadAndSaveMediaMessage(msg.stickerMessage);
      return conn.sendMessage(from, { sticker: { url: file } }, { quoted: mek });
    }
    if (msg.documentMessage) {
      const file = await conn.downloadAndSaveMediaMessage(msg.documentMessage);
      return conn.sendMessage(from, {
        document: { url: file, mimetype: msg.documentMessage.mimetype, fileName: msg.documentMessage.fileName || 'file' }
      }, { quoted: mek });
    }

    reply('⚠️ Unsupported ViewOnce media type.');
  } catch (e) {
    console.error('Error fetching ViewOnce Full:', e);
    reply('❌ An error occurred while fetching ViewOnce message.');
  }
});


// =============== MODEL 3: VIEWONCE WITH EXPIRY NOTICE ===============
cmd({
  pattern: 'vv3notify',
  alias: ['viewoncealert', 'viewonceinfo'],
  desc: 'Fetch ViewOnce content and notify about expiration.',
  category: 'misc',
  use: '<reply_to_viewonce>',
  filename: __filename,
}, 
async (conn, mek, m, { from, reply }) => {
  try {
    const quoted = m.quoted || m.msg?.contextInfo?.quotedMessage;
    if (!quoted) return reply('⚠️ Please reply to a ViewOnce message.');

    let msg = quoted.viewOnceMessageV2?.message || quoted.message || null;
    if (!msg) return reply('❌ Not a valid ViewOnce message.');

    const expireWarning = '⚠️ *Note:* This ViewOnce message will disappear soon. Saved temporarily by MINI-JESUS-BOT.';

    if (msg.imageMessage) {
      const cap = msg.imageMessage.caption || '';
      const file = await conn.downloadAndSaveMediaMessage(msg.imageMessage);
      await conn.sendMessage(from, { image: { url: file }, caption: cap }, { quoted: mek });
      return reply(expireWarning);
    }
    if (msg.videoMessage) {
      const cap = msg.videoMessage.caption || '';
      const file = await conn.downloadAndSaveMediaMessage(msg.videoMessage);
      await conn.sendMessage(from, { video: { url: file }, caption: cap }, { quoted: mek });
      return reply(expireWarning);
    }
    if (msg.audioMessage) {
      const file = await conn.downloadAndSaveMediaMessage(msg.audioMessage);
      await conn.sendMessage(from, { audio: { url: file } }, { quoted: mek });
      return reply(expireWarning);
    }

    reply('⚠️ Unsupported ViewOnce media type.');
  } catch (e) {
    console.error('Error fetching ViewOnce with notify:', e);
    reply('❌ An error occurred while fetching the ViewOnce message.');
  }
});


// =========================================================
//  EXPORT MODULE
// =========================================================
module.exports = {
  name: 'viewonce',
  category: 'misc',
};
