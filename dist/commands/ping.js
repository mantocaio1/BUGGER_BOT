"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingCommand = void 0;
const discord_js_1 = require("discord.js");
exports.pingCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Verifica se o bot está online."),
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        await interaction.reply(`Pong! Latência: ${latency}ms`);
    },
};
