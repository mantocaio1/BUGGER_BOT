import { SlashCommandBuilder } from "discord.js";
import { BotCommand } from "../client";

export const pingCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Verifica se o bot está online."),

  async execute(interaction) {
    const latency = Date.now() - interaction.createdTimestamp;
    await interaction.reply(`Pong! Latência: ${latency}ms`);
  },
};
