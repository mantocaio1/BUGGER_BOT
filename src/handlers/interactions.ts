import {
  ButtonInteraction,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { BuggerBot } from "../client";
import { getGuildConfig } from "../config/store";
import { parseRoleButtonId, toggleRoleButton } from "../services/rolePanel";
import {
  applyColorRole,
  clearColorRoles,
  parseColorButtonId,
} from "../services/colorPanel";
import {
  TICKET_CLOSE_ID,
  TICKET_OPEN_PREFIX,
  canCloseTicket,
  closeTicketChannel,
  getTicketReasonMinLength,
  openTicket,
  parseTicketModalType,
  parseTicketOpenType,
  ticketModalCustomId,
  ticketRequiresReason,
} from "../services/tickets";

async function handleTicketOpen(interaction: ButtonInteraction, typeId?: string) {
  if (!interaction.inGuild() || !interaction.guild) return;
  const guild = interaction.guild;

  if (ticketRequiresReason(interaction.guildId)) {
    const minLength = getTicketReasonMinLength(interaction.guildId);
    const modal = new ModalBuilder()
      .setCustomId(ticketModalCustomId(typeId))
      .setTitle(typeId ? `Ticket — ${typeId}` : "Abrir ticket")
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("Motivo do ticket")
            .setPlaceholder(`Descreva (mín. ${minLength} caracteres)`)
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
    const member = await guild.members.fetch(interaction.user.id);
    const channel = await openTicket(member, { typeId });
    await interaction.editReply(`Ticket criado: ${channel}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível abrir o ticket.";
    await interaction.editReply(message);
  }
}

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

  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("bugger:ticket:reason_modal")
  ) {
    if (!interaction.inGuild() || !interaction.guild) return;

    await interaction.deferReply({ ephemeral: true });

    try {
      const reason = interaction.fields.getTextInputValue("motivo");
      const minLength = getTicketReasonMinLength(interaction.guildId);
      const typeId = parseTicketModalType(interaction.customId);

      if (reason.trim().length < minLength) {
        throw new Error(`O motivo deve ter pelo menos ${minLength} caracteres.`);
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const channel = await openTicket(member, { reason, typeId });
      await interaction.editReply(`Ticket criado: ${channel}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível abrir o ticket.";
      await interaction.editReply(message);
    }
    return;
  }

  if (!interaction.isButton() || !interaction.inGuild() || !interaction.guild) return;

  const guild = interaction.guild;

  const colorPick = parseColorButtonId(interaction.customId);
  if (colorPick) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const member = await guild.members.fetch(interaction.user.id);
      const result =
        colorPick === "clear"
          ? await clearColorRoles(member)
          : await applyColorRole(member, colorPick);
      await interaction.editReply(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível alterar a cor.";
      await interaction.editReply(message);
    }
    return;
  }

  const roleId = parseRoleButtonId(interaction.customId);
  if (roleId) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const member = await guild.members.fetch(interaction.user.id);
      const result = await toggleRoleButton(member, roleId);
      await interaction.editReply(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível alterar o cargo.";
      await interaction.editReply(message);
    }
    return;
  }

  if (interaction.customId.startsWith(`${TICKET_OPEN_PREFIX}`)) {
    const typeId = parseTicketOpenType(interaction.customId);
    await handleTicketOpen(interaction, typeId);
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

    const roleIds =
      "cache" in member.roles
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
      await closeTicketChannel(guild, channelId, interaction.user.id);
      await interaction.editReply("Ticket fechado. Transcript enviado.");
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
