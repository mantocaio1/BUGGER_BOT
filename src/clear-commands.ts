import { REST, Routes } from "discord.js";
import "dotenv/config";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  throw new Error("DISCORD_TOKEN e DISCORD_CLIENT_ID são obrigatórios no .env");
}

const rest = new REST({ version: "10" }).setToken(token);

async function clear() {
  const appId = clientId as string;

  await rest.put(Routes.applicationCommands(appId), { body: [] });
  console.log("Comandos globais removidos.");

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] });
    console.log(`Comandos do servidor ${guildId} removidos.`);
  }
}

clear().catch(console.error);
