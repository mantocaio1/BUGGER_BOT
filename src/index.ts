import "dotenv/config";
import { BuggerBot } from "./client";
import { loadCommands } from "./commands";
import { registerEvents } from "./events/register";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN não definido no arquivo .env");
}

const client = new BuggerBot();

loadCommands(client);
registerEvents(client);

client.login(token);
