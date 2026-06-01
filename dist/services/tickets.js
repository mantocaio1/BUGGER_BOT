"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICKET_REASON_INPUT_ID = exports.TICKET_REASON_MODAL_ID = exports.TICKET_REASON_MODAL_PREFIX = exports.TICKET_CLOSE_ID = exports.TICKET_OPEN_ID = exports.TICKET_OPEN_PREFIX = void 0;
exports.parseTicketOpenType = parseTicketOpenType;
exports.parseTicketModalType = parseTicketModalType;
exports.ticketOpenCustomId = ticketOpenCustomId;
exports.ticketModalCustomId = ticketModalCustomId;
exports.buildTicketPanelRows = buildTicketPanelRows;
exports.buildTicketPanelRow = buildTicketPanelRow;
exports.buildTicketCloseRow = buildTicketCloseRow;
exports.assertTicketConfigured = assertTicketConfigured;
exports.sendTicketPanel = sendTicketPanel;
exports.openTicket = openTicket;
exports.closeTicketChannel = closeTicketChannel;
exports.canCloseTicket = canCloseTicket;
exports.ticketRequiresReason = ticketRequiresReason;
exports.getTicketReasonMinLength = getTicketReasonMinLength;
const discord_js_1 = require("discord.js");
const defaults_1 = require("../config/defaults");
const store_1 = require("../config/store");
const transcript_1 = require("./transcript");
const embeds_1 = require("../utils/embeds");
const color_1 = require("../utils/color");
const template_1 = require("../utils/template");
exports.TICKET_OPEN_PREFIX = "bugger:ticket:open";
exports.TICKET_OPEN_ID = "bugger:ticket:open";
exports.TICKET_CLOSE_ID = "bugger:ticket:close";
exports.TICKET_REASON_MODAL_PREFIX = "bugger:ticket:reason_modal";
exports.TICKET_REASON_MODAL_ID = "bugger:ticket:reason_modal";
exports.TICKET_REASON_INPUT_ID = "motivo";
const BUTTON_STYLES = {
    Primary: discord_js_1.ButtonStyle.Primary,
    Secondary: discord_js_1.ButtonStyle.Secondary,
    Success: discord_js_1.ButtonStyle.Success,
    Danger: discord_js_1.ButtonStyle.Danger,
};
function parseTicketOpenType(customId) {
    if (customId === exports.TICKET_OPEN_ID)
        return undefined;
    if (!customId.startsWith(`${exports.TICKET_OPEN_PREFIX}:`))
        return undefined;
    return customId.slice(`${exports.TICKET_OPEN_PREFIX}:`.length);
}
function parseTicketModalType(customId) {
    if (customId === exports.TICKET_REASON_MODAL_ID)
        return undefined;
    if (!customId.startsWith(`${exports.TICKET_REASON_MODAL_PREFIX}:`))
        return undefined;
    return customId.slice(`${exports.TICKET_REASON_MODAL_PREFIX}:`.length);
}
function ticketOpenCustomId(typeId) {
    return typeId ? `${exports.TICKET_OPEN_PREFIX}:${typeId}` : exports.TICKET_OPEN_ID;
}
function ticketModalCustomId(typeId) {
    return typeId ? `${exports.TICKET_REASON_MODAL_PREFIX}:${typeId}` : exports.TICKET_REASON_MODAL_ID;
}
function buildTypeButton(type) {
    return new discord_js_1.ButtonBuilder()
        .setCustomId(ticketOpenCustomId(type.id))
        .setLabel(type.label)
        .setStyle(BUTTON_STYLES[type.style])
        .setEmoji(type.emoji);
}
function buildTicketPanelRows(config) {
    const types = (0, store_1.getActiveTicketTypes)(config);
    if (types.length > 0) {
        const row = new discord_js_1.ActionRowBuilder();
        for (const type of types.slice(0, 5)) {
            row.addComponents(buildTypeButton(type));
        }
        return [row];
    }
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(exports.TICKET_OPEN_ID)
            .setLabel("Abrir ticket")
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji("🎫")),
    ];
}
function buildTicketPanelRow() {
    return buildTicketPanelRows((0, store_1.getGuildConfig)(""))[0];
}
function buildTicketCloseRow() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(exports.TICKET_CLOSE_ID)
        .setLabel("Fechar ticket")
        .setStyle(discord_js_1.ButtonStyle.Danger)
        .setEmoji("🔒"));
}
function assertTicketConfigured(guildId) {
    const config = (0, store_1.getGuildConfig)(guildId);
    if (!config.ticketEnabled) {
        throw new Error("Sistema de tickets desativado. Use `/setup ticket` para configurar.");
    }
    if (!config.ticketCategoryId || !config.ticketSupportRoleId) {
        throw new Error("Tickets incompletos. Configure categoria e cargo de suporte com `/setup ticket`.");
    }
    return config;
}
function buildPanelTemplateVars(guildName, staffMention) {
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
function buildTicketTemplateVars(guildName, member, staffMention, typeLabel, reason) {
    const reasonBlock = reason
        ? (0, template_1.applyTemplate)(defaults_1.DEFAULT_TICKET_REASON_BLOCK, { reason })
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
function getChannelColorForType(config, typeId) {
    const override = typeId ? config.ticketTypeOverrides?.[typeId]?.channelColor : undefined;
    return (0, color_1.parseHexColor)(override ?? config.ticketChannelColor) ?? defaults_1.DEFAULT_TICKET_CHANNEL_COLOR;
}
async function sendTicketPanel(channel) {
    const config = assertTicketConfigured(channel.guild.id);
    const staffRole = channel.guild.roles.cache.get(config.ticketSupportRoleId);
    const staffMention = staffRole ? `<@&${staffRole.id}>` : "@equipe";
    const variables = buildPanelTemplateVars(channel.guild.name, staffMention);
    const embed = (0, embeds_1.buildConfiguredEmbed)({
        config,
        colorKey: "ticketPanelColor",
        titleKey: "ticketPanelTitle",
        title: (0, embeds_1.applyEmbedTitle)(config.ticketPanelTitle, variables) ?? defaults_1.DEFAULT_TICKET_PANEL_TITLE,
        description: (0, template_1.applyTemplate)((0, store_1.getTicketPanelMessage)(config), variables),
        imageKey: "ticketPanelImageUrl",
        defaultColor: defaults_1.DEFAULT_TICKET_PANEL_COLOR,
    });
    await channel.send({
        embeds: [embed],
        components: buildTicketPanelRows(config),
    });
}
async function openTicket(member, options) {
    const config = assertTicketConfigured(member.guild.id);
    const typeId = options?.typeId;
    const typeDef = typeId ? (0, store_1.getTicketTypeDefinition)(typeId) : undefined;
    if (typeId && config.ticketTypesEnabled && !typeDef) {
        throw new Error("Tipo de ticket inválido.");
    }
    const reason = options?.reason;
    if (config.ticketReasonRequired && !reason?.trim()) {
        throw new Error("Motivo obrigatório para abrir ticket.");
    }
    const minLength = config.ticketReasonMinLength ?? defaults_1.DEFAULT_TICKET_REASON_MIN_LENGTH;
    if (reason && reason.trim().length < minLength) {
        throw new Error(`O motivo deve ter pelo menos ${minLength} caracteres.`);
    }
    const existing = (0, store_1.findUserTicketChannel)(member.guild.id, member.id);
    if (existing) {
        const ch = member.guild.channels.cache.get(existing);
        throw new Error(ch ? `Você já tem um ticket aberto: ${ch}` : "Você já tem um ticket aberto.");
    }
    const categoryId = typeId ? (0, store_1.getTicketTypeCategory)(config, typeId) : config.ticketCategoryId;
    const category = categoryId ? member.guild.channels.cache.get(categoryId) : null;
    if (!category || category.type !== discord_js_1.ChannelType.GuildCategory) {
        throw new Error("Categoria de tickets inválida. Reconfigure com `/setup ticket`.");
    }
    const supportRole = member.guild.roles.cache.get(config.ticketSupportRoleId);
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
        type: discord_js_1.ChannelType.GuildText,
        parent: category.id,
        topic: trimmedReason
            ? `[${typeLabel}] ${member.user.tag} (${member.id}) — ${trimmedReason.slice(0, 180)}`
            : `[${typeLabel}] ${member.user.tag} (${member.id})`,
        permissionOverwrites: [
            { id: member.guild.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            {
                id: member.id,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    discord_js_1.PermissionFlagsBits.AttachFiles,
                ],
            },
            {
                id: supportRole.id,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    discord_js_1.PermissionFlagsBits.ManageMessages,
                ],
            },
            {
                id: member.guild.members.me.id,
                allow: [
                    discord_js_1.PermissionFlagsBits.ViewChannel,
                    discord_js_1.PermissionFlagsBits.SendMessages,
                    discord_js_1.PermissionFlagsBits.ManageChannels,
                    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                ],
            },
        ],
    });
    (0, store_1.registerOpenTicket)(member.guild.id, ticketChannel.id, {
        userId: member.id,
        reason: trimmedReason,
        typeId,
        typeLabel,
    });
    const staffMention = `<@&${supportRole.id}>`;
    const variables = buildTicketTemplateVars(member.guild.name, member, staffMention, typeLabel, trimmedReason);
    const titleTemplate = (0, store_1.getTicketChannelTitle)(config, typeId);
    const title = (0, embeds_1.applyEmbedTitle)(titleTemplate, variables) ??
        (0, template_1.applyTemplate)(defaults_1.DEFAULT_TICKET_CHANNEL_TITLE, variables);
    const description = (0, template_1.applyTemplate)((0, store_1.getTicketChannelMessage)(config, typeId), variables);
    const embed = new discord_js_1.EmbedBuilder()
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
async function closeTicketChannel(guild, channelId, closedById) {
    const record = (0, store_1.getTicketRecord)(guild.id, channelId);
    if (!record) {
        throw new Error("Este canal não é um ticket registrado.");
    }
    await (0, transcript_1.saveAndSendTranscript)(guild, channelId, closedById).catch(console.error);
    const channel = guild.channels.cache.get(channelId);
    if (channel?.isTextBased() && !channel.isDMBased()) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xed4245)
            .setDescription(`Ticket fechado por <@${closedById}>.\nTranscript salvo. Canal removido em 5 segundos.`);
        await channel.send({ embeds: [embed] });
    }
    (0, store_1.removeOpenTicket)(guild.id, channelId);
    setTimeout(() => {
        guild.channels.delete(channelId).catch(() => undefined);
    }, 5000);
}
function canCloseTicket(guildId, channelId, userId, supportRoleId, memberRoles) {
    const record = (0, store_1.getTicketRecord)(guildId, channelId);
    if (record?.userId === userId)
        return true;
    if (supportRoleId && memberRoles?.includes(supportRoleId))
        return true;
    return false;
}
function ticketRequiresReason(guildId) {
    return (0, store_1.getGuildConfig)(guildId).ticketReasonRequired === true;
}
function getTicketReasonMinLength(guildId) {
    return (0, store_1.getGuildConfig)(guildId).ticketReasonMinLength ?? defaults_1.DEFAULT_TICKET_REASON_MIN_LENGTH;
}
