"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketCommand = void 0;
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
const tickets_1 = require("../services/tickets");
exports.ticketCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Gerencia o sistema de tickets.")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) => sub
        .setName("painel")
        .setDescription("Envia o painel de abertura de tickets neste canal.")),
    async execute(interaction) {
        (0, client_1.requirePermissions)(interaction, client_1.MANAGE_GUILD);
        const channel = interaction.channel;
        if (!channel ||
            channel.type !== discord_js_1.ChannelType.GuildText ||
            !("send" in channel)) {
            throw new Error("Use este comando em um canal de texto do servidor.");
        }
        await (0, tickets_1.sendTicketPanel)(channel);
        await interaction.reply({
            content: "Painel de tickets publicado neste canal.",
            ephemeral: true,
        });
    },
};
