"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
require("dotenv/config");
const commands_1 = require("./commands");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token || !clientId) {
    throw new Error("DISCORD_TOKEN e DISCORD_CLIENT_ID são obrigatórios no .env");
}
const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
const appId = clientId;
const body = commands_1.commands.map((command) => command.data.toJSON());
async function deploy() {
    if (guildId) {
        // Remove comandos globais antigos (evita duplicatas de configs anteriores)
        await rest.put(discord_js_1.Routes.applicationCommands(appId), { body: [] });
        console.log("Comandos globais antigos removidos.");
        await rest.put(discord_js_1.Routes.applicationGuildCommands(appId, guildId), { body });
        console.log(`Comandos registrados no servidor ${guildId}.`);
        return;
    }
    await rest.put(discord_js_1.Routes.applicationCommands(appId), { body });
    console.log("Comandos registrados globalmente.");
}
deploy().catch(console.error);
