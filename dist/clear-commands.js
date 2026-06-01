"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token || !clientId) {
    throw new Error("DISCORD_TOKEN e DISCORD_CLIENT_ID são obrigatórios no .env");
}
const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
async function clear() {
    const appId = clientId;
    await rest.put(discord_js_1.Routes.applicationCommands(appId), { body: [] });
    console.log("Comandos globais removidos.");
    if (guildId) {
        await rest.put(discord_js_1.Routes.applicationGuildCommands(appId, guildId), { body: [] });
        console.log(`Comandos do servidor ${guildId} removidos.`);
    }
}
clear().catch(console.error);
