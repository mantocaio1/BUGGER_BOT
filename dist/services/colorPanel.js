"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOR_CLEAR_ID = exports.COLOR_BUTTON_PREFIX = void 0;
exports.colorButtonCustomId = colorButtonCustomId;
exports.parseColorButtonId = parseColorButtonId;
exports.assertColorPanelConfigured = assertColorPanelConfigured;
exports.buildColorPanelRows = buildColorPanelRows;
exports.sendColorPanel = sendColorPanel;
exports.applyColorRole = applyColorRole;
exports.clearColorRoles = clearColorRoles;
exports.appendColorRole = appendColorRole;
exports.createColorRole = createColorRole;
exports.formatColorRoleList = formatColorRoleList;
const discord_js_1 = require("discord.js");
const defaults_1 = require("../config/defaults");
const store_1 = require("../config/store");
const color_1 = require("../utils/color");
exports.COLOR_BUTTON_PREFIX = "bugger:color:";
exports.COLOR_CLEAR_ID = "bugger:color:clear";
function colorButtonCustomId(roleId) {
    return `${exports.COLOR_BUTTON_PREFIX}${roleId}`;
}
function parseColorButtonId(customId) {
    if (customId === exports.COLOR_CLEAR_ID)
        return "clear";
    if (!customId.startsWith(exports.COLOR_BUTTON_PREFIX))
        return undefined;
    const id = customId.slice(exports.COLOR_BUTTON_PREFIX.length);
    return id || undefined;
}
function assertColorPanelConfigured(guildId) {
    const panel = (0, store_1.getGuildConfig)(guildId).colorPanel;
    if (!panel?.roleIds?.length) {
        throw new Error("Painel de cores não configurado. Use `/setup cores` ou `/cores adicionar`.");
    }
    return panel;
}
function roleToButtonStyle(role) {
    if (!role.color)
        return discord_js_1.ButtonStyle.Secondary;
    const r = (role.color >> 16) & 0xff;
    const g = (role.color >> 8) & 0xff;
    if (r > 180 && g < 90)
        return discord_js_1.ButtonStyle.Danger;
    if (g > 140 && r < 90)
        return discord_js_1.ButtonStyle.Success;
    if (r > 180 && g > 140)
        return discord_js_1.ButtonStyle.Secondary;
    return discord_js_1.ButtonStyle.Primary;
}
function buildColorPanelRows(guild, panel) {
    const rows = [];
    let current = new discord_js_1.ActionRowBuilder();
    for (const roleId of panel.roleIds.slice(0, 20)) {
        const role = guild.roles.cache.get(roleId);
        if (!role)
            continue;
        if (current.components.length >= 5) {
            rows.push(current);
            current = new discord_js_1.ActionRowBuilder();
        }
        current.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(colorButtonCustomId(roleId))
            .setLabel(role.name.slice(0, 80))
            .setStyle(roleToButtonStyle(role)));
    }
    if (current.components.length >= 5) {
        rows.push(current);
        current = new discord_js_1.ActionRowBuilder();
    }
    current.addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(exports.COLOR_CLEAR_ID)
        .setLabel("Sem cor")
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji("⬜"));
    if (current.components.length > 0)
        rows.push(current);
    return rows;
}
async function sendColorPanel(channel) {
    const panel = assertColorPanelConfigured(channel.guild.id);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor((0, color_1.parseHexColor)(panel.embedColor) ?? defaults_1.DEFAULT_ROLE_PANEL_COLOR)
        .setTitle(panel.title?.trim() || defaults_1.DEFAULT_COLOR_PANEL_TITLE)
        .setDescription(panel.message?.trim() || defaults_1.DEFAULT_COLOR_PANEL_MESSAGE);
    const rows = buildColorPanelRows(channel.guild, panel);
    if (rows.every((r) => r.components.length === 0)) {
        throw new Error("Nenhum cargo de cor válido encontrado. Recrie os cargos ou reconfigure.");
    }
    await channel.send({ embeds: [embed], components: rows });
}
async function fetchEditableRole(guild, roleId) {
    const role = guild.roles.cache.get(roleId) ??
        (await guild.roles.fetch(roleId).catch(() => null));
    if (!role)
        throw new Error("Cargo de cor não encontrado.");
    if (!role.editable) {
        throw new Error(`Cargo **${role.name}** está acima do meu na hierarquia.`);
    }
    return role;
}
async function applyColorRole(member, roleId) {
    const panel = assertColorPanelConfigured(member.guild.id);
    if (!panel.roleIds.includes(roleId)) {
        throw new Error("Esta cor não faz parte do painel configurado.");
    }
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
        throw new Error("Bot sem permissão **Gerenciar Cargos**.");
    }
    const role = await fetchEditableRole(member.guild, roleId);
    if (!role.color && role.colors?.primaryColor == null) {
        throw new Error(`Cargo **${role.name}** não tem cor. Use \`/cores criar\` ou defina cor no cargo.`);
    }
    const panelRoles = panel.roleIds
        .map((id) => member.guild.roles.cache.get(id))
        .filter((r) => !!r);
    const hasRole = member.roles.cache.has(role.id);
    if (hasRole) {
        await member.roles.remove(role, "Color panel BUGGER_BOT — toggle off");
        return `Cor **${role.name}** removida. Seu nome voltou ao padrão.`;
    }
    const toRemove = panelRoles.filter((r) => r.id !== role.id && member.roles.cache.has(r.id));
    if (toRemove.length > 0) {
        await member.roles.remove(toRemove, "Color panel BUGGER_BOT — troca de cor");
    }
    await member.roles.add(role, "Color panel BUGGER_BOT");
    return `Cor do nome alterada para **${role.name}**!`;
}
async function clearColorRoles(member) {
    const panel = (0, store_1.getGuildConfig)(member.guild.id).colorPanel;
    if (!panel?.roleIds.length) {
        throw new Error("Painel de cores não configurado.");
    }
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
        throw new Error("Bot sem permissão **Gerenciar Cargos**.");
    }
    const toRemove = panel.roleIds
        .filter((id) => member.roles.cache.has(id))
        .map((id) => member.guild.roles.cache.get(id))
        .filter((r) => !!r && r.editable);
    if (toRemove.length === 0) {
        return "Você não tinha nenhuma cor do painel.";
    }
    await member.roles.remove(toRemove, "Color panel BUGGER_BOT — limpar");
    return "Todas as cores do painel foram removidas.";
}
function appendColorRole(guildId, roleId) {
    const config = (0, store_1.getGuildConfig)(guildId);
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
async function createColorRole(guild, name, hexColor, creatorTag) {
    const color = (0, color_1.parseHexColor)(hexColor);
    if (color === null) {
        throw new Error("Cor inválida. Use hexadecimal, ex: #E74C3C");
    }
    const botMember = guild.members.me;
    if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
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
function formatColorRoleList(guild, panel) {
    if (!panel.roleIds.length)
        return "Nenhuma cor configurada.";
    return panel.roleIds
        .map((id, i) => {
        const role = guild.roles.cache.get(id);
        if (!role)
            return `${i + 1}. \`${id}\` — cargo não encontrado`;
        const hex = role.hexColor === "#000000" && !role.color ? "sem cor" : role.hexColor;
        return `${i + 1}. ${role.toString()} — \`${hex}\``;
    })
        .join("\n");
}
