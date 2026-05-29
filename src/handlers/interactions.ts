import { Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";
import { BuggerBot } from "../client";
import { getGuildConfig } from "../config/store";
import {
  TICKET_CLOSE_ID,
  TICKET_OPEN_ID,
  TICKET_REASON_INPUT_ID,
  TICKET_REASON_MODAL_ID,
  canCloseTicket,
  closeTicketChannel,
  getTicketReasonMinLength,
  openTicket,
  ticketRequiresReason,
} from "../services/tickets";

export async function handleInteraction(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    const client = interaction.client as BuggerBot;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ocorreu um erro inesperado.";

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: message, ephemeral: true });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === TICKET_REASON_MODAL_ID) {
    if (!interaction.inGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    try {
      const reason = interaction.fields.getTextInputValue(TICKET_REASON_INPUT_ID);
      const minLength = getTicketReasonMinLength(interaction.guildId);

      if (reason.trim().length < minLength) {
        throw new Error(`O motivo deve ter pelo menos ${minLength} caracteres.`);
      }

      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const channel = await openTicket(member, reason);
      await interaction.editReply(`Ticket criado: ${channel}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível abrir o ticket.";
      await interaction.editReply(message);
    }
    return;
  }

  if (!interaction.isButton() || !interaction.inGuild()) return;

  if (interaction.customId === TICKET_OPEN_ID) {
    if (ticketRequiresReason(interaction.guildId)) {
      const minLength = getTicketReasonMinLength(interaction.guildId);
      const modal = new ModalBuilder()
        .setCustomId(TICKET_REASON_MODAL_ID)
        .setTitle("Abrir ticket")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId(TICKET_REASON_INPUT_ID)
              .setLabel("Motivo do ticket")
              .setPlaceholder(`Descreva seu problema (mín. ${minLength} caracteres)`)
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(Math.max(1, Math.min(minLength, 4000)))
              .setMaxLength(1000)
              .setRequired(true)
          )
        );

      await interaction.showModal(modal);
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const channel = await openTicket(member);
      await interaction.editReply(`Ticket criado: ${channel}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível abrir o ticket.";
      await interaction.editReply(message);
    }
    return;
  }

  if (interaction.customId === TICKET_CLOSE_ID) {
    const config = getGuildConfig(interaction.guildId);
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
      : (member.roles as string[]);

    if (
      !canCloseTicket(
        interaction.guildId,
        channelId,
        interaction.user.id,
        config.ticketSupportRoleId,
        roleIds
      )
    ) {
      await interaction.reply({
        content: "Apenas o dono do ticket ou a equipe de suporte pode fechar.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await closeTicketChannel(
        interaction.guild!,
        channelId,
        interaction.user.id
      );
      await interaction.editReply("Ticket fechado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível fechar o ticket.";
      await interaction.editReply(message);
    }
  }
}

export function registerInteractionHandler(client: BuggerBot) {
  client.on("interactionCreate", (interaction) => {
    handleInteraction(interaction).catch(console.error);
  });
}
