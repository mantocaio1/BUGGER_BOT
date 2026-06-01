"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TIMEOUT_MS = void 0;
exports.parseDuration = parseDuration;
exports.getModeratableMember = getModeratableMember;
exports.formatDuration = formatDuration;
exports.getModeratorTag = getModeratorTag;
function parseDuration(raw) {
    const match = raw.trim().match(/^(\d+)\s*(m|min|h|hora|horas|d|dia|dias)$/i);
    if (!match)
        return null;
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.startsWith("m"))
        return value * 60 * 1000;
    if (unit.startsWith("h"))
        return value * 60 * 60 * 1000;
    return value * 24 * 60 * 60 * 1000;
}
exports.MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;
async function getModeratableMember(guild, executor, targetUser) {
    if (targetUser.id === guild.ownerId) {
        throw new Error("Não é possível moderar o dono do servidor.");
    }
    if (targetUser.id === executor.id) {
        throw new Error("Você não pode usar moderação em si mesmo.");
    }
    if (targetUser.bot && targetUser.id === guild.client.user?.id) {
        throw new Error("Não posso me moderar.");
    }
    const target = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!target) {
        throw new Error("Membro não encontrado neste servidor.");
    }
    const executorMember = await guild.members.fetch(executor.id);
    const botMember = guild.members.me;
    if (!botMember) {
        throw new Error("Não consegui verificar meu cargo no servidor.");
    }
    if (target.roles.highest.position >= executorMember.roles.highest.position &&
        executor.id !== guild.ownerId) {
        throw new Error("Esse membro tem cargo igual ou superior ao seu.");
    }
    if (target.roles.highest.position >= botMember.roles.highest.position) {
        throw new Error("Meu cargo é inferior ao do alvo. Suba meu cargo na lista de cargos.");
    }
    return target;
}
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60)
        return `${minutes} minuto(s)`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} hora(s)`;
    const days = Math.floor(hours / 24);
    return `${days} dia(s)`;
}
function getModeratorTag(interaction) {
    return interaction.user.tag;
}
