import {

  ChannelType,

  GuildScheduledEventEntityType,

  GuildScheduledEventPrivacyLevel,

  PermissionFlagsBits,

  SlashCommandBuilder,

} from "discord.js";

import { DEFAULT_EVENT_DURATION_MS } from "../config/defaults";

import {

  BotCommand,

  MANAGE_EVENTS,

  requireGuild,

  requirePermissions,

} from "../client";

import { DATE_TIME_HINT, parseDateTime } from "../utils/datetime";



function resolveEventChannel(guild: ReturnType<typeof requireGuild>, channelId: string) {

  const guildChannel = guild.channels.cache.get(channelId);



  if (!guildChannel) {

    throw new Error("Canal não encontrado neste servidor.");

  }



  if (guildChannel.type === ChannelType.GuildStageVoice) {

    return {

      channelId,

      entityType: GuildScheduledEventEntityType.StageInstance,

    };

  }



  if (guildChannel.type === ChannelType.GuildVoice) {

    return {

      channelId,

      entityType: GuildScheduledEventEntityType.Voice,

    };

  }



  throw new Error("Canal inválido. Use um canal de voz ou palco (stage).");

}



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

            .setName("inicio")

            .setDescription(`Início (${DATE_TIME_HINT})`)

            .setRequired(true)

        )

        .addStringOption((opt) =>

          opt

            .setName("fim")

            .setDescription(

              `Término (${DATE_TIME_HINT}) — obrigatório sem canal de voz/palco`

            )

            .setRequired(false)

        )

        .addStringOption((opt) =>

          opt

            .setName("descricao")

            .setDescription("Descrição do evento")

            .setRequired(false)

        )

        .addStringOption((opt) =>

          opt

            .setName("local")

            .setDescription("Local do evento (quando não usar canal)")

            .setRequired(false)

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

      const endRaw = interaction.options.getString("fim");

      const location =

        interaction.options.getString("local") ?? "Servidor Discord";

      const channelOption = interaction.options.getChannel("canal");



      const startTime = parseDateTime(startRaw);

      if (!startTime || startTime.getTime() <= Date.now()) {

        throw new Error(

          `Data de início inválida ou no passado. Use: ${DATE_TIME_HINT}`

        );

      }



      const isExternal = !channelOption;

      let endTime = endRaw ? parseDateTime(endRaw) : null;



      if (isExternal && !endTime) {

        endTime = new Date(startTime.getTime() + DEFAULT_EVENT_DURATION_MS);

      }



      if (endTime && endTime.getTime() <= startTime.getTime()) {

        throw new Error("A data de término deve ser depois do início.");

      }



      if (isExternal && !endTime) {

        throw new Error(

          `Eventos externos exigem horário de término. Informe \`fim\` (${DATE_TIME_HINT}) ou use um canal.`

        );

      }



      const channelInfo = channelOption

        ? resolveEventChannel(guild, channelOption.id)

        : null;



      const scheduledEvent = await guild.scheduledEvents.create({

        name,

        description,

        scheduledStartTime: startTime,

        scheduledEndTime: endTime ?? undefined,

        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,

        entityType: channelInfo

          ? channelInfo.entityType

          : GuildScheduledEventEntityType.External,

        entityMetadata: channelInfo ? undefined : { location },

        channel: channelInfo?.channelId,

      });



      const startUnix = Math.floor(startTime.getTime() / 1000);

      const channelLabel = channelInfo

        ? channelInfo.entityType === GuildScheduledEventEntityType.StageInstance

          ? "palco"

          : "voz"

        : "externo";



      let reply =

        `Evento **${scheduledEvent.name}** criado (${channelLabel})! Início: <t:${startUnix}:F>`;



      if (endTime) {

        reply += ` · Término: <t:${Math.floor(endTime.getTime() / 1000)}:F>`;

      }



      await interaction.reply(reply);

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

        const end = event.scheduledEndTimestamp

          ? ` → <t:${Math.floor(event.scheduledEndTimestamp / 1000)}:F>`

          : "";

        return `• **${event.name}** (\`${event.id}\`) — <t:${start}:F>${end}`;

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


