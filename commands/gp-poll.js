//---------------------------------------------------------------------------
//           DAWENS-BOY  
//---------------------------------------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE ⚠️  
//---------------------------------------------------------------------------
// ==================== commands/gp-poll.js ====================

import config from "../config.js";

// =========================================================
//  MODULE: GROUP POLL (ESM COMPATIBLE)
// =========================================================

export default {
  name: "poll",
  alias: ["gpoll", "survey", "sondage"],
  desc: "Create a poll in group chat.",
  category: "group",
  react: "📊",
  groupOnly: true,

  async run(conn, m, msg, args, { reply, isGroup, metadata }) {
    try {
      if (!isGroup) {
        return reply("❌ Cette commande ne peut être utilisée que dans un groupe.");
      }

      // Si pa gen paramèt, montre syntax la
      if (!args.length) {
        return reply(
          `📊 *Créer un sondage dans le groupe*\n\n` +
          `Exemple:\n` +
          `> ${config.PREFIX}poll Quel est votre langage préféré? | JavaScript | Python | C++ | Java`
        );
      }

      // Sépare titre ak opsyon yo
      const [questionPart, ...optionsPart] = args.join(" ").split("|").map(a => a.trim());

      if (!questionPart || optionsPart.length < 2) {
        return reply("⚠️ Format invalide.\n> Ex: .poll Quelle couleur préférez-vous ? | Rouge | Bleu | Vert");
      }

      const pollQuestion = questionPart;
      const pollOptions = optionsPart.filter(opt => opt.length > 0);

      // ✅ Envoi du sondage
      await conn.sendMessage(m.chat, {
        poll: {
          name: pollQuestion,
          values: pollOptions,
          selectableCount: 1
        }
      });

      await conn.sendMessage(m.chat, {
        text: `✅ *Sondage créé avec succès !*\n📋 Question: *${pollQuestion}*\n🗳️ Options:\n${pollOptions.map(o => `- ${o}`).join("\n")}`
      });

    } catch (e) {
      console.error("❌ Poll Error:", e);
      reply(`⚠️ Une erreur est survenue lors de la création du sondage.\n\n${e.message}`);
    }
  }
};
