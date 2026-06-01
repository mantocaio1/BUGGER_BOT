"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePreviewConfig = mergePreviewConfig;
exports.buildWelcomePreviewEmbed = buildWelcomePreviewEmbed;
exports.buildGoodbyePreviewEmbed = buildGoodbyePreviewEmbed;
exports.buildTicketPanelPreviewEmbed = buildTicketPanelPreviewEmbed;
exports.buildTicketChannelPreviewEmbed = buildTicketChannelPreviewEmbed;
exports.buildModLogPreviewEmbed = buildModLogPreviewEmbed;
exports.welcomeOverridesToConfig = welcomeOverridesToConfig;
exports.goodbyeOverridesToConfig = goodbyeOverridesToConfig;
exports.ticketPanelOverridesToConfig = ticketPanelOverridesToConfig;
exports.ticketChannelOverridesToConfig = ticketChannelOverridesToConfig;
exports.logsOverridesToConfig = logsOverridesToConfig;
exports.resolveStaffMention = resolveStaffMention;
exports.validatePreviewColor = validatePreviewColor;
exports.validatePreviewImage = validatePreviewImage;
exports.readPreviewOverrides = readPreviewOverrides;
const discord_js_1 = require("discord.js");
const defaults_1 = require("../config/defaults");
const store_1 = require("../config/store");
const color_1 = require("../utils/color");
function mergePreviewConfig(guildId, patch) {
    return { ...(0, store_1.getGuildConfig)(guildId), ...patch };
}
function applyPreviewStrings(template, variables) {
    return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`);
}
function buildWelcomeVars(guild, user) {
    return {
        user: user.toString(),
        username: user.username,
        server: guild.name,
        count: String(guild.memberCount),
        avatar: user.displayAvatarURL({ size: 512 }),
    };
}
function buildTicketVars(guild, user, staffMention, reason) {
    const sampleReason = reason ?? "Exemplo de motivo do ticket";
    const reasonBlock = defaults_1.DEFAULT_TICKET_REASON_BLOCK.replace("{reason}", sampleReason);
    return {
        user: user.toString(),
        username: user.username,
        server: guild.name,
        count: String(guild.memberCount),
        staff: staffMention,
        reason: sampleReason,
        reason_block: reasonBlock,
        type: "Suporte",
        avatar: user.displayAvatarURL({ size: 256 }),
    };
}
function buildWelcomePreviewEmbed(guild, user, config) {
    const variables = buildWelcomeVars(guild, user);
    const message = applyPreviewStrings(config.welcomeMessage?.trim() || defaults_1.DEFAULT_WELCOME_MESSAGE, variables);
    const title = config.welcomeTitle?.trim()
        ? applyPreviewStrings(config.welcomeTitle, variables)
        : defaults_1.DEFAULT_WELCOME_TITLE;
    const color = (0, color_1.parseHexColor)(config.welcomeEmbedColor) ?? defaults_1.DEFAULT_WELCOME_COLOR;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setThumbnail(user.displayAvatarURL({ size: 256 }));
    if (config.welcomeImageUrl?.trim()) {
        embed.setImage(config.welcomeImageUrl.trim());
    }
    embed.setFooter({ text: "Preview — BUGGER_BOT" });
    return embed;
}
function buildGoodbyePreviewEmbed(guild, user, config) {
    const variables = buildWelcomeVars(guild, user);
    const message = applyPreviewStrings(config.goodbyeMessage?.trim() || defaults_1.DEFAULT_GOODBYE_MESSAGE, variables);
    const title = config.goodbyeTitle?.trim()
        ? applyPreviewStrings(config.goodbyeTitle, variables)
        : defaults_1.DEFAULT_GOODBYE_TITLE;
    const color = (0, color_1.parseHexColor)(config.goodbyeEmbedColor) ?? defaults_1.DEFAULT_GOODBYE_COLOR;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setThumbnail(user.displayAvatarURL({ size: 256 }));
    if (config.goodbyeImageUrl?.trim()) {
        embed.setImage(config.goodbyeImageUrl.trim());
    }
    embed.setFooter({ text: "Preview — despedida" });
    return embed;
}
function buildTicketPanelPreviewEmbed(guild, config, staffMention) {
    const variables = buildTicketVars(guild, guild.client.user, staffMention);
    const message = applyPreviewStrings(config.ticketPanelMessage?.trim() || defaults_1.DEFAULT_TICKET_PANEL_MESSAGE, variables);
    const title = config.ticketPanelTitle?.trim()
        ? applyPreviewStrings(config.ticketPanelTitle, variables)
        : defaults_1.DEFAULT_TICKET_PANEL_TITLE;
    const color = (0, color_1.parseHexColor)(config.ticketPanelColor) ?? defaults_1.DEFAULT_TICKET_PANEL_COLOR;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message);
    if (config.ticketPanelImageUrl?.trim()) {
        embed.setImage(config.ticketPanelImageUrl.trim());
    }
    embed.setFooter({ text: "Preview — painel de tickets" });
    return embed;
}
function buildTicketChannelPreviewEmbed(guild, user, config, staffMention, reason) {
    const variables = buildTicketVars(guild, user, staffMention, reason);
    const message = applyPreviewStrings(config.ticketChannelMessage?.trim() || defaults_1.DEFAULT_TICKET_CHANNEL_MESSAGE, variables);
    const title = config.ticketChannelTitle?.trim()
        ? applyPreviewStrings(config.ticketChannelTitle, variables)
        : defaults_1.DEFAULT_TICKET_CHANNEL_TITLE;
    const color = (0, color_1.parseHexColor)(config.ticketChannelColor) ?? defaults_1.DEFAULT_TICKET_CHANNEL_COLOR;
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .setFooter({ text: "Preview — canal do ticket" });
}
function buildModLogPreviewEmbed(config, moderator) {
    const color = (0, color_1.parseHexColor)(config.modLogColor) ?? 0xed4245;
    return new discord_js_1.EmbedBuilder()
        .setColor(color)
        .setTitle("Banimento")
        .addFields({ name: "Membro", value: "`UsuarioExemplo#0000` (`123456789`)", inline: true }, { name: "Moderador", value: `${moderator.tag} (\`${moderator.id}\`)`, inline: true }, { name: "Motivo", value: "Exemplo de motivo para preview" }, { name: "Detalhes", value: "Mensagens apagadas: últimos 1 dia(s)" })
        .setTimestamp()
        .setFooter({ text: "Preview — logs de moderação" });
}
function welcomeOverridesToConfig(overrides) {
    const patch = {};
    if (overrides.mensagem != null)
        patch.welcomeMessage = overrides.mensagem || undefined;
    if (overrides.titulo != null)
        patch.welcomeTitle = overrides.titulo || undefined;
    if (overrides.cor != null)
        patch.welcomeEmbedColor = overrides.cor || undefined;
    if (overrides.imagem != null)
        patch.welcomeImageUrl = overrides.imagem || undefined;
    return patch;
}
function goodbyeOverridesToConfig(overrides) {
    const patch = {};
    if (overrides.mensagem != null)
        patch.goodbyeMessage = overrides.mensagem || undefined;
    if (overrides.titulo != null)
        patch.goodbyeTitle = overrides.titulo || undefined;
    if (overrides.cor != null)
        patch.goodbyeEmbedColor = overrides.cor || undefined;
    if (overrides.imagem != null)
        patch.goodbyeImageUrl = overrides.imagem || undefined;
    return patch;
}
function ticketPanelOverridesToConfig(overrides) {
    const patch = {};
    if (overrides.mensagem != null)
        patch.ticketPanelMessage = overrides.mensagem || undefined;
    if (overrides.titulo != null)
        patch.ticketPanelTitle = overrides.titulo || undefined;
    if (overrides.cor != null)
        patch.ticketPanelColor = overrides.cor || undefined;
    if (overrides.imagem != null)
        patch.ticketPanelImageUrl = overrides.imagem || undefined;
    return patch;
}
function ticketChannelOverridesToConfig(overrides) {
    const patch = {};
    if (overrides.mensagem != null)
        patch.ticketChannelMessage = overrides.mensagem || undefined;
    if (overrides.titulo != null)
        patch.ticketChannelTitle = overrides.titulo || undefined;
    if (overrides.cor != null)
        patch.ticketChannelColor = overrides.cor || undefined;
    return patch;
}
function logsOverridesToConfig(overrides) {
    const patch = {};
    if (overrides.cor != null)
        patch.modLogColor = overrides.cor || undefined;
    return patch;
}
function resolveStaffMention(guild, config) {
    if (config.ticketSupportRoleId) {
        const role = guild.roles.cache.get(config.ticketSupportRoleId);
        if (role)
            return `<@&${role.id}>`;
    }
    return "@Suporte";
}
function validatePreviewColor(cor) {
    if (!cor?.trim())
        return undefined;
    if ((0, color_1.parseHexColor)(cor) === null) {
        throw new Error("Cor inválida. Use hexadecimal, ex: #5865F2");
    }
    return cor.trim().startsWith("#") ? cor.trim() : `#${cor.trim()}`;
}
function validatePreviewImage(url) {
    if (!url?.trim())
        return undefined;
    try {
        const parsed = new URL(url.trim());
        if (!["http:", "https:"].includes(parsed.protocol))
            throw new Error();
        return url.trim();
    }
    catch {
        throw new Error("URL de imagem inválida.");
    }
}
function readPreviewOverrides(options) {
    return {
        mensagem: options.mensagem,
        titulo: options.titulo,
        cor: options.cor ? validatePreviewColor(options.cor) : undefined,
        imagem: options.imagem ? validatePreviewImage(options.imagem) : undefined,
        motivo: options.motivo,
    };
}
