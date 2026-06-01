"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = handleInteraction;
exports.registerInteractionHandler = registerInteractionHandler;
const discord_js_1 = require("discord.js");
const store_1 = require("../config/store");
const rolePanel_1 = require("../services/rolePanel");
const colorPanel_1 = require("../services/colorPanel");
const tickets_1 = require("../services/tickets");
async function handleTicketOpen(interaction, typeId) {
    if (!interaction.inGuild() || !interaction.guild)
        return;
    const guild = interaction.guild;
    if ((0, tickets_1.ticketRequiresReason)(interaction.guildId)) {
        const minLength = (0, tickets_1.getTicketReasonMinLength)(interaction.guildId);
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId((0, tickets_1.ticketModalCustomId)(typeId))
            .setTitle(typeId ? `Ticket — ${typeId}` : "Abrir ticket")
            .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("Motivo do ticket")
            .setPlaceholder(`Descreva (mín. ${minLength} caracteres)`)
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setMinLength(Math.max(1, Math.min(minLength, 4000)))
            .setMaxLength(1000)
            .setRequired(true)));
        await interaction.showModal(modal);
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const member = await guild.members.fetch(interaction.user.id);
        const channel = await (0, tickets_1.openTicket)(member, { typeId });
        await interaction.editReply(`Ticket criado: ${channel}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível abrir o ticket.";
        await interaction.editReply(message);
    }
}
async function handleInteraction(interaction) {
    if (interaction.isChatInputCommand()) {
        const client = interaction.client;
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, ephemeral: true });
            }
            else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        }
        return;
    }
    if (interaction.isModalSubmit() &&
        interaction.customId.startsWith("bugger:ticket:reason_modal")) {
        if (!interaction.inGuild() || !interaction.guild)
            return;
        await interaction.deferReply({ ephemeral: true });
        try {
            const reason = interaction.fields.getTextInputValue("motivo");
            const minLength = (0, tickets_1.getTicketReasonMinLength)(interaction.guildId);
            const typeId = (0, tickets_1.parseTicketModalType)(interaction.customId);
            if (reason.trim().length < minLength) {
                throw new Error(`O motivo deve ter pelo menos ${minLength} caracteres.`);
            }
            const member = await interaction.guild.members.fetch(interaction.user.id);
            const channel = await (0, tickets_1.openTicket)(member, { reason, typeId });
            await interaction.editReply(`Ticket criado: ${channel}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível abrir o ticket.";
            await interaction.editReply(message);
        }
        return;
    }
    if (!interaction.isButton() || !interaction.inGuild() || !interaction.guild)
        return;
    const guild = interaction.guild;
    const colorPick = (0, colorPanel_1.parseColorButtonId)(interaction.customId);
    if (colorPick) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const member = await guild.members.fetch(interaction.user.id);
            const result = colorPick === "clear"
                ? await (0, colorPanel_1.clearColorRoles)(member)
                : await (0, colorPanel_1.applyColorRole)(member, colorPick);
            await interaction.editReply(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível alterar a cor.";
            await interaction.editReply(message);
        }
        return;
    }
    const roleId = (0, rolePanel_1.parseRoleButtonId)(interaction.customId);
    if (roleId) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const member = await guild.members.fetch(interaction.user.id);
            const result = await (0, rolePanel_1.toggleRoleButton)(member, roleId);
            await interaction.editReply(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível alterar o cargo.";
            await interaction.editReply(message);
        }
        return;
    }
    if (interaction.customId.startsWith(`${tickets_1.TICKET_OPEN_PREFIX}`)) {
        const typeId = (0, tickets_1.parseTicketOpenType)(interaction.customId);
        await handleTicketOpen(interaction, typeId);
        return;
    }
    if (interaction.customId === tickets_1.TICKET_CLOSE_ID) {
        const config = (0, store_1.getGuildConfig)(interaction.guildId);
        const channelId = interaction.channelId;
        const member = interaction.member;
        if (!member || !("roles" in member)) {
            await interaction.reply({
                content: "Não foi possível verificar suas permissões.",
                ephemeral: true,
            });
            return;
        }
        const roleIds = "cache" in member.roles
            ? [...member.roles.cache.keys()]
            : member.roles;
        if (!(0, tickets_1.canCloseTicket)(interaction.guildId, channelId, interaction.user.id, config.ticketSupportRoleId, roleIds)) {
            await interaction.reply({
                content: "Apenas o dono do ticket ou a equipe de suporte pode fechar.",
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        try {
            await (0, tickets_1.closeTicketChannel)(guild, channelId, interaction.user.id);
            await interaction.editReply("Ticket fechado. Transcript enviado.");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Não foi possível fechar o ticket.";
            await interaction.editReply(message);
        }
    }
}
function registerInteractionHandler(client) {
    client.on("interactionCreate", (interaction) => {
        handleInteraction(interaction).catch(console.error);
    });
}
