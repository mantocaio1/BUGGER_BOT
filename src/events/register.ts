import { Events } from "discord.js";
import { BuggerBot } from "../client";
import { registerInteractionHandler } from "../handlers/interactions";
import { registerMemberJoin } from "./memberJoin";
import { registerMemberLeave } from "./memberLeave";

export function registerEvents(client: BuggerBot) {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`BUGGER_BOT online como ${readyClient.user.tag}`);
  });

  registerMemberJoin(client);
  registerMemberLeave(client);
  registerInteractionHandler(client);
}
