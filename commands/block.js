// ==================== /commands/block.js ====================
import config from "../config.js";

export default {
  name: "block",
  alias: ["blok", "ban"],
  description: "Block a user (Owner only)",
  category: "owner",

  async run(conn, m, msg, args, { reply }) {
    try {
      const botOwner = conn.user.id.split(":")[0] + "@s.whatsapp.net";

      if (m.sender !== botOwner) {
        await reply("❌ Only the bot owner can use this command.");
        return;
      }

      // --- Identify target user JID ---
      let jid;
      if (m.quoted) jid = m.quoted.sender;
      else if (m.mentionedJid?.length > 0) jid = m.mentionedJid[0];
      else if (args[0]?.includes("@")) jid = args[0].replace(/[@\s]/g, "") + "@s.whatsapp.net";
      else {
        await reply("⚠️ Please mention or reply to a user to block.");
        return;
      }

      await conn.updateBlockStatus(jid, "block");
      await reply(`🚫 User @${jid.split("@")[0]} has been *blocked*!`, { mentions: [jid] });

    } catch (error) {
      console.error("❌ Block command error:", error);
      await reply("❌ Failed to block the user.");
    }
  }
};

// ==================== /commands/unblock.js ====================
export const unblock = {
  name: "unblock",
  alias: ["ublock", "unban"],
  description: "Unblock a user (Owner only)",
  category: "owner",

  async run(conn, m, msg, args, { reply }) {
    try {
      const botOwner = conn.user.id.split(":")[0] + "@s.whatsapp.net";

      if (m.sender !== botOwner) {
        await reply("❌ Only the bot owner can use this command.");
        return;
      }

      // --- Identify target user JID ---
      let jid;
      if (m.quoted) jid = m.quoted.sender;
      else if (m.mentionedJid?.length > 0) jid = m.mentionedJid[0];
      else if (args[0]?.includes("@")) jid = args[0].replace(/[@\s]/g, "") + "@s.whatsapp.net";
      else {
        await reply("⚠️ Please mention or reply to a user to unblock.");
        return;
      }

      await conn.updateBlockStatus(jid, "unblock");
      await reply(`🔓 User @${jid.split("@")[0]} has been *unblocked*!`, { mentions: [jid] });

    } catch (error) {
      console.error("❌ Unblock command error:", error);
      await reply("❌ Failed to unblock the user.");
    }
  }
};
