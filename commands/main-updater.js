// ==================== commands/update.js ====================

import { cmd } from "../command.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { setCommitHash, getCommitHash } from "../system/updateDB.js";

// =========================================================
//  MODULE: UPDATE COMMAND
// =========================================================

cmd({
  pattern: "update",
  alias: ["upgrade", "sync"],
  react: "🆕",
  desc: "Update the bot to the latest GitHub version.",
  category: "menu",
  filename: __filename,
}, 
async (conn, mek, m, { from, reply, isOwner }) => {

  if (!isOwner) return reply("🚫 This command is restricted to the *Bot Owner* only.");

  try {
    await reply("🔍 *Checking for updates from GitHub...*");

    // --- Get latest commit hash from GitHub ---
    const { data: commitData } = await axios.get("https://api.github.com/repos/Dawensboytech/MINI-JESUS-CRASH-/commits/main");
    const latestCommit = commitData.sha;
    const currentCommit = await getCommitHash();

    if (latestCommit === currentCommit) {
      return reply("✅ *Your MINI-JESUS-CRASH Bot is already up-to-date!*");
    }

    await reply("🚀 *Updating MINI-JESUS-CRASH Bot...*");

    // --- Download ZIP from GitHub ---
    const zipPath = path.join(__dirname, "latest.zip");
    const { data: zipFile } = await axios.get("https://github.com/Dawensboytech/MINI-JESUS-CRASH-/archive/main.zip", { responseType: "arraybuffer" });
    fs.writeFileSync(zipPath, zipFile);

    // --- Extract ZIP ---
    await reply("📦 *Extracting the latest version...*");
    const extractPath = path.join(__dirname, "latest");
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // --- Copy files except config.js and app.json ---
    await reply("🔄 *Replacing old files...*");
    const sourceDir = path.join(extractPath, "MINI-JESUS-CRASH--main");
    const targetDir = path.join(__dirname, "..");
    copyFolderSync(sourceDir, targetDir);

    // --- Save new commit hash ---
    await setCommitHash(latestCommit);

    // --- Cleanup temp files ---
    fs.unlinkSync(zipPath);
    fs.rmSync(extractPath, { recursive: true, force: true });

    await reply("✅ *Update completed successfully! Restarting bot...*");

    // --- Restart bot ---
    process.exit(0);

  } catch (err) {
    console.error("❌ Update Error:", err);
    reply("⚠️ Update failed. Please check your internet connection or try again later.");
  }
});

// =========================================================
//  HELPER FUNCTION - COPY FOLDER
// =========================================================

function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

  const items = fs.readdirSync(source);
  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);

    // Preserve custom files
    if (["config.js", "app.json"].includes(item)) {
      console.log(`🔒 Preserving custom file: ${item}`);
      continue;
    }

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// =========================================================
//  EXPORT MODULE
// =========================================================

module.exports = {
  name: "update",
  category: "menu"
};