"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventCommand = void 0;
const discord_js_1 = require("discord.js");
const defaults_1 = require("../config/defaults");
const client_1 = require("../client");
const datetime_1 = require("../utils/datetime");
function resolveEventChannel(guild, channelId) {
    const guildChannel = guild.channels.cache.get(channelId);
    if (!guildChannel) {
        throw new Error("Canal não encontrado neste servidor.");
    }
    if (guildChannel.type === discord_js_1.ChannelType.GuildStageVoice) {
        return {
            channelId,
            entityType: discord_js_1.GuildScheduledEventEntityType.StageInstance,
        };
    }
    if (guildChannel.type === discord_js_1.ChannelType.GuildVoice) {
        return {
            channelId,
            entityType: discord_js_1.GuildScheduledEventEntityType.Voice,
        };
    }
    throw new Error("Canal inválido. Use um canal de voz ou palco (stage).");
}
exports.eventCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("evento")
        .setDescription("Gerencia eventos agendados do servidor.")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageEvents)
        .addSubcommand((sub) => sub
        .setName("criar")
        .setDescription("Cria um evento agendado.")
        .addStringOption((opt) => opt.setName("nome").setDescription("Nome do evento").setRequired(true))
        .addStringOption((opt) => opt
        .setName("inicio")
        .setDescription(`Início (${datetime_1.DATE_TIME_HINT})`)
        .setRequired(true))
        .addStringOption((opt) => opt
        .setName("fim")
        .setDescription(`Término (${datetime_1.DATE_TIME_HINT}) — obrigatório sem canal de voz/palco`)
        .setRequired(false))
        .addStringOption((opt) => opt
        .setName("descricao")
        .setDescription("Descrição do evento")
        .setRequired(false))
        .addStringOption((opt) => opt
        .setName("local")
        .setDescription("Local do evento (quando não usar canal)")
        .setRequired(false))
        .addChannelOption((opt) => opt
        .setName("canal")
        .setDescription("Canal de voz ou palco para o evento")
        .addChannelTypes(discord_js_1.ChannelType.GuildVoice, discord_js_1.ChannelType.GuildStageVoice)
        .setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("listar")
        .setDescription("Lista os eventos agendados do servidor."))
        .addSubcommand((sub) => sub
        .setName("cancelar")
        .setDescription("Cancela um evento agendado.")
        .addStringOption((opt) => opt
        .setName("evento")
        .setDescription("ID do evento")
        .setRequired(true))),
    async execute(interaction) {
        (0, client_1.requirePermissions)(interaction, client_1.MANAGE_EVENTS);
        const guild = (0, client_1.requireGuild)(interaction);
        const sub = interaction.options.getSubcommand(true);
        if (sub === "criar") {
            const name = interaction.options.getString("nome", true);
            const description = interaction.options.getString("descricao") ?? undefined;
            const startRaw = interaction.options.getString("inicio", true);
            const endRaw = interaction.options.getString("fim");
            const location = interaction.options.getString("local") ?? "Servidor Discord";
            const channelOption = interaction.options.getChannel("canal");
            const startTime = (0, datetime_1.parseDateTime)(startRaw);
            if (!startTime || startTime.getTime() <= Date.now()) {
                throw new Error(`Data de início inválida ou no passado. Use: ${datetime_1.DATE_TIME_HINT}`);
            }
            const isExternal = !channelOption;
            let endTime = endRaw ? (0, datetime_1.parseDateTime)(endRaw) : null;
            if (isExternal && !endTime) {
                endTime = new Date(startTime.getTime() + defaults_1.DEFAULT_EVENT_DURATION_MS);
            }
            if (endTime && endTime.getTime() <= startTime.getTime()) {
                throw new Error("A data de término deve ser depois do início.");
            }
            if (isExternal && !endTime) {
                throw new Error(`Eventos externos exigem horário de término. Informe \`fim\` (${datetime_1.DATE_TIME_HINT}) ou use um canal.`);
            }
            const channelInfo = channelOption
                ? resolveEventChannel(guild, channelOption.id)
                : null;
            const scheduledEvent = await guild.scheduledEvents.create({
                name,
                description,
                scheduledStartTime: startTime,
                scheduledEndTime: endTime ?? undefined,
                privacyLevel: discord_js_1.GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: channelInfo
                    ? channelInfo.entityType
                    : discord_js_1.GuildScheduledEventEntityType.External,
                entityMetadata: channelInfo ? undefined : { location },
                channel: channelInfo?.channelId,
            });
            const startUnix = Math.floor(startTime.getTime() / 1000);
            const channelLabel = channelInfo
                ? channelInfo.entityType === discord_js_1.GuildScheduledEventEntityType.StageInstance
                    ? "palco"
                    : "voz"
                : "externo";
            let reply = `Evento **${scheduledEvent.name}** criado (${channelLabel})! Início: <t:${startUnix}:F>`;
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
