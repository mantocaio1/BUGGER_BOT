import {
  ChannelType,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  BotCommand,
  MANAGE_EVENTS,
  requireGuild,
  requirePermissions,
} from "../client";

export const eventCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("evento")
    .setDescription("Gerencia eventos agendados do servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand((sub) =>
      sub
        .setName("criar")
        .setDescription("Cria um evento agendado.")
        .addStringOption((opt) =>
          opt.setName("nome").setDescription("Nome do evento").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("descricao")
            .setDescription("Descrição do evento")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("inicio")
            .setDescription("Data/hora de início (ex: 2026-06-01 20:00)")
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de voz ou palco para o evento")
            .addChannelTypes(
              ChannelType.GuildVoice,
              ChannelType.GuildStageVoice
            )
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("listar")
        .setDescription("Lista os eventos agendados do servidor.")
    )
    .addSubcommand((sub) =>
      sub
        .setName("cancelar")
        .setDescription("Cancela um evento agendado.")
        .addStringOption((opt) =>
          opt
            .setName("evento")
            .setDescription("ID do evento")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    requirePermissions(interaction, MANAGE_EVENTS);
    const guild = requireGuild(interaction);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "criar") {
      const name = interaction.options.getString("nome", true);
      const description =
        interaction.options.getString("descricao") ?? undefined;
      const startRaw = interaction.options.getString("inicio", true);
      const channel = interaction.options.getChannel("canal");

      const startTime = parseDateTime(startRaw);
      if (!startTime || startTime.getTime() <= Date.now()) {
        throw new Error(
          "Data inválida ou no passado. Use o formato: AAAA-MM-DD HH:MM"
        );
      }

      const scheduledEvent = await guild.scheduledEvents.create({
        name,
        description,
        scheduledStartTime: startTime,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: channel
          ? GuildScheduledEventEntityType.Voice
          : GuildScheduledEventEntityType.External,
        entityMetadata: channel
          ? undefined
          : { location: "Servidor Discord" },
        channel: channel?.id,
      });

      await interaction.reply(
        `Evento **${scheduledEvent.name}** criado! Início: <t:${Math.floor(startTime.getTime() / 1000)}:F>`
      );
      return;
    }

    if (sub === "listar") {
      const events = await guild.scheduledEvents.fetch();

      if (events.size === 0) {
        await interaction.reply({
          content: "Nenhum evento agendado neste servidor.",
          ephemeral: true,
        });
        return;
      }

      const lines = events.map((event) => {
        const start = Math.floor((event.scheduledStartTimestamp ?? 0) / 1000);
        return `• **${event.name}** (\`${event.id}\`) — <t:${start}:F>`;
      });

      await interaction.reply({
        content: lines.join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "cancelar") {
      const eventId = interaction.options.getString("evento", true);
      const event = await guild.scheduledEvents.fetch(eventId).catch(() => null);

      if (!event) {
        throw new Error("Evento não encontrado. Use `/evento listar` para ver os IDs.");
      }

      await event.delete();
      await interaction.reply(`Evento **${event.name}** cancelado.`);
    }
  },
};

function parseDateTime(raw: string): Date | null {
  const normalized = raw.trim().replace("T", " ");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})$/
  );

  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return Number.isNaN(date.getTime()) ? null : date;
}
