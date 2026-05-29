import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
  BotCommand,
  MANAGE_ROLES,
  requireGuild,
  requirePermissions,
} from "../client";

export const roleCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Gerencia cargos do servidor.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("criar")
        .setDescription("Cria um novo cargo.")
        .addStringOption((opt) =>
          opt.setName("nome").setDescription("Nome do cargo").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("cor")
            .setDescription("Cor em hexadecimal (ex: #FF0000)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("mencionavel")
            .setDescription("O cargo pode ser mencionado?")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("deletar")
        .setDescription("Remove um cargo existente.")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a remover").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("dar")
        .setDescription("Atribui um cargo a um membro.")
        .addUserOption((opt) =>
          opt.setName("membro").setDescription("Membro alvo").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a atribuir").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Remove um cargo de um membro.")
        .addUserOption((opt) =>
          opt.setName("membro").setDescription("Membro alvo").setRequired(true)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo a remover").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("listar")
        .setDescription("Lista os cargos do servidor.")
    ),

  async execute(interaction) {
    requirePermissions(interaction, MANAGE_ROLES);
    const guild = requireGuild(interaction);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "criar") {
      const name = interaction.options.getString("nome", true);
      const colorRaw = interaction.options.getString("cor");
      const mentionable = interaction.options.getBoolean("mencionavel") ?? false;

      const color = colorRaw?.startsWith("#") ? colorRaw : undefined;

      const role = await guild.roles.create({
        name,
        color: color as `#${string}` | undefined,
        mentionable,
        reason: `Cargo criado por ${interaction.user.tag}`,
      });

      await interaction.reply(`Cargo **${role.name}** criado com sucesso.`);
      return;
    }

    if (sub === "deletar") {
      const role = interaction.options.getRole("cargo", true);

      if (role.id === guild.id) {
        throw new Error("Não é possível deletar o cargo @everyone.");
      }

      const guildRole = guild.roles.cache.get(role.id);
      if (!guildRole) {
        throw new Error("Cargo não encontrado neste servidor.");
      }

      await guildRole.delete(`Cargo removido por ${interaction.user.tag}`);
      await interaction.reply(`Cargo **${role.name}** removido.`);
      return;
    }

    if (sub === "dar" || sub === "remover") {
      const targetUser = interaction.options.getUser("membro", true);
      const roleOption = interaction.options.getRole("cargo", true);
      const role = guild.roles.cache.get(roleOption.id);

      if (!role) {
        throw new Error("Cargo não encontrado neste servidor.");
      }

      const member = await guild.members.fetch(targetUser.id);

      if (sub === "dar") {
        await member.roles.add(role, `Cargo atribuído por ${interaction.user.tag}`);
        await interaction.reply(`Cargo **${role.name}** atribuído a **${member.user.tag}**.`);
      } else {
        await member.roles.remove(role, `Cargo removido por ${interaction.user.tag}`);
        await interaction.reply(`Cargo **${role.name}** removido de **${member.user.tag}**.`);
      }
      return;
    }

    if (sub === "listar") {
      const roles = guild.roles.cache
        .filter((r) => r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => r.toString())
        .slice(0, 25)
        .join("\n");

      await interaction.reply({
        content: roles || "Nenhum cargo encontrado.",
        ephemeral: true,
      });
    }
  },
};
