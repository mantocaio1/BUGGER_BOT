export type PreviewModule =
  | "welcome"
  | "ticket_painel"
  | "ticket_canal"
  | "logs"
  | "todos";

export interface PlaceholderInfo {
  key: string;
  description: string;
  example: string;
}

export const PLACEHOLDERS: Record<PreviewModule | "common", PlaceholderInfo[]> = {
  common: [
    { key: "{server}", description: "Nome do servidor", example: "Meu Servidor" },
    { key: "{user}", description: "Menção do membro", example: "@João" },
    { key: "{username}", description: "Nome do membro (sem menção)", example: "Joao" },
    { key: "{avatar}", description: "URL do avatar (só em texto)", example: "https://cdn.discordapp.com/..." },
  ],
  welcome: [
    { key: "{count}", description: "Número de membros do servidor", example: "142" },
  ],
  ticket_painel: [
    { key: "{staff}", description: "Menção do cargo de suporte", example: "@Suporte" },
  ],
  ticket_canal: [
    { key: "{staff}", description: "Menção do cargo de suporte", example: "@Suporte" },
    { key: "{reason}", description: "Motivo informado ao abrir", example: "Problema com cargo" },
    {
      key: "{reason_block}",
      description: "Bloco formatado com motivo (ou vazio)",
      example: "**Motivo:** Problema com cargo",
    },
  ],
  logs: [],
  todos: [],
};

export const COLOR_SUGGESTIONS = [
  { hex: "#57F287", name: "Verde", use: "Boas-vindas, sucesso" },
  { hex: "#5865F2", name: "Blurple", use: "Painéis, tickets, info" },
  { hex: "#FEE75C", name: "Amarelo", use: "Avisos, destaque" },
  { hex: "#EB459E", name: "Rosa", use: "Eventos, comunidade" },
  { hex: "#ED4245", name: "Vermelho", use: "Logs, banimentos" },
  { hex: "#FAA61A", name: "Laranja", use: "Expulsões, alertas" },
  { hex: "#23272A", name: "Escuro", use: "Visual minimalista" },
  { hex: "#E91E63", name: "Magenta", use: "Boas-vindas chamativas" },
];

export const MODULE_SUGGESTIONS: Record<
  Exclude<PreviewModule, "todos">,
  {
    title: string;
    tips: string[];
    setupExample: string;
    previewCommand: string;
  }
> = {
  welcome: {
    title: "Boas-vindas",
    tips: [
      "Use embed colorido (`usar_embed:true`) para visual mais profissional.",
      "A imagem (`imagem`) aparece como banner grande; o avatar do membro vai no thumbnail.",
      "Mencione `{user}` no início para chamar atenção do novo membro.",
      "Combine com `/setup autorole` para dar cargo automaticamente.",
    ],
    setupExample:
      "/setup welcome canal:#bem-vindos titulo:Bem-vindo! cor:#57F287 imagem:URL mensagem:Olá {user}! Você é o #{count} em {server}.",
    previewCommand: "/preview welcome",
  },
  ticket_painel: {
    title: "Painel de tickets",
    tips: [
      "Publique com `/ticket painel` no canal de suporte após configurar.",
      "Use `imagem_painel` para banner com logo ou regras visuais.",
      "Mencione `{staff}` para a equipe saber que será notificada.",
      "Ative `motivo_obrigatorio:true` para filtrar tickets vazios.",
    ],
    setupExample:
      "/setup ticket categoria:Tickets suporte:@Staff cor_painel:#5865F2 titulo_painel:Central de atendimento motivo_obrigatorio:true",
    previewCommand: "/preview ticket-painel",
  },
  ticket_canal: {
    title: "Canal do ticket",
    tips: [
      "Use `{reason_block}` na mensagem — ele só aparece se houver motivo.",
      "Personalize `{reason}` para mostrar o texto do modal.",
      "Cor diferente do painel ajuda a distinguir abertura vs. atendimento.",
      "O botão **Fechar ticket** só aparece dentro do canal criado.",
    ],
    setupExample:
      "/setup ticket ... titulo_ticket:Seu ticket cor_ticket:#FEE75C mensagem_ticket:Olá {user}!\\n{reason_block}Aguarde {staff}.",
    previewCommand: "/preview ticket-canal motivo:Exemplo de motivo do ticket",
  },
  logs: {
    title: "Logs de moderação",
    tips: [
      "Configure um canal privado só para staff.",
      "Cor personalizada substitui a cor por ação (ban, kick, etc.).",
      "Sem cor definida: vermelho (ban), laranja (kick), azul (timeout).",
      "Logs são enviados automaticamente ao usar `/mod ban`, `/mod kick`, etc.",
    ],
    setupExample: "/setup logs canal:#mod-logs cor:#ED4245",
    previewCommand: "/preview logs",
  },
};

export function formatPlaceholders(modules: PlaceholderInfo[]): string {
  if (modules.length === 0) return "Nenhum placeholder específico.";
  return modules
    .map((p) => `\`{${p.key.replace(/[{}]/g, "")}}\` — ${p.description}\n↳ Ex: ${p.example}`)
    .join("\n\n");
}

export function formatColorSuggestions(): string {
  return COLOR_SUGGESTIONS.map((c) => `\`${c.hex}\` **${c.name}** — ${c.use}`).join("\n");
}
