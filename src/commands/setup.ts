import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { BotCommand, MANAGE_GUILD, requireGuild, requirePermissions } from "../client";
import { getGuildConfig, setGuildConfig } from "../config/store";

export const setupCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configurações do BUGGER_BOT neste servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("logs")
        .setDescription("Define o canal de logs de moderação.")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de texto para logs")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("ver").setDescription("Mostra as configurações atuais.")
    ),

  async execute(interaction) {
    requirePermissions(interaction, MANAGE_GUILD);
    const guild = requireGuild(interaction);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "logs") {
      const channel = interaction.options.getChannel("canal", true);
      setGuildConfig(guild.id, { modLogChannelId: channel.id });

      await interaction.reply({
        content: `Canal de logs definido: ${channel}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "ver") {
      const config = getGuildConfig(guild.id);
      const logChannel = config.modLogChannelId
        ? guild.channels.cache.get(config.modLogChannelId)?.toString() ??
          `\`${config.modLogChannelId}\` (canal não encontrado)`
        : "Não configurado";

      await interaction.reply({
        content: `**Configurações do servidor**\n• Logs de moderação: ${logChannel}`,
        ephemeral: true,
      });
    }
  },
};
