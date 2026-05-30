import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { BotCommand, MANAGE_GUILD, requireGuild, requirePermissions } from "../client";
import {
  DEFAULT_TICKET_CHANNEL_MESSAGE,
  DEFAULT_TICKET_PANEL_MESSAGE,
  DEFAULT_WELCOME_MESSAGE,
  PLACEHOLDER_HINT,
} from "../config/defaults";
import { getGuildConfig, setGuildConfig } from "../config/store";
import { parseHexColor } from "../utils/color";
import { diagnoseAutoRole } from "../services/autoRole";
import { DEFAULT_GOODBYE_MESSAGE, MAX_ROLE_PANEL_BUTTONS } from "../config/defaults";
import { DEFAULT_COLOR_PANEL_MESSAGE } from "../config/defaults";

function validateColor(cor?: string | null) {
  if (!cor?.trim()) return undefined;
  if (parseHexColor(cor) === null) {
    throw new Error("Cor inválida. Use hexadecimal, ex: #5865F2");
  }
  return cor.trim().startsWith("#") ? cor.trim() : `#${cor.trim()}`;
}

function validateImageUrl(url?: string | null) {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error();
    }
    return url.trim();
  } catch {
    throw new Error("URL de imagem inválida. Use um link http(s) público.");
  }
}

export const setupCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configurações personalizáveis do BUGGER_BOT.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("logs")
        .setDescription("Canal e cor dos logs de moderação.")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de texto")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("cor")
            .setDescription("Cor do embed (ex: #ED4245)")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("welcome")
        .setDescription("Boas-vindas com embed personalizado.")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de boas-vindas")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("mensagem")
            .setDescription(`Texto do embed. ${PLACEHOLDER_HINT}`)
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("titulo").setDescription("Título do embed").setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("cor")
            .setDescription("Cor do embed (ex: #57F287)")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("imagem")
            .setDescription("URL da imagem grande do embed (banner)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("usar_embed")
            .setDescription("Usar embed colorido (padrão: sim)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("ativo")
            .setDescription("Ativar ou desativar (padrão: ativar)")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("autorole")
        .setDescription("Cargo automático ao entrar no servidor.")
        .addRoleOption((opt) =>
          opt.setName("cargo").setDescription("Cargo para novos membros").setRequired(true)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("ativo")
            .setDescription("Ativar ou desativar (padrão: ativar)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("testar")
            .setDescription("Testa o auto-role em você e mostra diagnóstico")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("goodbye")
        .setDescription("Mensagem de saída quando alguém leave.")
        .addChannelOption((opt) =>
          opt
            .setName("canal")
            .setDescription("Canal de despedidas")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("mensagem")
            .setDescription(`Texto. ${PLACEHOLDER_HINT}`)
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("titulo").setDescription("Título do embed").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("cor").setDescription("Cor hex (ex: #ED4245)").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("imagem").setDescription("URL do banner").setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName("usar_embed").setDescription("Usar embed (padrão: sim)").setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt.setName("ativo").setDescription("Ativar/desativar (padrão: ativar)").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("ticket-tipos")
        .setDescription("Tipos de ticket (Suporte, Denúncia, Parceria) + transcript.")
        .addBooleanOption((opt) =>
          opt
            .setName("ativo")
            .setDescription("Usar 3 botões de tipo no painel")
            .setRequired(true)
        )
        .addChannelOption((opt) =>
          opt
            .setName("transcript")
            .setDescription("Canal para transcripts (padrão: logs)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("transcript_ativo")
            .setDescription("Salvar transcript ao fechar (padrão: sim)")
            .setRequired(false)
        )
        .addChannelOption((opt) =>
          opt
            .setName("cat_suporte")
            .setDescription("Categoria só para Suporte")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addChannelOption((opt) =>
          opt
            .setName("cat_denuncia")
            .setDescription("Categoria só para Denúncia")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
        .addChannelOption((opt) =>
          opt
            .setName("cat_parceria")
            .setDescription("Categoria só para Parceria")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("cores")
        .setDescription("Painel de cores do nome (clique para trocar).")
        .addStringOption((opt) =>
          opt.setName("titulo").setDescription("Título do embed").setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("mensagem")
            .setDescription("Texto do painel")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("cor_embed").setDescription("Cor do embed (hex)").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo1").setDescription("Cargo de cor 1").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo2").setDescription("Cargo de cor 2").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo3").setDescription("Cargo de cor 3").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo4").setDescription("Cargo de cor 4").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo5").setDescription("Cargo de cor 5").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo6").setDescription("Cargo de cor 6").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("roles")
        .setDescription("Painel de cargos por botão (até 5).")
        .addRoleOption((opt) =>
          opt.setName("cargo1").setDescription("Cargo 1").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("rotulo1").setDescription("Texto do botão 1").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("emoji1").setDescription("Emoji do botão 1").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo2").setDescription("Cargo 2").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("rotulo2").setDescription("Texto do botão 2").setRequired(false)
        )
        .addRoleOption((opt) =>
          opt.setName("cargo3").setDescription("Cargo 3").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("rotulo3").setDescription("Texto do botão 3").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("titulo").setDescription("Título do embed").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("mensagem").setDescription("Descrição do painel").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("cor").setDescription("Cor hex").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("imagem").setDescription("URL do banner").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("ticket")
        .setDescription("Tickets com embeds e motivo obrigatório.")
        .addChannelOption((opt) =>
          opt
            .setName("categoria")
            .setDescription("Categoria dos tickets")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addRoleOption((opt) =>
          opt
            .setName("suporte")
            .setDescription("Cargo da equipe de suporte")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("mensagem_painel")
            .setDescription(`Texto do painel. ${PLACEHOLDER_HINT}`)
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("titulo_painel")
            .setDescription("Título do embed do painel")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("cor_painel")
            .setDescription("Cor do painel (ex: #5865F2)")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("imagem_painel")
            .setDescription("Banner do painel (URL)")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("mensagem_ticket")
            .setDescription(`Mensagem no canal. Use {reason} e {reason_block}`)
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("titulo_ticket")
            .setDescription("Título do embed dentro do ticket")
            .setRequired(false)
        )
        .addStringOption((opt) =>
          opt
            .setName("cor_ticket")
            .setDescription("Cor do embed do ticket (ex: #FEE75C)")
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("motivo_obrigatorio")
            .setDescription("Exigir motivo ao abrir ticket")
            .setRequired(false)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("minimo_motivo")
            .setDescription("Mínimo de caracteres do motivo (padrão: 10)")
            .setMinValue(5)
            .setMaxValue(500)
            .setRequired(false)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("ativo")
            .setDescription("Ativar ou desativar (padrão: ativar)")
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("ver").setDescription("Mostra todas as configurações atuais.")
    )
    .addSubcommand((sub) =>
      sub
        .setName("reset")
        .setDescription("Restaura textos ou estilos padrão.")
        .addStringOption((opt) =>
          opt
            .setName("modulo")
            .setDescription("O que resetar")
            .setRequired(true)
            .addChoices(
              { name: "Boas-vindas (texto)", value: "welcome" },
              { name: "Boas-vindas (estilo)", value: "welcome_style" },
              { name: "Despedida (texto)", value: "goodbye" },
              { name: "Despedida (estilo)", value: "goodbye_style" },
              { name: "Ticket painel (texto)", value: "ticket_panel" },
              { name: "Ticket painel (estilo)", value: "ticket_panel_style" },
              { name: "Ticket canal (texto)", value: "ticket_channel" },
              { name: "Ticket canal (estilo)", value: "ticket_channel_style" },
              { name: "Logs (cor)", value: "logs_color" }
            )
        )
    ),

  async execute(interaction) {
    requirePermissions(interaction, MANAGE_GUILD);
    const guild = requireGuild(interaction);
    const sub = interaction.options.getSubcommand(true);

    if (sub === "logs") {
      const channel = interaction.options.getChannel("canal", true);
      const cor = validateColor(interaction.options.getString("cor"));

      setGuildConfig(guild.id, {
        modLogChannelId: channel.id,
        ...(cor ? { modLogColor: cor } : {}),
      });

      await interaction.reply({
        content: `Canal de logs: ${channel}${cor ? ` · Cor: ${cor}` : ""}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "welcome") {
      const channel = interaction.options.getChannel("canal", true);
      const message = interaction.options.getString("mensagem");
      const titulo = interaction.options.getString("titulo");
      const cor = validateColor(interaction.options.getString("cor"));
      const imagem = validateImageUrl(interaction.options.getString("imagem"));
      const usarEmbed = interaction.options.getBoolean("usar_embed");
      const ativo = interaction.options.getBoolean("ativo") ?? true;

      setGuildConfig(guild.id, {
        welcomeChannelId: channel.id,
        welcomeMessage: message ?? undefined,
        welcomeTitle: titulo ?? undefined,
        welcomeEmbedColor: cor,
        welcomeImageUrl: imagem,
        welcomeUseEmbed: usarEmbed ?? undefined,
        welcomeEnabled: ativo,
      });

      await interaction.reply({
        content: [
          `Boas-vindas ${ativo ? "ativadas" : "desativadas"} em ${channel}.`,
          cor ? `Cor: ${cor}` : null,
          imagem ? "Imagem de banner configurada." : null,
          `\n_${PLACEHOLDER_HINT}_`,
        ]
          .filter(Boolean)
          .join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "autorole") {
      const role = interaction.options.getRole("cargo", true);
      const ativo = interaction.options.getBoolean("ativo") ?? true;
      const testar = interaction.options.getBoolean("testar") ?? false;

      if (role.id === guild.id) {
        throw new Error("Não é possível usar @everyone como auto-role.");
      }

      setGuildConfig(guild.id, {
        autoRoleId: role.id,
        autoRoleEnabled: ativo,
      });

      let extra = "";
      if (testar) {
        const member = await guild.members.fetch(interaction.user.id);
        extra = `\n\n**Diagnóstico:**\n${await diagnoseAutoRole(member)}`;
      }

      await interaction.reply({
        content: `Auto-role ${ativo ? "ativado" : "desativado"}: ${role}${extra}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "goodbye") {
      const channel = interaction.options.getChannel("canal", true);
      const message = interaction.options.getString("mensagem");
      const titulo = interaction.options.getString("titulo");
      const cor = validateColor(interaction.options.getString("cor"));
      const imagem = validateImageUrl(interaction.options.getString("imagem"));
      const usarEmbed = interaction.options.getBoolean("usar_embed");
      const ativo = interaction.options.getBoolean("ativo") ?? true;

      setGuildConfig(guild.id, {
        goodbyeChannelId: channel.id,
        goodbyeMessage: message ?? undefined,
        goodbyeTitle: titulo ?? undefined,
        goodbyeEmbedColor: cor,
        goodbyeImageUrl: imagem,
        goodbyeUseEmbed: usarEmbed ?? undefined,
        goodbyeEnabled: ativo,
      });

      await interaction.reply({
        content: [
          `Despedidas ${ativo ? "ativadas" : "desativadas"} em ${channel}.`,
          message ? "Mensagem personalizada salva." : `Padrão: ${DEFAULT_GOODBYE_MESSAGE}`,
          `\n_/preview goodbye para visualizar_`,
        ].join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "ticket-tipos") {
      const ativo = interaction.options.getBoolean("ativo", true);
      const transcript = interaction.options.getChannel("transcript");
      const transcriptAtivo = interaction.options.getBoolean("transcript_ativo");
      const catSuporte = interaction.options.getChannel("cat_suporte");
      const catDenuncia = interaction.options.getChannel("cat_denuncia");
      const catParceria = interaction.options.getChannel("cat_parceria");

      const categories: Record<string, string> = {
        ...getGuildConfig(guild.id).ticketTypeCategories,
      };
      if (catSuporte) categories.suporte = catSuporte.id;
      if (catDenuncia) categories.denuncia = catDenuncia.id;
      if (catParceria) categories.parceria = catParceria.id;

      setGuildConfig(guild.id, {
        ticketTypesEnabled: ativo,
        ticketTranscriptChannelId: transcript?.id,
        ticketTranscriptEnabled: transcriptAtivo ?? undefined,
        ticketTypeCategories: Object.keys(categories).length ? categories : undefined,
      });

      await interaction.reply({
        content: [
          `Tipos de ticket: ${ativo ? "✅ Suporte · Denúncia · Parceria" : "❌ botão único"}`,
          transcript ? `Transcript em ${transcript}` : "Transcript: canal de logs",
          "Republice o painel com `/ticket painel`.",
        ].join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "cores") {
      const titulo = interaction.options.getString("titulo");
      const mensagem = interaction.options.getString("mensagem");
      const corEmbed = validateColor(interaction.options.getString("cor_embed"));

      const roleIds: string[] = [];
      for (let i = 1; i <= 6; i++) {
        const role = interaction.options.getRole(`cargo${i}` as "cargo1");
        if (role && role.id !== guild.id) roleIds.push(role.id);
      }

      const existing = getGuildConfig(guild.id).colorPanel;
      const mergedRoleIds =
        roleIds.length > 0 ? roleIds : (existing?.roleIds ?? []);

      if (mergedRoleIds.length === 0) {
        throw new Error(
          "Informe pelo menos um cargo (cargo1…) ou use `/cores criar` antes."
        );
      }

      setGuildConfig(guild.id, {
        colorPanel: {
          title: titulo ?? existing?.title,
          message: mensagem ?? existing?.message,
          embedColor: corEmbed ?? existing?.embedColor,
          roleIds: mergedRoleIds,
        },
      });

      await interaction.reply({
        content: [
          `Painel de cores configurado (${mergedRoleIds.length} cor(es)).`,
          mensagem ? "Mensagem personalizada salva." : `Padrão: ${DEFAULT_COLOR_PANEL_MESSAGE}`,
          "Use `/cores painel` no canal desejado.",
        ].join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "roles") {
      const titulo = interaction.options.getString("titulo");
      const mensagem = interaction.options.getString("mensagem");
      const cor = validateColor(interaction.options.getString("cor"));
      const imagem = validateImageUrl(interaction.options.getString("imagem"));

      const buttons: import("../config/store").RoleButtonEntry[] = [];

      for (let i = 1; i <= MAX_ROLE_PANEL_BUTTONS; i++) {
        const role = interaction.options.getRole(`cargo${i}` as "cargo1");
        const label = interaction.options.getString(`rotulo${i}` as "rotulo1");
        const emoji = interaction.options.getString(`emoji${i}` as "emoji1");

        if (role && label) {
          buttons.push({
            roleId: role.id,
            label,
            emoji: emoji ?? undefined,
          });
        }
      }

      if (buttons.length === 0) {
        throw new Error("Informe pelo menos cargo1 e rotulo1.");
      }

      setGuildConfig(guild.id, {
        rolePanel: {
          title: titulo ?? undefined,
          message: mensagem ?? undefined,
          color: cor,
          imageUrl: imagem,
          buttons,
        },
      });

      await interaction.reply({
        content: [
          `Painel de cargos configurado (${buttons.length} botão(ões)).`,
          "Use `/roles painel` no canal desejado.",
        ].join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "ticket") {
      const category = interaction.options.getChannel("categoria", true);
      const supportRole = interaction.options.getRole("suporte", true);
      const panelMessage = interaction.options.getString("mensagem_painel");
      const panelTitle = interaction.options.getString("titulo_painel");
      const panelColor = validateColor(interaction.options.getString("cor_painel"));
      const panelImage = validateImageUrl(interaction.options.getString("imagem_painel"));
      const channelMessage = interaction.options.getString("mensagem_ticket");
      const channelTitle = interaction.options.getString("titulo_ticket");
      const channelColor = validateColor(interaction.options.getString("cor_ticket"));
      const reasonRequired = interaction.options.getBoolean("motivo_obrigatorio");
      const minReason = interaction.options.getInteger("minimo_motivo");
      const ativo = interaction.options.getBoolean("ativo") ?? true;

      setGuildConfig(guild.id, {
        ticketCategoryId: category.id,
        ticketSupportRoleId: supportRole.id,
        ticketPanelMessage: panelMessage ?? undefined,
        ticketPanelTitle: panelTitle ?? undefined,
        ticketPanelColor: panelColor,
        ticketPanelImageUrl: panelImage,
        ticketChannelMessage: channelMessage ?? undefined,
        ticketChannelTitle: channelTitle ?? undefined,
        ticketChannelColor: channelColor,
        ticketReasonRequired: reasonRequired ?? undefined,
        ticketReasonMinLength: minReason ?? undefined,
        ticketEnabled: ativo,
      });

      await interaction.reply({
        content: [
          `Tickets ${ativo ? "ativados" : "desativados"}.`,
          `• Categoria: ${category} · Suporte: ${supportRole}`,
          reasonRequired ? "• Motivo obrigatório ao abrir" : null,
          minReason ? `• Mínimo do motivo: ${minReason} caracteres` : null,
          `Use \`/ticket painel\` para publicar o painel.`,
          `\n_${PLACEHOLDER_HINT}_`,
        ]
          .filter(Boolean)
          .join("\n"),
        ephemeral: true,
      });
      return;
    }

    if (sub === "reset") {
      const modulo = interaction.options.getString("modulo", true);

      const patches: Record<string, Partial<import("../config/store").GuildConfig>> = {
        welcome: { welcomeMessage: undefined },
        welcome_style: {
          welcomeTitle: undefined,
          welcomeEmbedColor: undefined,
          welcomeImageUrl: undefined,
          welcomeUseEmbed: undefined,
        },
        goodbye: { goodbyeMessage: undefined },
        goodbye_style: {
          goodbyeTitle: undefined,
          goodbyeEmbedColor: undefined,
          goodbyeImageUrl: undefined,
          goodbyeUseEmbed: undefined,
        },
        ticket_panel: { ticketPanelMessage: undefined, ticketPanelTitle: undefined },
        ticket_panel_style: {
          ticketPanelColor: undefined,
          ticketPanelImageUrl: undefined,
        },
        ticket_channel: {
          ticketChannelMessage: undefined,
          ticketChannelTitle: undefined,
        },
        ticket_channel_style: { ticketChannelColor: undefined },
        logs_color: { modLogColor: undefined },
      };

      setGuildConfig(guild.id, patches[modulo] ?? {});
      await interaction.reply({
        content: `Módulo **${modulo}** resetado para o padrão.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "ver") {
      const config = getGuildConfig(guild.id);

      const fmt = (id?: string) =>
        id
          ? guild.channels.cache.get(id)?.toString() ?? `\`${id}\``
          : "—";

      const fmtRole = (id?: string) =>
        id ? guild.roles.cache.get(id)?.toString() ?? `\`${id}\`` : "—";

      const onOff = (v?: boolean) => (v ? "✅ Ativo" : "❌ Inativo");

      await interaction.reply({
        content: [
          "**Configurações do BUGGER_BOT**",
          "",
          `• Logs: ${fmt(config.modLogChannelId)} · Cor: ${config.modLogColor ?? "padrão por ação"}`,
          `• Boas-vindas: ${onOff(config.welcomeEnabled)} · ${fmt(config.welcomeChannelId)}`,
          `  └ Cor: ${config.welcomeEmbedColor ?? "#57F287"} · Embed: ${config.welcomeUseEmbed !== false ? "sim" : "não"}`,
          `  └ Imagem: ${config.welcomeImageUrl ? "configurada" : "—"}`,
          `• Auto-role: ${onOff(config.autoRoleEnabled)} · ${fmtRole(config.autoRoleId)}`,
          `• Despedidas: ${onOff(config.goodbyeEnabled)} · ${fmt(config.goodbyeChannelId)}`,
          `• Tickets: ${onOff(config.ticketEnabled)} · Tipos: ${config.ticketTypesEnabled ? "3 botões" : "1 botão"}`,
          `  └ Motivo obrigatório: ${config.ticketReasonRequired ? "sim" : "não"}`,
          `  └ Transcript: ${config.ticketTranscriptEnabled === false ? "off" : fmt(config.ticketTranscriptChannelId ?? config.modLogChannelId)}`,
          `• Role panel: ${config.rolePanel?.buttons.length ?? 0} botão(ões)`,
          `• Cores do nome: ${config.colorPanel?.roleIds.length ?? 0} cor(es)`,
          `  └ Painel: ${config.ticketPanelColor ?? "#5865F2"} · Imagem: ${config.ticketPanelImageUrl ? "sim" : "—"}`,
          `  └ Ticket: ${config.ticketChannelColor ?? "#5865F2"}`,
          `  └ Abertos: ${Object.keys(config.openTickets ?? {}).length}`,
          "",
          `_${PLACEHOLDER_HINT}_`,
        ].join("\n"),
        ephemeral: true,
      });
    }
  },
};
