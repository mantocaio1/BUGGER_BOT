"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MANAGE_EVENTS = exports.MANAGE_ROLES = exports.MANAGE_GUILD = exports.BuggerBot = void 0;
exports.requireGuild = requireGuild;
exports.requirePermissions = requirePermissions;
const discord_js_1 = require("discord.js");
class BuggerBot extends discord_js_1.Client {
    commands = new discord_js_1.Collection();
    constructor() {
        super({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildScheduledEvents,
            ],
        });
    }
}
exports.BuggerBot = BuggerBot;
function requireGuild(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
        throw new Error("Este comando só pode ser usado dentro de um servidor.");
    }
    return interaction.guild;
}
function requirePermissions(interaction, permissions) {
    const member = interaction.member;
    if (!member || !("permissions" in member)) {
        throw new Error("Não foi possível verificar suas permissões.");
    }
    const perms = member.permissions instanceof discord_js_1.PermissionsBitField
        ? member.permissions
        : new discord_js_1.PermissionsBitField(member.permissions);
    if (!perms.has(permissions)) {
        throw new Error("Você não tem permissão para usar este comando.");
    }
}
exports.MANAGE_GUILD = discord_js_1.PermissionFlagsBits.ManageGuild;
exports.MANAGE_ROLES = discord_js_1.PermissionFlagsBits.ManageRoles;
exports.MANAGE_EVENTS = discord_js_1.PermissionFlagsBits.ManageEvents;
