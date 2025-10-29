// ==================== commands/tagall.js ====================

import config from "../config.js";

// =========================================================
//  MODULE: TAGALL COMMAND (MENTION ALL MEMBERS)
// =========================================================

export default {
  name: "tagall",
  alias: ["everyone", "mentionall", "all"],
  desc: "Mention all group members",
  category: "group",
  react: "📣",

  // --- MAIN FUNCTION ---
  async run(conn, m, msg, args, { metadata, participants, isGroup, isAdmins, isOwner, reply }) {
    try {
      // Vérifie si c’est bien un groupe
      if (!isGroup) {
        return reply("⚠️ Cette commande ne peut être utilisée que dans un *groupe*.");
      }

      // Vérifie si l'utilisateur a le droit
      if (!isAdmins && !isOwner) {
        return reply("🚫 Seuls les *admins* ou le *propriétaire du bot* peuvent taguer tout le monde.");
      }

      // Message perso si l’utilisateur ajoute un texte
      const text = args.join(" ") || "📢 *TAGALL!*";

      // Liste des membres
      const members = participants.map(p => p.id);

      // Formattage du message
      const mentionMessage = `
╭───〔 *📣 TAGALL MESSAGE* 〕───◉
│
│💬 *Message:* ${text}
│👥 *Membres:* ${members.length}
│
╰────────────────────◉
> _Envoyé par @${m.sender.split("@")[0]}_
      `.trim();

      // Envoie du message avec mentions
      await conn.sendMessage(
        m.chat,
        {
          text: mentionMessage,
          mentions: members,
          contextInfo: {
            mentionedJid: members,
            externalAdReply: {
              title: config.BOT_NAME || "MINI-JESUS-BOT",
              body: "📣 Tagall command by Dawens-TechX",
              thumbnailUrl: config.ALIVE_IMAGE || "https://files.catbox.moe/x16nfd.png",
              sourceUrl: "https://whatsapp.com/channel/0029Vb6tScFDzgTAcKNphY2i"
            }
          }
        },
        { quoted: m }
      );

    } catch (e) {
      console.error("❌ Tagall Error:", e);
      reply("⚠️ Une erreur est survenue pendant le tagall.");
    }
  }
};
