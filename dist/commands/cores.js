"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coresCommand = void 0;
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
const store_1 = require("../config/store");
const color_1 = require("../utils/color");
const colorPanel_1 = require("../services/colorPanel");
exports.coresCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("cores")
        .setDescription("Cores do nome — clique para mudar a cor no servidor.")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) => sub
        .setName("painel")
        .setDescription("Publica o painel de cores neste canal."))
        .addSubcommand((sub) => sub
        .setName("criar")
        .setDescription("Cria um cargo colorido e adiciona ao painel.")
        .addStringOption((opt) => opt.setName("nome").setDescription("Nome do cargo/cor").setRequired(true))
        .addStringOption((opt) => opt
        .setName("cor")
        .setDescription("Cor hex (ex: #E74C3C)")
        .setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("adicionar")
        .setDescription("Adiciona um cargo existente ao painel de cores.")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo colorido").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("listar")
        .setDescription("Lista as cores configuradas no painel."))
        .addSubcommand((sub) => sub
        .setName("remover")
        .setDescription("Remove um cargo do painel (não deleta o cargo).")
        .addRoleOption((opt) => opt.setName("cargo").setDescription("Cargo a remover do painel").setRequired(true))),
    async execute(interaction) {
        const guild = (0, client_1.requireGuild)(interaction);
        const sub = interaction.options.getSubcommand(true);
        if (sub === "painel") {
            (0, client_1.requirePermissions)(interaction, client_1.MANAGE_GUILD);
            const channel = interaction.channel;
            if (!channel ||
                channel.type !== discord_js_1.ChannelType.GuildText ||
                !("send" in channel)) {
                throw new Error("Use este comando em um canal de texto.");
            }
            await (0, colorPanel_1.sendColorPanel)(channel);
            await interaction.reply({
                content: "Painel de cores publicado! Membros clicam para mudar a cor do nome.",
                ephemeral: true,
            });
            return;
        }
        if (sub === "listar") {
            const panel = (0, store_1.getGuildConfig)(guild.id).colorPanel;
            const lines = panel?.roleIds.length
                ? (0, colorPanel_1.formatColorRoleList)(guild, panel)
                : "Nenhuma cor no painel. Use `/cores criar` ou `/setup cores`.";
            await interaction.reply({
                content: `**Cores do painel**\n${lines}`,
                ephemeral: true,
            });
            return;
        }
        (0, client_1.requirePermissions)(interaction, client_1.MANAGE_ROLES);
        if (sub === "criar") {
            const name = interaction.options.getString("nome", true);
            const hex = interaction.options.getString("cor", true);
            if ((0, color_1.parseHexColor)(hex) === null) {
                throw new Error("Cor inválida. Ex: #FF5733");
            }
            const role = await (0, colorPanel_1.createColorRole)(guild, name, hex, interaction.user.tag);
            const roleIds = (0, colorPanel_1.appendColorRole)(guild.id, role.id);
            (0, store_1.setGuildConfig)(guild.id, {
                colorPanel: {
                    ...(0, store_1.getGuildConfig)(guild.id).colorPanel,
                    roleIds,
                },
            });
            await interaction.reply({
                content: [
                    `Cargo **${role.name}** criado (${role.hexColor}) e adicionado ao painel.`,
                    `Total: ${roleIds.length} cor(es). Use \`/cores painel\` para publicar.`,
                ].join("\n"),
                ephemeral: true,
            });
            return;
        }
        if (sub === "adicionar") {
            const role = interaction.options.getRole("cargo", true);
            if (role.id === guild.id) {
                throw new Error("Não é possível usar @everyone.");
            }
            const roleIds = (0, colorPanel_1.appendColorRole)(guild.id, role.id);
            (0, store_1.setGuildConfig)(guild.id, {
                colorPanel: {
                    ...(0, store_1.getGuildConfig)(guild.id).colorPanel,
                    roleIds,
                },
            });
            await interaction.reply({
                content: `${role} adicionado ao painel. Total: ${roleIds.length}.`,
                ephemeral: true,
            });
            return;
        }
        if (sub === "remover") {
            const role = interaction.options.getRole("cargo", true);
            const config = (0, store_1.getGuildConfig)(guild.id);
            const roleIds = (config.colorPanel?.roleIds ?? []).filter((id) => id !== role.id);
            (0, store_1.setGuildConfig)(guild.id, {
                colorPanel: {
                    ...config.colorPanel,
                    roleIds,
                },
            });
            await interaction.reply({
                content: `${role} removido do painel. O cargo continua no servidor.`,
                ephemeral: true,
            });
        }
    },
};
