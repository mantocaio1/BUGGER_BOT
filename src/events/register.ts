import { Events } from "discord.js";
import { BuggerBot } from "../client";
import { registerInteractionHandler } from "../handlers/interactions";
import { registerMemberJoin } from "./memberJoin";

export function registerEvents(client: BuggerBot) {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`BUGGER_BOT online como ${readyClient.user.tag}`);
  });

  registerMemberJoin(client);
  registerInteractionHandler(client);
}
