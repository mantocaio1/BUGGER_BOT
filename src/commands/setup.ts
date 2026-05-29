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

      if (role.id === guild.id) {
        throw new Error("Não é possível usar @everyone como auto-role.");
      }

      setGuildConfig(guild.id, {
        autoRoleId: role.id,
        autoRoleEnabled: ativo,
      });

      await interaction.reply({
        content: `Auto-role ${ativo ? "ativado" : "desativado"}: ${role}`,
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
          `• Tickets: ${onOff(config.ticketEnabled)} · Motivo obrigatório: ${config.ticketReasonRequired ? "sim" : "não"}`,
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
