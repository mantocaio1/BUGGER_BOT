import { BuggerBot } from "../client";
import { roleCommand } from "./role";
import { eventCommand } from "./event";
import { pingCommand } from "./ping";
import { serverinfoCommand } from "./serverinfo";
import { moderationCommand } from "./moderation";
import { setupCommand } from "./setup";

export const commands = [
  pingCommand,
  serverinfoCommand,
  setupCommand,
  roleCommand,
  eventCommand,
  moderationCommand,
];

export function loadCommands(client: BuggerBot) {
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }
}
