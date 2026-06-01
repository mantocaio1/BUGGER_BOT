"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesCommand = void 0;
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
const rolePanel_1 = require("../services/rolePanel");
exports.rolesCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("roles")
        .setDescription("Publica o painel de cargos por botão.")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) => sub
        .setName("painel")
        .setDescription("Envia o painel de cargos neste canal.")),
    async execute(interaction) {
        (0, client_1.requirePermissions)(interaction, client_1.MANAGE_GUILD);
        const channel = interaction.channel;
        if (!channel ||
            channel.type !== discord_js_1.ChannelType.GuildText ||
            !("send" in channel)) {
            throw new Error("Use este comando em um canal de texto do servidor.");
        }
        await (0, rolePanel_1.sendRolePanel)(channel);
        await interaction.reply({
            content: "Painel de cargos publicado neste canal.",
            ephemeral: true,
        });
    },
};
