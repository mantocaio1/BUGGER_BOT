"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_BUTTON_PREFIX = void 0;
exports.roleButtonCustomId = roleButtonCustomId;
exports.parseRoleButtonId = parseRoleButtonId;
exports.assertRolePanelConfigured = assertRolePanelConfigured;
exports.buildRolePanelRows = buildRolePanelRows;
exports.sendRolePanel = sendRolePanel;
exports.toggleRoleButton = toggleRoleButton;
const discord_js_1 = require("discord.js");
const defaults_1 = require("../config/defaults");
const store_1 = require("../config/store");
const color_1 = require("../utils/color");
const template_1 = require("../utils/template");
exports.ROLE_BUTTON_PREFIX = "bugger:role:";
function roleButtonCustomId(roleId) {
    return `${exports.ROLE_BUTTON_PREFIX}${roleId}`;
}
function parseRoleButtonId(customId) {
    if (!customId.startsWith(exports.ROLE_BUTTON_PREFIX))
        return undefined;
    return customId.slice(exports.ROLE_BUTTON_PREFIX.length);
}
function assertRolePanelConfigured(guildId) {
    const panel = (0, store_1.getGuildConfig)(guildId).rolePanel;
    if (!panel?.buttons?.length) {
        throw new Error("Painel de cargos não configurado. Use `/setup roles` com pelo menos um cargo.");
    }
    return panel;
}
function buildRolePanelRows(panel) {
    const rows = [];
    let current = new discord_js_1.ActionRowBuilder();
    for (const entry of panel.buttons.slice(0, 25)) {
        if (current.components.length >= 5) {
            rows.push(current);
            current = new discord_js_1.ActionRowBuilder();
        }
        const button = new discord_js_1.ButtonBuilder()
            .setCustomId(roleButtonCustomId(entry.roleId))
            .setLabel(entry.label.slice(0, 80))
            .setStyle(discord_js_1.ButtonStyle.Secondary);
        if (entry.emoji)
            button.setEmoji(entry.emoji);
        current.addComponents(button);
    }
    if (current.components.length > 0)
        rows.push(current);
    return rows;
}
async function sendRolePanel(channel) {
    const config = (0, store_1.getGuildConfig)(channel.guild.id);
    const panel = assertRolePanelConfigured(channel.guild.id);
    const variables = {
        server: channel.guild.name,
        count: String(channel.guild.memberCount),
    };
    const embed = new discord_js_1.EmbedBuilder()
        .setColor((0, color_1.parseHexColor)(panel.color) ?? defaults_1.DEFAULT_ROLE_PANEL_COLOR)
        .setDescription((0, template_1.applyTemplate)(panel.message ?? "Clique para receber ou remover um cargo:", variables));
    if (panel.title?.trim()) {
        embed.setTitle((0, template_1.applyTemplate)(panel.title, variables));
    }
    if (panel.imageUrl?.trim()) {
        embed.setImage(panel.imageUrl.trim());
    }
    await channel.send({
        embeds: [embed],
        components: buildRolePanelRows(panel),
    });
}
async function toggleRoleButton(member, roleId) {
    const panel = (0, store_1.getGuildConfig)(member.guild.id).rolePanel;
    const entry = panel?.buttons.find((b) => b.roleId === roleId);
    if (!entry) {
        throw new Error("Este botão não está configurado no painel de cargos.");
    }
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
        throw new Error("Bot sem permissão **Gerenciar Cargos**.");
    }
    const role = member.guild.roles.cache.get(roleId) ??
        (await member.guild.roles.fetch(roleId).catch(() => null));
    if (!role)
        throw new Error("Cargo não encontrado.");
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
