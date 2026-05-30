import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { BotCommand, MANAGE_GUILD, requirePermissions } from "../client";
import { sendRolePanel } from "../services/rolePanel";

export const rolesCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("Publica o painel de cargos por botão.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("painel")
        .setDescription("Envia o painel de cargos neste canal.")
    ),

  async execute(interaction) {
    requirePermissions(interaction, MANAGE_GUILD);
    const channel = interaction.channel;

    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      !("send" in channel)
    ) {
      throw new Error("Use este comando em um canal de texto do servidor.");
    }

    await sendRolePanel(channel);
    await interaction.reply({
      content: "Painel de cargos publicado neste canal.",
      ephemeral: true,
    });
  },
};
