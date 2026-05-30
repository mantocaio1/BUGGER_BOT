import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  Role,
  TextChannel,
} from "discord.js";
import { DEFAULT_ROLE_PANEL_COLOR } from "../config/defaults";
import { getGuildConfig, RolePanelConfig } from "../config/store";
import { parseHexColor } from "../utils/color";
import { applyTemplate } from "../utils/template";

export const ROLE_BUTTON_PREFIX = "bugger:role:";

export function roleButtonCustomId(roleId: string) {
  return `${ROLE_BUTTON_PREFIX}${roleId}`;
}

export function parseRoleButtonId(customId: string): string | undefined {
  if (!customId.startsWith(ROLE_BUTTON_PREFIX)) return undefined;
  return customId.slice(ROLE_BUTTON_PREFIX.length);
}

export function assertRolePanelConfigured(guildId: string): RolePanelConfig {
  const panel = getGuildConfig(guildId).rolePanel;
  if (!panel?.buttons?.length) {
    throw new Error(
      "Painel de cargos não configurado. Use `/setup roles` com pelo menos um cargo."
    );
  }
  return panel;
}

export function buildRolePanelRows(panel: RolePanelConfig) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let current = new ActionRowBuilder<ButtonBuilder>();

  for (const entry of panel.buttons.slice(0, 25)) {
    if (current.components.length >= 5) {
      rows.push(current);
      current = new ActionRowBuilder<ButtonBuilder>();
    }

    const button = new ButtonBuilder()
      .setCustomId(roleButtonCustomId(entry.roleId))
      .setLabel(entry.label.slice(0, 80))
      .setStyle(ButtonStyle.Secondary);

    if (entry.emoji) button.setEmoji(entry.emoji);
    current.addComponents(button);
  }

  if (current.components.length > 0) rows.push(current);
  return rows;
}

export async function sendRolePanel(channel: TextChannel) {
  const config = getGuildConfig(channel.guild.id);
  const panel = assertRolePanelConfigured(channel.guild.id);

  const variables = {
    server: channel.guild.name,
    count: String(channel.guild.memberCount),
  };

  const embed = new EmbedBuilder()
    .setColor(parseHexColor(panel.color) ?? DEFAULT_ROLE_PANEL_COLOR)
    .setDescription(
      applyTemplate(
        panel.message ?? "Clique para receber ou remover um cargo:",
        variables
      )
    );

  if (panel.title?.trim()) {
    embed.setTitle(applyTemplate(panel.title, variables));
  }

  if (panel.imageUrl?.trim()) {
    embed.setImage(panel.imageUrl.trim());
  }

  await channel.send({
    embeds: [embed],
    components: buildRolePanelRows(panel),
  });
}

export async function toggleRoleButton(member: GuildMember, roleId: string) {
  const panel = getGuildConfig(member.guild.id).rolePanel;
  const entry = panel?.buttons.find((b) => b.roleId === roleId);

  if (!entry) {
    throw new Error("Este botão não está configurado no painel de cargos.");
  }

  const botMember = member.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("Bot sem permissão **Gerenciar Cargos**.");
  }

  const role: Role | null =
    member.guild.roles.cache.get(roleId) ??
    (await member.guild.roles.fetch(roleId).catch(() => null));

  if (!role) throw new Error("Cargo não encontrado.");
  if (!role.editable) {
    throw new Error(`Cargo **${role.name}** está acima do meu na hierarquia.`);
  }

  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role, "Role panel BUGGER_BOT");
    return `Cargo **${role.name}** removido.`;
  }

  await member.roles.add(role, "Role panel BUGGER_BOT");
  return `Cargo **${role.name}** adicionado!`;
}
