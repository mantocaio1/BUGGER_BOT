import { BuggerBot } from "../client";
import { roleCommand } from "./role";
import { eventCommand } from "./event";
import { pingCommand } from "./ping";
import { serverinfoCommand } from "./serverinfo";
import { moderationCommand } from "./moderation";
import { setupCommand } from "./setup";
import { previewCommand } from "./preview";
import { rolesCommand } from "./roles";
import { coresCommand } from "./cores";

export const commands = [
  pingCommand,
  serverinfoCommand,
  setupCommand,
  previewCommand,
  roleCommand,
  eventCommand,
  moderationCommand,
  coresCommand,
  rolesCommand,
];

export function loadCommands(client: BuggerBot) {
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }
}
