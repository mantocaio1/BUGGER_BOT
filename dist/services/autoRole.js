"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAutoRole = applyAutoRole;
exports.diagnoseAutoRole = diagnoseAutoRole;
const discord_js_1 = require("discord.js");
const store_1 = require("../config/store");
async function applyAutoRole(member) {
    const config = (0, store_1.getGuildConfig)(member.guild.id);
    if (!config.autoRoleEnabled || !config.autoRoleId) {
        return { applied: false, skipped: true };
    }
    const botMember = member.guild.members.me;
    if (!botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
        console.warn(`[AutoRole] Sem permissão Manage Roles em ${member.guild.name} (${member.guild.id})`);
        return {
            applied: false,
            skipped: false,
            error: "Bot sem permissão **Gerenciar Cargos**.",
        };
    }
    const role = member.guild.roles.cache.get(config.autoRoleId) ??
        (await member.guild.roles.fetch(config.autoRoleId).catch(() => null));
    if (!role) {
        console.warn(`[AutoRole] Cargo ${config.autoRoleId} não encontrado.`);
        return { applied: false, skipped: false, error: "Cargo configurado não existe." };
    }
    if (role.id === member.guild.id) {
        return { applied: false, skipped: false, error: "Cargo @everyone não pode ser auto-role." };
    }
    if (!role.editable) {
        console.warn(`[AutoRole] Cargo ${role.name} acima do bot em ${member.guild.name}.`);
        return {
            applied: false,
            skipped: false,
            error: `Cargo **${role.name}** está acima do meu. Suba meu cargo na lista.`,
        };
    }
    if (member.roles.cache.has(role.id)) {
        return { applied: true, skipped: true };
    }
    try {
        await member.roles.add(role, "Auto-role BUGGER_BOT");
        console.log(`[AutoRole] ${role.name} → ${member.user.tag} em ${member.guild.name}`);
        return { applied: true, skipped: false };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        console.error(`[AutoRole] Falha: ${message}`);
        return { applied: false, skipped: false, error: message };
    }
}
async function diagnoseAutoRole(member) {
    const config = (0, store_1.getGuildConfig)(member.guild.id);
    const lines = [];
    if (!config.autoRoleId) {
        lines.push("❌ Nenhum cargo configurado. Use `/setup autorole`.");
        return lines.join("\n");
    }
    lines.push(`• Ativo: ${config.autoRoleEnabled ? "✅ sim" : "❌ não"}`);
    lines.push(`• Cargo ID: \`${config.autoRoleId}\``);
    const botMember = member.guild.members.me;
    lines.push(`• Bot tem Manage Roles: ${botMember?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles) ? "✅" : "❌"}`);
    const role = await member.guild.roles.fetch(config.autoRoleId).catch(() => null);
    if (!role) {
        lines.push("❌ Cargo não encontrado no servidor.");
        return lines.join("\n");
    }
    lines.push(`• Cargo: ${role.name}`);
    lines.push(`• Editável pelo bot: ${role.editable ? "✅" : "❌ (subir cargo do bot)"}`);
    if (botMember) {
        lines.push(`• Posição bot/cargo: bot=${botMember.roles.highest.position} · cargo=${role.position}`);
    }
    const result = await applyAutoRole(member);
    if (result.error) {
        lines.push(`\n⚠️ Teste: ${result.error}`);
    }
    else if (result.applied && !result.skipped) {
        lines.push(`\n✅ Teste OK — cargo **${role.name}** aplicado em você.`);
    }
    else if (result.applied) {
        lines.push(`\n✅ Você já possui o cargo **${role.name}**.`);
    }
    lines.push("\n_Lembrete: ative **Server Members Intent** no [Developer Portal](https://discord.com/developers/applications)._");
    return lines.join("\n");
}
