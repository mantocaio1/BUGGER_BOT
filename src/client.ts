import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  GatewayIntentBits,
  Guild,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";

export interface BotCommand {
  data: {
    name: string;
    description: string;
    defaultMemberPermissions?: bigint | null;
    toJSON: () => unknown;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export class BuggerBot extends Client {
  commands = new Collection<string, BotCommand>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
      ],
    });
  }
}

export function requireGuild(interaction: ChatInputCommandInteraction): Guild {
  if (!interaction.inGuild() || !interaction.guild) {
    throw new Error("Este comando só pode ser usado dentro de um servidor.");
  }
  return interaction.guild;
}

export function requirePermissions(
  interaction: ChatInputCommandInteraction,
  permissions: bigint
) {
  const member = interaction.member;
  if (!member || !("permissions" in member)) {
    throw new Error("Não foi possível verificar suas permissões.");
  }

  const perms =
    member.permissions instanceof PermissionsBitField
      ? member.permissions
      : new PermissionsBitField(member.permissions as unknown as bigint);

  if (!perms.has(permissions)) {
    throw new Error("Você não tem permissão para usar este comando.");
  }
}

export const MANAGE_GUILD = PermissionFlagsBits.ManageGuild;
export const MANAGE_ROLES = PermissionFlagsBits.ManageRoles;
export const MANAGE_EVENTS = PermissionFlagsBits.ManageEvents;
