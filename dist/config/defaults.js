"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_ROLE_PANEL_BUTTONS = exports.DEFAULT_TICKET_TYPES = exports.PLACEHOLDER_HINT = exports.DEFAULT_TICKET_REASON_MIN_LENGTH = exports.DEFAULT_EVENT_DURATION_MS = exports.MAX_COLOR_PANEL_ROLES = exports.DEFAULT_COLOR_PANEL_TITLE = exports.DEFAULT_COLOR_PANEL_MESSAGE = exports.DEFAULT_ROLE_PANEL_COLOR = exports.DEFAULT_MOD_LOG_COLOR = exports.DEFAULT_TICKET_CHANNEL_COLOR = exports.DEFAULT_TICKET_PANEL_COLOR = exports.DEFAULT_GOODBYE_COLOR = exports.DEFAULT_WELCOME_COLOR = exports.DEFAULT_TICKET_REASON_BLOCK = exports.DEFAULT_TICKET_CHANNEL_TITLE = exports.DEFAULT_TICKET_CHANNEL_MESSAGE = exports.DEFAULT_TICKET_PANEL_TITLE = exports.DEFAULT_TICKET_PANEL_MESSAGE = exports.DEFAULT_GOODBYE_TITLE = exports.DEFAULT_GOODBYE_MESSAGE = exports.DEFAULT_WELCOME_TITLE = exports.DEFAULT_WELCOME_MESSAGE = void 0;
exports.DEFAULT_WELCOME_MESSAGE = "Olá {user}! Bem-vindo(a) ao **{server}**. Você é o membro **#{count}**.";
exports.DEFAULT_WELCOME_TITLE = "Novo membro!";
exports.DEFAULT_GOODBYE_MESSAGE = "**{username}** saiu de **{server}**. Agora temos **{count}** membros.";
exports.DEFAULT_GOODBYE_TITLE = "Até logo!";
exports.DEFAULT_TICKET_PANEL_MESSAGE = "Escolha o tipo de atendimento abaixo.\nA equipe {staff} responderá o mais rápido possível.";
exports.DEFAULT_TICKET_PANEL_TITLE = "Central de atendimento";
exports.DEFAULT_TICKET_CHANNEL_MESSAGE = "Olá {user}!\n\n**Tipo:** {type}\n{reason_block}A equipe {staff} foi notificada.\n\nUse **Fechar ticket** quando terminar.";
exports.DEFAULT_TICKET_CHANNEL_TITLE = "Ticket — {type}";
exports.DEFAULT_TICKET_REASON_BLOCK = "**Motivo:** {reason}\n\n";
exports.DEFAULT_WELCOME_COLOR = 0x57f287;
exports.DEFAULT_GOODBYE_COLOR = 0xed4245;
exports.DEFAULT_TICKET_PANEL_COLOR = 0x5865f2;
exports.DEFAULT_TICKET_CHANNEL_COLOR = 0x5865f2;
exports.DEFAULT_MOD_LOG_COLOR = 0xed4245;
exports.DEFAULT_ROLE_PANEL_COLOR = 0x5865f2;
exports.DEFAULT_COLOR_PANEL_MESSAGE = "Clique em uma cor para mudar **a cor do seu nome** no servidor.\nClique de novo na mesma cor para remover.";
exports.DEFAULT_COLOR_PANEL_TITLE = "Cores do nome";
exports.MAX_COLOR_PANEL_ROLES = 20;
exports.DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
exports.DEFAULT_TICKET_REASON_MIN_LENGTH = 10;
exports.PLACEHOLDER_HINT = "Placeholders: {user} {username} {server} {count} {staff} {reason} {type} {avatar}";
exports.DEFAULT_TICKET_TYPES = [
    { id: "suporte", label: "Suporte", emoji: "🎫", style: "Primary" },
    { id: "denuncia", label: "Denúncia", emoji: "🚨", style: "Danger" },
    { id: "parceria", label: "Parceria", emoji: "🤝", style: "Success" },
];
exports.MAX_ROLE_PANEL_BUTTONS = 5;
