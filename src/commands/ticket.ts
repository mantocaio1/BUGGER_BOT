import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { BotCommand, MANAGE_GUILD, requirePermissions } from "../client";
import { sendTicketPanel } from "../services/tickets";

export const ticketCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Gerencia o sistema de tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("painel")
        .setDescription("Envia o painel de abertura de tickets neste canal.")
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

    await sendTicketPanel(channel);
    await interaction.reply({
      content: "Painel de tickets publicado neste canal.",
      ephemeral: true,
    });
  },
};
