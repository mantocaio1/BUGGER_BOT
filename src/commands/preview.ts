import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { BotCommand, MANAGE_GUILD, requireGuild, requirePermissions } from "../client";
import { buildSuggestionsEmbeds } from "../services/previewGuide";
import {
  buildModLogPreviewEmbed,
  buildTicketChannelPreviewEmbed,
  buildTicketPanelPreviewEmbed,
  buildWelcomePreviewEmbed,
  logsOverridesToConfig,
  mergePreviewConfig,
  readPreviewOverrides,
  resolveStaffMention,
  ticketChannelOverridesToConfig,
  ticketPanelOverridesToConfig,
  welcomeOverridesToConfig,
} from "../services/preview";
import { buildTicketCloseRow, buildTicketPanelRow } from "../services/tickets";

function addEmbedPreviewOptions(sub: SlashCommandSubcommandBuilder, withImage = true) {
  sub
    .addStringOption((opt) =>
      opt
        .setName("mensagem")
        .setDescription("Texto para testar (substitui config salva)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("titulo").setDescription("Título do embed").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("cor").setDescription("Cor hex (ex: #5865F2)").setRequired(false)
    );

  if (withImage) {
    sub.addStringOption((opt) =>
      opt
        .setName("imagem")
        .setDescription("URL do banner para testar")
        .setRequired(false)
    );
  }

  return sub;
}

export const previewCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("preview")
    .setDescription("Visualiza embeds e mostra sugestões antes de configurar.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      addEmbedPreviewOptions(
        sub.setName("welcome").setDescription("Preview das boas-vindas.")
      )
    )
    .addSubcommand((sub) =>
      addEmbedPreviewOptions(
        sub.setName("ticket-painel").setDescription("Preview do painel de tickets.")
      )
    )
    .addSubcommand((sub) => {
      addEmbedPreviewOptions(
        sub.setName("ticket-canal").setDescription("Preview do embed dentro do ticket."),
        false
      );
      sub.addStringOption((opt) =>
        opt
          .setName("motivo")
          .setDescription("Motivo de exemplo para o preview")
          .setRequired(false)
      );
      return sub;
    })
    .addSubcommand((sub) =>
      sub
        .setName("logs")
        .setDescription("Preview dos logs de moderação.")
        .addStringOption((opt) =>
          opt.setName("cor").setDescription("Cor hex (ex: #ED4245)").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("guia")
        .setDescription("Guia completo com placeholders, cores e exemplos.")
        .addStringOption((opt) =>
          opt
            .setName("modulo")
            .setDescription("Módulo específico ou tudo")
            .setRequired(false)
            .addChoices(
              { name: "Tudo", value: "todos" },
              { name: "Boas-vindas", value: "welcome" },
              { name: "Painel de tickets", value: "ticket_painel" },
              { name: "Canal do ticket", value: "ticket_canal" },
              { name: "Logs", value: "logs" }
            )
        )
    ),

  async execute(interaction) {
    requirePermissions(interaction, MANAGE_GUILD);
    const guild = requireGuild(interaction);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "guia") {
      const modulo = (interaction.options.getString("modulo") ?? "todos") as
        | "todos"
        | "welcome"
        | "ticket_painel"
        | "ticket_canal"
        | "logs";

      await interaction.reply({
        embeds: buildSuggestionsEmbeds(modulo),
        ephemeral: true,
      });
      return;
    }

    const overrides = readPreviewOverrides({
      mensagem: interaction.options.getString("mensagem"),
      titulo: interaction.options.getString("titulo"),
      cor: interaction.options.getString("cor"),
      imagem: interaction.options.getString("imagem"),
      motivo: interaction.options.getString("motivo"),
    });

    let previewModule: "welcome" | "ticket_painel" | "ticket_canal" | "logs";
    let previewEmbed;
    let components;

    if (sub === "welcome") {
      previewModule = "welcome";
      const config = mergePreviewConfig(
        guild.id,
        welcomeOverridesToConfig(overrides)
      );
      previewEmbed = buildWelcomePreviewEmbed(guild, interaction.user, config);
    } else if (sub === "ticket-painel") {
      previewModule = "ticket_painel";
      const config = mergePreviewConfig(
        guild.id,
        ticketPanelOverridesToConfig(overrides)
      );
      const staff = resolveStaffMention(guild, config);
      previewEmbed = buildTicketPanelPreviewEmbed(guild, config, staff);
      components = [buildTicketPanelRow()];
    } else if (sub === "ticket-canal") {
      previewModule = "ticket_canal";
      const config = mergePreviewConfig(
        guild.id,
        ticketChannelOverridesToConfig(overrides)
      );
      const staff = resolveStaffMention(guild, config);
      previewEmbed = buildTicketChannelPreviewEmbed(
        guild,
        interaction.user,
        config,
        staff,
        overrides.motivo ?? undefined
      );
      components = [buildTicketCloseRow()];
    } else {
      previewModule = "logs";
      const config = mergePreviewConfig(
        guild.id,
        logsOverridesToConfig(overrides)
      );
      previewEmbed = buildModLogPreviewEmbed(config, interaction.user);
    }

    const guideEmbeds = buildSuggestionsEmbeds(previewModule);

    await interaction.reply({
      content: "**Preview** — assim ficará no servidor (dados de exemplo):",
      embeds: [previewEmbed, ...guideEmbeds],
      components,
      ephemeral: true,
    });
  },
};
