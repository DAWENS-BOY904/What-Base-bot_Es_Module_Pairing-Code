// ==================== commands/gp-mute.js ====================

import { delay } from "../lib/functions.js";
import config from "../config.js";

// =========================================================
//  MODULE: GROUP MUTE / UNMUTE
// =========================================================

export default {
  name: "gp-mute",
  alias: ["mute", "closegroup"],
  desc: "Ferme le groupe (messages seulement pour les admins).",
  category: "group",
  react: "🔒",
  adminOnly: true,
  botAdminOnly: true,
  groupOnly: true,

  async run(conn, m, msg, args, { reply, isAdmins, isBotAdmins, metadata }) {
    try {
      if (!isAdmins)
        return reply("🚫 Seuls les *admins* peuvent utiliser cette commande.");
      if (!isBotAdmins)
        return reply("⚠️ Je dois être admin pour fermer le groupe.");

      await conn.groupSettingUpdate(m.chat, "announcement"); // fermeture
      await delay(1200);
      await conn.sendMessage(m.chat, {
        text: `🔒 *Groupe fermé avec succès !*\n🧩 Seuls les *admins* peuvent envoyer des messages.`,
      });

    } catch (err) {
      console.error("❌ Erreur gp-mute:", err);
      await reply("❌ Impossible de fermer le groupe.");
    }
  },
};

// =========================================================
//  MODULE: GROUP UNMUTE
// =========================================================

export const unmute = {
  name: "gp-unmute",
  alias: ["unmute", "opengroup"],
  desc: "Rouvre le groupe (messages pour tous les membres).",
  category: "group",
  react: "🔓",
  adminOnly: true,
  botAdminOnly: true,
  groupOnly: true,

  async run(conn, m, msg, args, { reply, isAdmins, isBotAdmins }) {
    try {
      if (!isAdmins)
        return reply("🚫 Seuls les *admins* peuvent utiliser cette commande.");
      if (!isBotAdmins)
        return reply("⚠️ Je dois être admin pour rouvrir le groupe.");

      await conn.groupSettingUpdate(m.chat, "not_announcement"); // ouverture
      await delay(1200);
      await conn.sendMessage(m.chat, {
        text: `🔓 *Groupe rouvert !*\n👥 Tous les membres peuvent maintenant envoyer des messages.`,
      });

    } catch (err) {
      console.error("❌ Erreur gp-unmute:", err);
      await reply("❌ Impossible de rouvrir le groupe.");
    }
  },
};
