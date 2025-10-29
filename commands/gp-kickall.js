// ==================== /commands/gp-kickallfast.js ====================
import { fileURLToPath } from 'url';
import path from 'path';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'gp-kickallfast',
  desc: 'Kick ALL non-owner members from group immediately (Owner only, requires bot admin).',
  category: 'owner',
  react: '🔨',
  async run(conn, m, msg, args, { isOwner, isSudo, isBotAdmins, metadata, participants, reply }) {
    try {
      // Only works in group
      if (!m.isGroup && !(m.chat || '').endsWith('@g.us')) {
        return await reply('❌ Sa mache sèlman nan gwoup (group only).');
      }

      // Must be owner / sudo
      if (!isOwner && !isSudo) {
        return await reply('⛔ Se sèlman owner oswa sudo ki ka itilize kòmand sa a.');
      }

      // Bot must be admin
      if (!isBotAdmins) {
        return await reply('⚠️ Mwen dwe admin nan gwoup la pou m retire manm.');
      }

      const groupId = m.chat || (metadata?.id) || m.key.remoteJid;
      const botJid = (conn.user && conn.user.id) ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;

      // Build list of targets: all participants except owners/admins and bot and owners defined in config
      const ownersList = [];
      if (config.OWNERS && Array.isArray(config.OWNERS)) {
        for (const o of config.OWNERS) {
          ownersList.push(String(o).replace(/[^0-9]/g, '') + '@s.whatsapp.net');
        }
      }
      // also include BOT owner from config if present
      if (config.OWNER_NUMBER) {
        ownersList.push(String(config.OWNER_NUMBER).replace(/[^0-9]/g, '') + '@s.whatsapp.net');
      }

      // participants parameter might be provided by handler; if not, fetch metadata
      let groupParts = participants || (metadata && metadata.participants) || [];

      if (!groupParts || groupParts.length === 0) {
        try {
          const meta = await conn.groupMetadata(groupId);
          groupParts = meta.participants || [];
        } catch (err) {
          console.error('Failed to fetch group metadata:', err);
          return await reply('❌ Pa kapab jwenn lis manm gwoup la (metadata failed).');
        }
      }

      // Filter targets
      const targets = groupParts
        .map(p => p.id || p.jid || p)
        .filter(jid => jid) // keep only truthy
        .filter(jid => {
          // keep only real user JIDs (not the bot and not owners)
          if (botJid && jid === botJid) return false;
          if (ownersList.includes(jid)) return false;
          // keep non-admins? We choose to remove everyone except owners; if you want to preserve admins skip them
          // If participant has isAdmin property, skip admins:
          if (typeof jid === 'object') return false; // defensive
          // check in groupParts for admin role
          const p = groupParts.find(x => (x.id || x.jid || x) === jid);
          if (p && (p.admin === 'admin' || p.admin === 'superadmin')) return false;
          return true;
        });

      if (!targets || targets.length === 0) {
        return await reply('ℹ️ Pa gen manm pou retire (tout manm se owners/oswa admins/bot).');
      }

      // Confirmation step (safety) — if user did not pass force flag, require explicit "confirm"
      const force = args && args[0] && ['force', 'now', 'confirm', 'yes', 'y'].includes(args[0].toLowerCase());
      if (!force) {
        await conn.sendMessage(groupId, { text: `⚠️ Ou pral retire ${targets.length} manm. Pou konfime kouri: ${config.PREFIX || '.'}gp-kickallfast confirm` }, { quoted: m });
        return;
      }

      // Kick all in parallel (no delay)
      await reply(`⏳ Ap retire ${targets.length} manm... Tanpri tann (pafwa gen echèk si gen ratelimit).`);
      const removePromises = [];
      // Baileys accepts array or single user for groupParticipantsUpdate depending on version.
      // We'll send in batches of 10 to reduce chance of rate limits but still fast (adjust as needed).
      const batchSize = 10;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        removePromises.push(conn.groupParticipantsUpdate(groupId, batch, 'remove'));
      }

      // Execute all batches concurrently
      const results = await Promise.allSettled(removePromises);

      // Collect failures
      const failed = results
        .map((r, idx) => ({ r, idx }))
        .filter(x => x.r.status === 'rejected')
        .map(x => ({ batchIndex: x.idx, reason: x.r.reason }));

      if (failed.length === 0) {
        await conn.sendMessage(groupId, { text: `✅ Fini! ${targets.length} manm retire avèk siksè.` }, { quoted: m });
      } else {
        await conn.sendMessage(groupId, { text: `⚠️ Fini, men gen ${failed.length} batch ki echwe. Konsilte logs pou plis detay.` }, { quoted: m });
        console.error('gp-kickallfast failures:', failed);
      }

    } catch (err) {
      console.error('gp-kickallfast error:', err);
      await reply(`❌ Erè pandan exec: ${err.message || err}`);
    }
  }
};
