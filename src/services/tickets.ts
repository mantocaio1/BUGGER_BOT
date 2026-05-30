import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import {
  DEFAULT_TICKET_CHANNEL_COLOR,
  DEFAULT_TICKET_CHANNEL_TITLE,
  DEFAULT_TICKET_PANEL_COLOR,
  DEFAULT_TICKET_PANEL_TITLE,
  DEFAULT_TICKET_REASON_BLOCK,
  DEFAULT_TICKET_REASON_MIN_LENGTH,
  TicketButtonStyle,
  TicketTypeDefinition,
} from "../config/defaults";
import {
  findUserTicketChannel,
  getActiveTicketTypes,
  getGuildConfig,
  getTicketChannelMessage,
  getTicketChannelTitle,
  getTicketPanelMessage,
  getTicketRecord,
  getTicketTypeCategory,
  getTicketTypeDefinition,
  registerOpenTicket,
  removeOpenTicket,
} from "../config/store";
import { saveAndSendTranscript } from "./transcript";
import { applyEmbedTitle, buildConfiguredEmbed } from "../utils/embeds";
import { parseHexColor } from "../utils/color";
import { applyTemplate } from "../utils/template";

export const TICKET_OPEN_PREFIX = "bugger:ticket:open";
export const TICKET_OPEN_ID = "bugger:ticket:open";
export const TICKET_CLOSE_ID = "bugger:ticket:close";
export const TICKET_REASON_MODAL_PREFIX = "bugger:ticket:reason_modal";
export const TICKET_REASON_MODAL_ID = "bugger:ticket:reason_modal";
export const TICKET_REASON_INPUT_ID = "motivo";

const BUTTON_STYLES: Record<TicketButtonStyle, ButtonStyle> = {
  Primary: ButtonStyle.Primary,
  Secondary: ButtonStyle.Secondary,
  Success: ButtonStyle.Success,
  Danger: ButtonStyle.Danger,
};

export function parseTicketOpenType(customId: string): string | undefined {
  if (customId === TICKET_OPEN_ID) return undefined;
  if (!customId.startsWith(`${TICKET_OPEN_PREFIX}:`)) return undefined;
  return customId.slice(`${TICKET_OPEN_PREFIX}:`.length);
}

export function parseTicketModalType(customId: string): string | undefined {
  if (customId === TICKET_REASON_MODAL_ID) return undefined;
  if (!customId.startsWith(`${TICKET_REASON_MODAL_PREFIX}:`)) return undefined;
  return customId.slice(`${TICKET_REASON_MODAL_PREFIX}:`.length);
}

export function ticketOpenCustomId(typeId?: string) {
  return typeId ? `${TICKET_OPEN_PREFIX}:${typeId}` : TICKET_OPEN_ID;
}

export function ticketModalCustomId(typeId?: string) {
  return typeId ? `${TICKET_REASON_MODAL_PREFIX}:${typeId}` : TICKET_REASON_MODAL_ID;
}

function buildTypeButton(type: TicketTypeDefinition) {
  return new ButtonBuilder()
    .setCustomId(ticketOpenCustomId(type.id))
    .setLabel(type.label)
    .setStyle(BUTTON_STYLES[type.style])
    .setEmoji(type.emoji);
}

export function buildTicketPanelRows(config: ReturnType<typeof getGuildConfig>) {
  const types = getActiveTicketTypes(config);

  if (types.length > 0) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (const type of types.slice(0, 5)) {
      row.addComponents(buildTypeButton(type));
    }
    return [row];
  }

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_OPEN_ID)
        .setLabel("Abrir ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎫")
    ),
  ];
}

export function buildTicketPanelRow() {
  return buildTicketPanelRows(getGuildConfig(""))[0];
}

export function buildTicketCloseRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(TICKET_CLOSE_ID)
      .setLabel("Fechar ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒")
  );
}

export function assertTicketConfigured(guildId: string) {
  const config = getGuildConfig(guildId);
  if (!config.ticketEnabled) {
    throw new Error("Sistema de tickets desativado. Use `/setup ticket` para configurar.");
  }
  if (!config.ticketCategoryId || !config.ticketSupportRoleId) {
    throw new Error(
      "Tickets incompletos. Configure categoria e cargo de suporte com `/setup ticket`."
    );
  }
  return config;
}

function buildPanelTemplateVars(guildName: string, staffMention: string) {
  return {
    user: "—",
    username: "—",
    server: guildName,
    count: "—",
    staff: staffMention,
    reason: "—",
    reason_block: "",
    type: "—",
    avatar: "",
  };
}

function buildTicketTemplateVars(
  guildName: string,
  member: GuildMember,
  staffMention: string,
  typeLabel: string,
  reason?: string
) {
  const reasonBlock = reason
    ? applyTemplate(DEFAULT_TICKET_REASON_BLOCK, { reason })
    : "";

  return {
    user: member.toString(),
    username: member.user.username,
    server: guildName,
    staff: staffMention,
    reason: reason ?? "—",
    reason_block: reasonBlock,
    type: typeLabel,
    avatar: member.user.displayAvatarURL({ size: 256 }),
  };
}

function getChannelColorForType(config: ReturnType<typeof getGuildConfig>, typeId?: string) {
  const override = typeId ? config.ticketTypeOverrides?.[typeId]?.channelColor : undefined;
  return parseHexColor(override ?? config.ticketChannelColor) ?? DEFAULT_TICKET_CHANNEL_COLOR;
}

export async function sendTicketPanel(channel: TextChannel) {
  const config = assertTicketConfigured(channel.guild.id);
  const staffRole = channel.guild.roles.cache.get(config.ticketSupportRoleId!);
  const staffMention = staffRole ? `<@&${staffRole.id}>` : "@equipe";

  const variables = buildPanelTemplateVars(channel.guild.name, staffMention);

  const embed = buildConfiguredEmbed({
    config,
    colorKey: "ticketPanelColor",
    titleKey: "ticketPanelTitle",
    title: applyEmbedTitle(config.ticketPanelTitle, variables) ?? DEFAULT_TICKET_PANEL_TITLE,
    description: applyTemplate(getTicketPanelMessage(config), variables),
    imageKey: "ticketPanelImageUrl",
    defaultColor: DEFAULT_TICKET_PANEL_COLOR,
  });

  await channel.send({
    embeds: [embed],
    components: buildTicketPanelRows(config),
  });
}

export async function openTicket(
  member: GuildMember,
  options?: { reason?: string; typeId?: string }
) {
  const config = assertTicketConfigured(member.guild.id);
  const typeId = options?.typeId;
  const typeDef = typeId ? getTicketTypeDefinition(typeId) : undefined;

  if (typeId && config.ticketTypesEnabled && !typeDef) {
    throw new Error("Tipo de ticket inválido.");
  }

  const reason = options?.reason;

  if (config.ticketReasonRequired && !reason?.trim()) {
    throw new Error("Motivo obrigatório para abrir ticket.");
  }

  const minLength = config.ticketReasonMinLength ?? DEFAULT_TICKET_REASON_MIN_LENGTH;
  if (reason && reason.trim().length < minLength) {
    throw new Error(`O motivo deve ter pelo menos ${minLength} caracteres.`);
  }

  const existing = findUserTicketChannel(member.guild.id, member.id);
  if (existing) {
    const ch = member.guild.channels.cache.get(existing);
    throw new Error(
      ch ? `Você já tem um ticket aberto: ${ch}` : "Você já tem um ticket aberto."
    );
  }

  const categoryId = typeId ? getTicketTypeCategory(config, typeId) : config.ticketCategoryId;
  const category = categoryId ? member.guild.channels.cache.get(categoryId) : null;

  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new Error("Categoria de tickets inválida. Reconfigure com `/setup ticket`.");
  }

  const supportRole = member.guild.roles.cache.get(config.ticketSupportRoleId!);
  if (!supportRole) {
    throw new Error("Cargo de suporte não encontrado.");
  }

  const typeSlug = typeId ?? "ticket";
  const safeName = member.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10) || "membro";

  const trimmedReason = reason?.trim();
  const typeLabel = typeDef?.label ?? "Geral";

  const ticketChannel = await member.guild.channels.create({
    name: `${typeSlug}-${safeName}`.slice(0, 100),
    type: ChannelType.GuildText,
    parent: category.id,
    topic: trimmedReason
      ? `[${typeLabel}] ${member.user.tag} (${member.id}) — ${trimmedReason.slice(0, 180)}`
      : `[${typeLabel}] ${member.user.tag} (${member.id})`,
    permissionOverwrites: [
      { id: member.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: supportRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      },
      {
        id: member.guild.members.me!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  registerOpenTicket(member.guild.id, ticketChannel.id, {
    userId: member.id,
    reason: trimmedReason,
    typeId,
    typeLabel,
  });

  const staffMention = `<@&${supportRole.id}>`;
  const variables = buildTicketTemplateVars(
    member.guild.name,
    member,
    staffMention,
    typeLabel,
    trimmedReason
  );

  const titleTemplate = getTicketChannelTitle(config, typeId);
  const title = applyEmbedTitle(titleTemplate, variables) ??
    applyTemplate(DEFAULT_TICKET_CHANNEL_TITLE, variables);

  const description = applyTemplate(getTicketChannelMessage(config, typeId), variables);

  const embed = new EmbedBuilder()
    .setColor(getChannelColorForType(config, typeId))
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }));

  await ticketChannel.send({
    content: staffMention,
    embeds: [embed],
    components: [buildTicketCloseRow()],
  });

  return ticketChannel;
}

export async function closeTicketChannel(
  guild: Guild,
  channelId: string,
  closedById: string
) {
  const record = getTicketRecord(guild.id, channelId);
  if (!record) {
    throw new Error("Este canal não é um ticket registrado.");
  }

  await saveAndSendTranscript(guild, channelId, closedById).catch(console.error);

  const channel = guild.channels.cache.get(channelId);
  if (channel?.isTextBased() && !channel.isDMBased()) {
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription(
        `Ticket fechado por <@${closedById}>.\nTranscript salvo. Canal removido em 5 segundos.`
      );
    await (channel as TextChannel).send({ embeds: [embed] });
  }

  removeOpenTicket(guild.id, channelId);

  setTimeout(() => {
    guild.channels.delete(channelId).catch(() => undefined);
  }, 5000);
}

export function canCloseTicket(
  guildId: string,
  channelId: string,
  userId: string,
  supportRoleId?: string,
  memberRoles?: string[]
) {
  const record = getTicketRecord(guildId, channelId);
  if (record?.userId === userId) return true;
  if (supportRoleId && memberRoles?.includes(supportRoleId)) return true;
  return false;
}

export function ticketRequiresReason(guildId: string) {
  return getGuildConfig(guildId).ticketReasonRequired === true;
}

export function getTicketReasonMinLength(guildId: string) {
  return getGuildConfig(guildId).ticketReasonMinLength ?? DEFAULT_TICKET_REASON_MIN_LENGTH;
}
