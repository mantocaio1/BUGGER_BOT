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
} from "../config/defaults";
import {
  findUserTicketChannel,
  getGuildConfig,
  getTicketChannelMessage,
  getTicketPanelMessage,
  getTicketRecord,
  registerOpenTicket,
  removeOpenTicket,
} from "../config/store";
import { applyEmbedTitle, buildConfiguredEmbed } from "../utils/embeds";
import { applyTemplate } from "../utils/template";

export const TICKET_OPEN_ID = "bugger:ticket:open";
export const TICKET_CLOSE_ID = "bugger:ticket:close";
export const TICKET_REASON_MODAL_ID = "bugger:ticket:reason_modal";
export const TICKET_REASON_INPUT_ID = "motivo";

export function buildTicketPanelRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(TICKET_OPEN_ID)
      .setLabel("Abrir ticket")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎫")
  );
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
    avatar: "",
  };
}

function buildTicketTemplateVars(
  guildName: string,
  member: GuildMember,
  staffMention: string,
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
    avatar: member.user.displayAvatarURL({ size: 256 }),
  };
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
    components: [buildTicketPanelRow()],
  });
}

export async function openTicket(member: GuildMember, reason?: string) {
  const config = assertTicketConfigured(member.guild.id);

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
      ch
        ? `Você já tem um ticket aberto: ${ch}`
        : "Você já tem um ticket aberto."
    );
  }

  const category = member.guild.channels.cache.get(config.ticketCategoryId!);
  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new Error("Categoria de tickets inválida. Reconfigure com `/setup ticket`.");
  }

  const supportRole = member.guild.roles.cache.get(config.ticketSupportRoleId!);
  if (!supportRole) {
    throw new Error("Cargo de suporte não encontrado.");
  }

  const safeName = member.user.username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) || "membro";

  const trimmedReason = reason?.trim();

  const ticketChannel = await member.guild.channels.create({
    name: `ticket-${safeName}`,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: trimmedReason
      ? `Ticket de ${member.user.tag} (${member.id}) — ${trimmedReason.slice(0, 200)}`
      : `Ticket de ${member.user.tag} (${member.id})`,
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
        ],
      },
    ],
  });

  registerOpenTicket(member.guild.id, ticketChannel.id, member.id, trimmedReason);

  const staffMention = `<@&${supportRole.id}>`;
  const variables = buildTicketTemplateVars(
    member.guild.name,
    member,
    staffMention,
    trimmedReason
  );

  const embed = buildConfiguredEmbed({
    config,
    colorKey: "ticketChannelColor",
    titleKey: "ticketChannelTitle",
    title: applyEmbedTitle(config.ticketChannelTitle, variables) ?? DEFAULT_TICKET_CHANNEL_TITLE,
    description: applyTemplate(getTicketChannelMessage(config), variables),
    thumbnailUrl: member.user.displayAvatarURL({ size: 256 }),
    defaultColor: DEFAULT_TICKET_CHANNEL_COLOR,
  });

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

  const channel = guild.channels.cache.get(channelId);
  if (channel?.isTextBased() && !channel.isDMBased()) {
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription(`Ticket fechado por <@${closedById}>.\nCanal será removido em 5 segundos.`);

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
