import { REST, Routes } from "discord.js";
import "dotenv/config";
import { commands } from "./commands";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  throw new Error("DISCORD_TOKEN e DISCORD_CLIENT_ID são obrigatórios no .env");
}

const rest = new REST({ version: "10" }).setToken(token);
const appId = clientId;
const body = commands.map((command) => command.data.toJSON());

async function deploy() {
  if (guildId) {
    // Remove comandos globais antigos (evita duplicatas de configs anteriores)
    await rest.put(Routes.applicationCommands(appId), { body: [] });
    console.log("Comandos globais antigos removidos.");

    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
    console.log(`Comandos registrados no servidor ${guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(appId), { body });
  console.log("Comandos registrados globalmente.");
}

deploy().catch(console.error);
