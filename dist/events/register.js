"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEvents = registerEvents;
const discord_js_1 = require("discord.js");
const interactions_1 = require("../handlers/interactions");
const memberJoin_1 = require("./memberJoin");
const memberLeave_1 = require("./memberLeave");
function registerEvents(client) {
    client.once(discord_js_1.Events.ClientReady, (readyClient) => {
        console.log(`BUGGER_BOT online como ${readyClient.user.tag}`);
    });
    (0, memberJoin_1.registerMemberJoin)(client);
    (0, memberLeave_1.registerMemberLeave)(client);
    (0, interactions_1.registerInteractionHandler)(client);
}
