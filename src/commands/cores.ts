import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { BotCommand, MANAGE_GUILD, MANAGE_ROLES, requireGuild, requirePermissions } from "../client";
import { getGuildConfig, setGuildConfig } from "../config/store";
import { parseHexColor } from "../utils/color";
import {
  appendColorRole,
  assertColorPanelConfigured,
  createColorRole,
  formatColorRoleList,
  sendColorPanel,
} from "../services/colorPanel";

export const coresCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("cores")
    .setDescription("Cores do nome — clique para mudar a cor no servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("painel")
        .setDescription("Publica o painel de cores neste canal.")
    )
    .addSubcommand((sub) =>
      sub
        .setName("criar")
        .setDescription("Cria um cargo colorido e adiciona ao painel.")
        .addStringOption((opt) =>
          opt.setName("nome").setDescription("Nome do cargo/cor").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("cor")
            .setDescription("Cor hex (ex: #E74C3C)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("adicionar")
        .setDescription("Adiciona um cargo existente ao painel de cores.")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo colorido").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("listar")
        .setDescription("Lista as cores configuradas no painel.")
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove um cargo do painel (não deleta o cargo).")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a remover do painel").setRequired(true)
        )
    ),

  async execute(interaction) {
    const guild = requireGuild(interaction);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "painel") {
      requirePermissions(interaction, MANAGE_GUILD);
      const channel = interaction.channel;

      if (
        !channel ||
        channel.type !== ChannelType.GuildText ||
        !("send" in channel)
      ) {
        throw new Error("Use este comando em um canal de texto.");
      }

      await sendColorPanel(channel);
      await interaction.reply({
        content: "Painel de cores publicado! Membros clicam para mudar a cor do nome.",
        ephemeral: true,
      });
      return;
    }

    if (sub === "listar") {
      const panel = getGuildConfig(guild.id).colorPanel;
      const lines = panel?.roleIds.length
        ? formatColorRoleList(guild, panel)
        : "Nenhuma cor no painel. Use `/cores criar` ou `/setup cores`.";

      await interaction.reply({
        content: `**Cores do painel**\n${lines}`,
        ephemeral: true,
      });
      return;
    }

    requirePermissions(interaction, MANAGE_ROLES);

    if (sub === "criar") {
      const name = interaction.options.getString("nome", true);
      const hex = interaction.options.getString("cor", true);

      if (parseHexColor(hex) === null) {
        throw new Error("Cor inválida. Ex: #FF5733");
      }

      const role = await createColorRole(guild, name, hex, interaction.user.tag);
      const roleIds = appendColorRole(guild.id, role.id);

      setGuildConfig(guild.id, {
        colorPanel: {
          ...getGuildConfig(guild.id).colorPanel,
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

      const roleIds = appendColorRole(guild.id, role.id);
      setGuildConfig(guild.id, {
        colorPanel: {
          ...getGuildConfig(guild.id).colorPanel,
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
      const config = getGuildConfig(guild.id);
      const roleIds = (config.colorPanel?.roleIds ?? []).filter((id) => id !== role.id);

      setGuildConfig(guild.id, {
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
