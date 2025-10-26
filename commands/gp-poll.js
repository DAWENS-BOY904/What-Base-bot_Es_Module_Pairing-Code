//---------------------------------------------------------------------------
//           DAWENS-BOY  
//---------------------------------------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE ⚠️  
//---------------------------------------------------------------------------
import { cmd, commands } from '../command.js';
import config from '../config.js';
const prefix = config.PREFIX;

import fs, { writeFileSync } from 'fs';
import path from 'path';

import {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  sleep,
  fetchJson
} from '../lib/functions2.js';

cmd({
  pattern: "poll",
  category: "group",
  desc: "Create a poll with a question and options in the group.",
  filename: __filename,
}, async (conn, mek, m, { from, isGroup, body, sender, groupMetadata, participants, prefix, pushname, reply }) => {
  try {
    let [question, optionsString] = body.split(";");
    
    if (!question || !optionsString) {
      return reply(`Usage: ${prefix}poll question;option1,option2,option3...`);
    }

    let options = [];
    for (let option of optionsString.split(",")) {
      if (option && option.trim() !== "") {
        options.push(option.trim());
      }
    }

    if (options.length < 2) {
      return reply("*Please provide at least two options for the poll.*");
    }

    await conn.sendMessage(from, {
      poll: {
        name: question,
        values: options,
        selectableCount: 1,
        toAnnouncementGroup: true,
      }
    }, { quoted: mek });
  } catch (e) {
    return reply(`*An error occurred while processing your request.*\n\n_Error:_ ${e.message}`);
  }
});
