"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationCommand = void 0;
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
const modLog_1 = require("../services/modLog");
const moderation_1 = require("../utils/moderation");
const MOD_PERMS = discord_js_1.PermissionFlagsBits.BanMembers |
    discord_js_1.PermissionFlagsBits.KickMembers |
    discord_js_1.PermissionFlagsBits.ModerateMembers;
exports.moderationCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("mod")
        .setDescription("Comandos de moderação do servidor.")
        .setDefaultMemberPermissions(MOD_PERMS)
        .addSubcommand((sub) => sub
        .setName("ban")
        .setDescription("Bane um membro do servidor.")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro a banir").setRequired(true))
        .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo do banimento").setRequired(false))
        .addIntegerOption((opt) => opt
        .setName("apagar_mensagens")
        .setDescription("Apagar mensagens dos últimos N dias (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("unban")
        .setDescription("Remove o banimento de um usuário pelo ID.")
        .addStringOption((opt) => opt.setName("usuario_id").setDescription("ID do usuário").setRequired(true))
        .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo do desbanimento").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("kick")
        .setDescription("Expulsa um membro do servidor.")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro a expulsar").setRequired(true))
        .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo da expulsão").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("timeout")
        .setDescription("Silencia um membro temporariamente.")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro a silenciar").setRequired(true))
        .addStringOption((opt) => opt
        .setName("duracao")
        .setDescription("Duração (ex: 10m, 2h, 1d)")
        .setRequired(true))
        .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo do silenciamento").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("untimeout")
        .setDescription("Remove o silenciamento de um membro.")
        .addUserOption((opt) => opt.setName("membro").setDescription("Membro alvo").setRequired(true))
        .addStringOption((opt) => opt.setName("motivo").setDescription("Motivo").setRequired(false))),
    async execute(interaction) {
        const guild = (0, client_1.requireGuild)(interaction);
        const sub = interaction.options.getSubcommand(true);
        const reasonBase = interaction.options.getString("motivo") ?? "Sem motivo informado";
        const auditReason = `${reasonBase} | por ${(0, moderation_1.getModeratorTag)(interaction)}`;
        if (sub === "ban") {
            (0, client_1.requirePermissions)(interaction, discord_js_1.PermissionFlagsBits.BanMembers);
            const targetUser = interaction.options.getUser("membro", true);
            const deleteDays = interaction.options.getInteger("apagar_mensagens") ?? 0;
            if (targetUser.id === guild.ownerId) {
                throw new Error("Não é possível banir o dono do servidor.");
            }
            if (targetUser.id === interaction.user.id) {
                throw new Error("Você não pode se banir.");
            }
            const member = await guild.members.fetch(targetUser.id).catch(() => null);
            if (member) {
                await (0, moderation_1.getModeratableMember)(guild, interaction.user, targetUser);
            }
            await guild.members.ban(targetUser.id, {
                reason: auditReason,
                deleteMessageSeconds: deleteDays > 0 ? deleteDays * 86400 : undefined,
            });
            await (0, modLog_1.sendModLog)({
                guild,
                action: "ban",
                target: targetUser,
                moderator: interaction.user,
                reason: reasonBase,
                extra: deleteDays > 0 ? `Mensagens apagadas: últimos ${deleteDays} dia(s)` : undefined,
            });
            await interaction.reply(`**${targetUser.tag}** foi banido.`);
            return;
        }
        if (sub === "unban") {
            (0, client_1.requirePermissions)(interaction, discord_js_1.PermissionFlagsBits.BanMembers);
            const userId = interaction.options.getString("usuario_id", true).trim();
            if (!/^\d{17,20}$/.test(userId)) {
                throw new Error("ID de usuário inválido.");
            }
            await guild.members.unban(userId, auditReason);
            const unbannedUser = await interaction.client.users
                .fetch(userId)
                .catch(() => null);
            await (0, modLog_1.sendModLog)({
                guild,
                action: "unban",
                target: {
                    id: userId,
                    tag: unbannedUser?.tag ?? `ID ${userId}`,
                },
                moderator: interaction.user,
                reason: reasonBase,
            });
            await interaction.reply(`Usuário \`${userId}\` foi desbanido.`);
            return;
        }
        if (sub === "kick") {
            (0, client_1.requirePermissions)(interaction, discord_js_1.PermissionFlagsBits.KickMembers);
            const targetUser = interaction.options.getUser("membro", true);
            const member = await (0, moderation_1.getModeratableMember)(guild, interaction.user, targetUser);
            await member.kick(auditReason);
            await (0, modLog_1.sendModLog)({
                guild,
                action: "kick",
                target: targetUser,
                moderator: interaction.user,
                reason: reasonBase,
            });
            await interaction.reply(`**${targetUser.tag}** foi expulso.`);
            return;
        }
        if (sub === "timeout") {
            (0, client_1.requirePermissions)(interaction, discord_js_1.PermissionFlagsBits.ModerateMembers);
            const targetUser = interaction.options.getUser("membro", true);
            const durationRaw = interaction.options.getString("duracao", true);
            const durationMs = (0, moderation_1.parseDuration)(durationRaw);
            if (!durationMs || durationMs < 60_000) {
                throw new Error("Duração inválida. Use algo como: 10m, 2h ou 1d (mínimo 1 minuto).");
            }
            if (durationMs > moderation_1.MAX_TIMEOUT_MS) {
                throw new Error("O silenciamento máximo é de 28 dias.");
            }
            const member = await (0, moderation_1.getModeratableMember)(guild, interaction.user, targetUser);
            const until = new Date(Date.now() + durationMs);
            await member.timeout(durationMs, auditReason);
            await (0, modLog_1.sendModLog)({
                guild,
                action: "timeout",
                target: targetUser,
                moderator: interaction.user,
                reason: reasonBase,
                extra: `Duração: ${(0, moderation_1.formatDuration)(durationMs)} (até <t:${Math.floor(until.getTime() / 1000)}:R>)`,
            });
            await interaction.reply(`**${targetUser.tag}** silenciado por ${(0, moderation_1.formatDuration)(durationMs)}.`);
            return;
        }
        if (sub === "untimeout") {
            (0, client_1.requirePermissions)(interaction, discord_js_1.PermissionFlagsBits.ModerateMembers);
            const targetUser = interaction.options.getUser("membro", true);
            const member = await (0, moderation_1.getModeratableMember)(guild, interaction.user, targetUser);
            if (!member.communicationDisabledUntilTimestamp) {
                throw new Error("Esse membro não está silenciado.");
            }
            await member.timeout(null, auditReason);
            await (0, modLog_1.sendModLog)({
                guild,
                action: "untimeout",
                target: targetUser,
                moderator: interaction.user,
                reason: reasonBase,
            });
            await interaction.reply(`Silenciamento de **${targetUser.tag}** removido.`);
        }
    },
};
