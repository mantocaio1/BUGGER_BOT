"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverinfoCommand = void 0;
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
exports.serverinfoCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Mostra informações básicas do servidor."),
    async execute(interaction) {
        const guild = (0, client_1.requireGuild)(interaction);
        await guild.fetch();
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(guild.name)
            .setColor(0x5865f2)
            .addFields({ name: "Membros", value: `${guild.memberCount}`, inline: true }, { name: "Canais", value: `${guild.channels.cache.size}`, inline: true }, { name: "Cargos", value: `${guild.roles.cache.size}`, inline: true }, {
            name: "Dono",
            value: guild.members.cache.get(guild.ownerId)?.user.tag ?? "Desconhecido",
            inline: true,
        }, {
            name: "Criado em",
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
            inline: true,
        });
        if (guild.iconURL()) {
            embed.setThumbnail(guild.iconURL());
        }
        await interaction.reply({ embeds: [embed] });
    },
};
