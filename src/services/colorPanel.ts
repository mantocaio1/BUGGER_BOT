import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  Role,
  TextChannel,
} from "discord.js";
import {
  DEFAULT_COLOR_PANEL_MESSAGE,
  DEFAULT_COLOR_PANEL_TITLE,
  DEFAULT_ROLE_PANEL_COLOR,
} from "../config/defaults";
import { ColorPanelConfig, getGuildConfig } from "../config/store";
import { parseHexColor } from "../utils/color";

export const COLOR_BUTTON_PREFIX = "bugger:color:";
export const COLOR_CLEAR_ID = "bugger:color:clear";

export function colorButtonCustomId(roleId: string) {
  return `${COLOR_BUTTON_PREFIX}${roleId}`;
}

export function parseColorButtonId(customId: string): string | "clear" | undefined {
  if (customId === COLOR_CLEAR_ID) return "clear";
  if (!customId.startsWith(COLOR_BUTTON_PREFIX)) return undefined;
  const id = customId.slice(COLOR_BUTTON_PREFIX.length);
  return id || undefined;
}

export function assertColorPanelConfigured(guildId: string): ColorPanelConfig {
  const panel = getGuildConfig(guildId).colorPanel;
  if (!panel?.roleIds?.length) {
    throw new Error(
      "Painel de cores não configurado. Use `/setup cores` ou `/cores adicionar`."
    );
  }
  return panel;
}

function roleToButtonStyle(role: Role): ButtonStyle {
  if (!role.color) return ButtonStyle.Secondary;
  const r = (role.color >> 16) & 0xff;
  const g = (role.color >> 8) & 0xff;
  if (r > 180 && g < 90) return ButtonStyle.Danger;
  if (g > 140 && r < 90) return ButtonStyle.Success;
  if (r > 180 && g > 140) return ButtonStyle.Secondary;
  return ButtonStyle.Primary;
}

export function buildColorPanelRows(guild: Guild, panel: ColorPanelConfig) {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let current = new ActionRowBuilder<ButtonBuilder>();

  for (const roleId of panel.roleIds.slice(0, 20)) {
    const role = guild.roles.cache.get(roleId);
    if (!role) continue;

    if (current.components.length >= 5) {
      rows.push(current);
      current = new ActionRowBuilder<ButtonBuilder>();
    }

    current.addComponents(
      new ButtonBuilder()
        .setCustomId(colorButtonCustomId(roleId))
        .setLabel(role.name.slice(0, 80))
        .setStyle(roleToButtonStyle(role))
    );
  }

  if (current.components.length >= 5) {
    rows.push(current);
    current = new ActionRowBuilder<ButtonBuilder>();
  }

  current.addComponents(
    new ButtonBuilder()
      .setCustomId(COLOR_CLEAR_ID)
      .setLabel("Sem cor")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("⬜")
  );

  if (current.components.length > 0) rows.push(current);
  return rows;
}

export async function sendColorPanel(channel: TextChannel) {
  const panel = assertColorPanelConfigured(channel.guild.id);

  const embed = new EmbedBuilder()
    .setColor(parseHexColor(panel.embedColor) ?? DEFAULT_ROLE_PANEL_COLOR)
    .setTitle(panel.title?.trim() || DEFAULT_COLOR_PANEL_TITLE)
    .setDescription(panel.message?.trim() || DEFAULT_COLOR_PANEL_MESSAGE);

  const rows = buildColorPanelRows(channel.guild, panel);
  if (rows.every((r) => r.components.length === 0)) {
    throw new Error("Nenhum cargo de cor válido encontrado. Recrie os cargos ou reconfigure.");
  }

  await channel.send({ embeds: [embed], components: rows });
}

async function fetchEditableRole(guild: Guild, roleId: string) {
  const role =
    guild.roles.cache.get(roleId) ??
    (await guild.roles.fetch(roleId).catch(() => null));

  if (!role) throw new Error("Cargo de cor não encontrado.");
  if (!role.editable) {
    throw new Error(`Cargo **${role.name}** está acima do meu na hierarquia.`);
  }
  return role;
}

export async function applyColorRole(member: GuildMember, roleId: string) {
  const panel = assertColorPanelConfigured(member.guild.id);

  if (!panel.roleIds.includes(roleId)) {
    throw new Error("Esta cor não faz parte do painel configurado.");
  }

  const botMember = member.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("Bot sem permissão **Gerenciar Cargos**.");
  }

  const role = await fetchEditableRole(member.guild, roleId);

  if (!role.color && role.colors?.primaryColor == null) {
    throw new Error(
      `Cargo **${role.name}** não tem cor. Use \`/cores criar\` ou defina cor no cargo.`
    );
  }

  const panelRoles = panel.roleIds
    .map((id) => member.guild.roles.cache.get(id))
    .filter((r): r is Role => !!r);

  const hasRole = member.roles.cache.has(role.id);

  if (hasRole) {
    await member.roles.remove(role, "Color panel BUGGER_BOT — toggle off");
    return `Cor **${role.name}** removida. Seu nome voltou ao padrão.`;
  }

  const toRemove = panelRoles.filter(
    (r) => r.id !== role.id && member.roles.cache.has(r.id)
  );

  if (toRemove.length > 0) {
    await member.roles.remove(toRemove, "Color panel BUGGER_BOT — troca de cor");
  }

  await member.roles.add(role, "Color panel BUGGER_BOT");
  return `Cor do nome alterada para **${role.name}**!`;
}

export async function clearColorRoles(member: GuildMember) {
  const panel = getGuildConfig(member.guild.id).colorPanel;
  if (!panel?.roleIds.length) {
    throw new Error("Painel de cores não configurado.");
  }

  const botMember = member.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("Bot sem permissão **Gerenciar Cargos**.");
  }

  const toRemove = panel.roleIds
    .filter((id) => member.roles.cache.has(id))
    .map((id) => member.guild.roles.cache.get(id))
    .filter((r): r is Role => !!r && r.editable);

  if (toRemove.length === 0) {
    return "Você não tinha nenhuma cor do painel.";
  }

  await member.roles.remove(toRemove, "Color panel BUGGER_BOT — limpar");
  return "Todas as cores do painel foram removidas.";
}

export function appendColorRole(guildId: string, roleId: string) {
  const config = getGuildConfig(guildId);
  const roleIds = [...(config.colorPanel?.roleIds ?? [])];

  if (roleIds.includes(roleId)) {
    return roleIds;
  }

  if (roleIds.length >= 20) {
    throw new Error("Limite de 20 cores no painel.");
  }

  roleIds.push(roleId);
  return roleIds;
}

export async function createColorRole(
  guild: Guild,
  name: string,
  hexColor: string,
  creatorTag: string
) {
  const color = parseHexColor(hexColor);
  if (color === null) {
    throw new Error("Cor inválida. Use hexadecimal, ex: #E74C3C");
  }

  const botMember = guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    throw new Error("Bot sem permissão **Gerenciar Cargos**.");
  }

  const role = await guild.roles.create({
    name,
    color,
    mentionable: false,
    reason: `Cargo de cor criado por ${creatorTag}`,
  });

  return role;
}

export function formatColorRoleList(guild: Guild, panel: ColorPanelConfig) {
  if (!panel.roleIds.length) return "Nenhuma cor configurada.";

  return panel.roleIds
    .map((id, i) => {
      const role = guild.roles.cache.get(id);
      if (!role) return `${i + 1}. \`${id}\` — cargo não encontrado`;
      const hex = role.hexColor === "#000000" && !role.color ? "sem cor" : role.hexColor;
      return `${i + 1}. ${role.toString()} — \`${hex}\``;
    })
    .join("\n");
}
