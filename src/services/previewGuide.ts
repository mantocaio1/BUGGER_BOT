import { EmbedBuilder } from "discord.js";
import {
  MODULE_SUGGESTIONS,
  PLACEHOLDERS,
  PreviewModule,
  formatColorSuggestions,
  formatPlaceholders,
} from "../config/suggestions";

export function buildSuggestionsEmbed(module: PreviewModule): EmbedBuilder {
  if (module === "todos") {
    return buildFullGuideEmbed();
  }

  const info = MODULE_SUGGESTIONS[module];
  const placeholders = [
    ...PLACEHOLDERS.common,
    ...(PLACEHOLDERS[module] ?? []),
  ];

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Guia — ${info.title}`)
    .setDescription(
      "Use os campos opcionais do `/preview` para testar **antes** de salvar com `/setup`.\n" +
        "Valores não informados usam a config salva do servidor (ou padrão)."
    )
    .addFields(
      {
        name: "Placeholders disponíveis",
        value: formatPlaceholders(placeholders).slice(0, 1024),
      },
      {
        name: "Cores sugeridas",
        value: formatColorSuggestions(),
      },
      {
        name: "Comando de configuração",
        value: `\`${info.setupExample}\``,
      },
      {
        name: "Preview rápido",
        value: `\`${info.previewCommand}\``,
      },
      {
        name: "Dicas",
        value: info.tips.map((t, i) => `${i + 1}. ${t}`).join("\n").slice(0, 1024),
      }
    )
    .setFooter({ text: "BUGGER_BOT · /preview guia modulo:todos para ver tudo" });
}

function buildFullGuideEmbed(): EmbedBuilder {
  const modules = Object.entries(MODULE_SUGGESTIONS)
    .map(([key, m]) => `**${m.title}**\n↳ \`${m.previewCommand}\``)
    .join("\n\n");

  const allPlaceholders = [
    ...PLACEHOLDERS.common,
    ...PLACEHOLDERS.welcome,
    ...PLACEHOLDERS.ticket_painel,
    ...PLACEHOLDERS.ticket_canal,
  ];

  const unique = allPlaceholders.filter(
    (p, i, arr) => arr.findIndex((x) => x.key === p.key) === i
  );

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Guia completo de personalização")
    .setDescription(
      "Comandos de preview (só você vê):\n\n" + modules
    )
    .addFields(
      {
        name: "Todos os placeholders",
        value: formatPlaceholders(unique).slice(0, 1024),
      },
      {
        name: "Paleta de cores",
        value: formatColorSuggestions(),
      },
      {
        name: "Fluxo recomendado",
        value: [
          "1. `/preview welcome` — teste visual",
          "2. Ajuste `cor`, `titulo`, `mensagem`, `imagem` no preview",
          "3. `/setup welcome ...` — salva quando gostar",
          "4. `/preview ticket-painel` e `/preview ticket-canal`",
          "5. `/ticket painel` — publica no canal",
          "",
          "`/setup ver` — config atual · `/setup reset` — voltar ao padrão",
        ].join("\n"),
      },
      {
        name: "Formatação Discord",
        value: [
          "`**negrito**` · `*itálico*` · `` `código` ``",
          "`> citação` · `[texto](url)` para links",
          "Quebra de linha: use `\\n` nos comandos setup",
        ].join("\n"),
      }
    );
}

export function buildSuggestionsEmbeds(module: PreviewModule): EmbedBuilder[] {
  if (module === "todos") {
    const main = buildFullGuideEmbed();
    const examples = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("Exemplos prontos para copiar")
      .addFields(
        {
          name: "Boas-vindas",
          value:
            "```\n/preview welcome cor:#57F287 titulo:Bem-vindo! mensagem:Olá {user}! Você é o #{count}.\n```",
        },
        {
          name: "Painel de tickets",
          value:
            "```\n/preview ticket-painel cor:#5865F2 titulo:Suporte mensagem:Clique abaixo! Equipe: {staff}\n```",
        },
        {
          name: "Canal do ticket",
          value:
            "```\n/preview ticket-canal cor:#FEE75C motivo:Preciso de ajuda com verificação\n```",
        },
        {
          name: "Logs",
          value: "```\n/preview logs cor:#ED4245\n```",
        }
      );
    return [main, examples];
  }

  return [buildSuggestionsEmbed(module)];
}
