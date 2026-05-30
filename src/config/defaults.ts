export const DEFAULT_WELCOME_MESSAGE =
  "Olá {user}! Bem-vindo(a) ao **{server}**. Você é o membro **#{count}**.";

export const DEFAULT_WELCOME_TITLE = "Novo membro!";

export const DEFAULT_GOODBYE_MESSAGE =
  "**{username}** saiu de **{server}**. Agora temos **{count}** membros.";

export const DEFAULT_GOODBYE_TITLE = "Até logo!";

export const DEFAULT_TICKET_PANEL_MESSAGE =
  "Escolha o tipo de atendimento abaixo.\nA equipe {staff} responderá o mais rápido possível.";

export const DEFAULT_TICKET_PANEL_TITLE = "Central de atendimento";

export const DEFAULT_TICKET_CHANNEL_MESSAGE =
  "Olá {user}!\n\n**Tipo:** {type}\n{reason_block}A equipe {staff} foi notificada.\n\nUse **Fechar ticket** quando terminar.";

export const DEFAULT_TICKET_CHANNEL_TITLE = "Ticket — {type}";

export const DEFAULT_TICKET_REASON_BLOCK = "**Motivo:** {reason}\n\n";

export const DEFAULT_WELCOME_COLOR = 0x57f287;
export const DEFAULT_GOODBYE_COLOR = 0xed4245;
export const DEFAULT_TICKET_PANEL_COLOR = 0x5865f2;
export const DEFAULT_TICKET_CHANNEL_COLOR = 0x5865f2;
export const DEFAULT_MOD_LOG_COLOR = 0xed4245;
export const DEFAULT_ROLE_PANEL_COLOR = 0x5865f2;

export const DEFAULT_COLOR_PANEL_MESSAGE =
  "Clique em uma cor para mudar **a cor do seu nome** no servidor.\nClique de novo na mesma cor para remover.";

export const DEFAULT_COLOR_PANEL_TITLE = "Cores do nome";

export const MAX_COLOR_PANEL_ROLES = 20;

export const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
export const DEFAULT_TICKET_REASON_MIN_LENGTH = 10;

export const PLACEHOLDER_HINT =
  "Placeholders: {user} {username} {server} {count} {staff} {reason} {type} {avatar}";

export type TicketButtonStyle = "Primary" | "Secondary" | "Success" | "Danger";

export interface TicketTypeDefinition {
  id: string;
  label: string;
  emoji: string;
  style: TicketButtonStyle;
}

export const DEFAULT_TICKET_TYPES: TicketTypeDefinition[] = [
  { id: "suporte", label: "Suporte", emoji: "🎫", style: "Primary" },
  { id: "denuncia", label: "Denúncia", emoji: "🚨", style: "Danger" },
  { id: "parceria", label: "Parceria", emoji: "🤝", style: "Success" },
];

export const MAX_ROLE_PANEL_BUTTONS = 5;
