import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { BotCommand, requireGuild } from "../client";

export const serverinfoCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Mostra informações básicas do servidor."),

  async execute(interaction) {
    const guild = requireGuild(interaction);
    await guild.fetch();

    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setColor(0x5865f2)
      .addFields(
        { name: "Membros", value: `${guild.memberCount}`, inline: true },
        { name: "Canais", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Cargos", value: `${guild.roles.cache.size}`, inline: true },
        {
          name: "Dono",
          value: guild.members.cache.get(guild.ownerId)?.user.tag ?? "Desconhecido",
          inline: true,
        },
        {
          name: "Criado em",
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true,
        }
      );

    if (guild.iconURL()) {
      embed.setThumbnail(guild.iconURL());
    }

    await interaction.reply({ embeds: [embed] });
  },
};
