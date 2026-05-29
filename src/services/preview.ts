import { EmbedBuilder, Guild, User } from "discord.js";
import {
  DEFAULT_TICKET_CHANNEL_COLOR,
  DEFAULT_TICKET_CHANNEL_MESSAGE,
  DEFAULT_TICKET_CHANNEL_TITLE,
  DEFAULT_TICKET_PANEL_COLOR,
  DEFAULT_TICKET_PANEL_MESSAGE,
  DEFAULT_TICKET_PANEL_TITLE,
  DEFAULT_TICKET_REASON_BLOCK,
  DEFAULT_WELCOME_COLOR,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_WELCOME_TITLE,
} from "../config/defaults";
import { GuildConfig, getGuildConfig } from "../config/store";
import { parseHexColor } from "../utils/color";

export interface PreviewOverrides {
  mensagem?: string | null;
  titulo?: string | null;
  cor?: string | null;
  imagem?: string | null;
  motivo?: string | null;
}

export function mergePreviewConfig(
  guildId: string,
  patch: Partial<GuildConfig>
): GuildConfig {
  return { ...getGuildConfig(guildId), ...patch };
}

function applyPreviewStrings(
  template: string,
  variables: Record<string, string>
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => variables[key] ?? `{${key}}`);
}

function buildWelcomeVars(guild: Guild, user: User) {
  return {
    user: user.toString(),
    username: user.username,
    server: guild.name,
    count: String(guild.memberCount),
    avatar: user.displayAvatarURL({ size: 512 }),
  };
}

function buildTicketVars(
  guild: Guild,
  user: User,
  staffMention: string,
  reason?: string
) {
  const sampleReason = reason ?? "Exemplo de motivo do ticket";
  const reasonBlock = DEFAULT_TICKET_REASON_BLOCK.replace("{reason}", sampleReason);

  return {
    user: user.toString(),
    username: user.username,
    server: guild.name,
    count: String(guild.memberCount),
    staff: staffMention,
    reason: sampleReason,
    reason_block: reasonBlock,
    avatar: user.displayAvatarURL({ size: 256 }),
  };
}

export function buildWelcomePreviewEmbed(
  guild: Guild,
  user: User,
  config: GuildConfig
) {
  const variables = buildWelcomeVars(guild, user);
  const message = applyPreviewStrings(
    config.welcomeMessage?.trim() || DEFAULT_WELCOME_MESSAGE,
    variables
  );
  const title = config.welcomeTitle?.trim()
    ? applyPreviewStrings(config.welcomeTitle, variables)
    : DEFAULT_WELCOME_TITLE;

  const color = parseHexColor(config.welcomeEmbedColor) ?? DEFAULT_WELCOME_COLOR;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message)
    .setThumbnail(user.displayAvatarURL({ size: 256 }));

  if (config.welcomeImageUrl?.trim()) {
    embed.setImage(config.welcomeImageUrl.trim());
  }

  embed.setFooter({ text: "Preview — BUGGER_BOT" });
  return embed;
}

export function buildTicketPanelPreviewEmbed(
  guild: Guild,
  config: GuildConfig,
  staffMention: string
) {
  const variables = buildTicketVars(guild, guild.client.user!, staffMention);
  const message = applyPreviewStrings(
    config.ticketPanelMessage?.trim() || DEFAULT_TICKET_PANEL_MESSAGE,
    variables
  );
  const title = config.ticketPanelTitle?.trim()
    ? applyPreviewStrings(config.ticketPanelTitle, variables)
    : DEFAULT_TICKET_PANEL_TITLE;

  const color = parseHexColor(config.ticketPanelColor) ?? DEFAULT_TICKET_PANEL_COLOR;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message);

  if (config.ticketPanelImageUrl?.trim()) {
    embed.setImage(config.ticketPanelImageUrl.trim());
  }

  embed.setFooter({ text: "Preview — painel de tickets" });
  return embed;
}

export function buildTicketChannelPreviewEmbed(
  guild: Guild,
  user: User,
  config: GuildConfig,
  staffMention: string,
  reason?: string
) {
  const variables = buildTicketVars(guild, user, staffMention, reason);
  const message = applyPreviewStrings(
    config.ticketChannelMessage?.trim() || DEFAULT_TICKET_CHANNEL_MESSAGE,
    variables
  );
  const title = config.ticketChannelTitle?.trim()
    ? applyPreviewStrings(config.ticketChannelTitle, variables)
    : DEFAULT_TICKET_CHANNEL_TITLE;

  const color = parseHexColor(config.ticketChannelColor) ?? DEFAULT_TICKET_CHANNEL_COLOR;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: "Preview — canal do ticket" });
}

export function buildModLogPreviewEmbed(config: GuildConfig, moderator: User) {
  const color = parseHexColor(config.modLogColor) ?? 0xed4245;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle("Banimento")
    .addFields(
      { name: "Membro", value: "`UsuarioExemplo#0000` (`123456789`)", inline: true },
      { name: "Moderador", value: `${moderator.tag} (\`${moderator.id}\`)`, inline: true },
      { name: "Motivo", value: "Exemplo de motivo para preview" },
      { name: "Detalhes", value: "Mensagens apagadas: últimos 1 dia(s)" }
    )
    .setTimestamp()
    .setFooter({ text: "Preview — logs de moderação" });
}

export function welcomeOverridesToConfig(overrides: PreviewOverrides): Partial<GuildConfig> {
  const patch: Partial<GuildConfig> = {};
  if (overrides.mensagem != null) patch.welcomeMessage = overrides.mensagem || undefined;
  if (overrides.titulo != null) patch.welcomeTitle = overrides.titulo || undefined;
  if (overrides.cor != null) patch.welcomeEmbedColor = overrides.cor || undefined;
  if (overrides.imagem != null) patch.welcomeImageUrl = overrides.imagem || undefined;
  return patch;
}

export function ticketPanelOverridesToConfig(overrides: PreviewOverrides): Partial<GuildConfig> {
  const patch: Partial<GuildConfig> = {};
  if (overrides.mensagem != null) patch.ticketPanelMessage = overrides.mensagem || undefined;
  if (overrides.titulo != null) patch.ticketPanelTitle = overrides.titulo || undefined;
  if (overrides.cor != null) patch.ticketPanelColor = overrides.cor || undefined;
  if (overrides.imagem != null) patch.ticketPanelImageUrl = overrides.imagem || undefined;
  return patch;
}

export function ticketChannelOverridesToConfig(overrides: PreviewOverrides): Partial<GuildConfig> {
  const patch: Partial<GuildConfig> = {};
  if (overrides.mensagem != null) patch.ticketChannelMessage = overrides.mensagem || undefined;
  if (overrides.titulo != null) patch.ticketChannelTitle = overrides.titulo || undefined;
  if (overrides.cor != null) patch.ticketChannelColor = overrides.cor || undefined;
  return patch;
}

export function logsOverridesToConfig(overrides: PreviewOverrides): Partial<GuildConfig> {
  const patch: Partial<GuildConfig> = {};
  if (overrides.cor != null) patch.modLogColor = overrides.cor || undefined;
  return patch;
}

export function resolveStaffMention(guild: Guild, config: GuildConfig) {
  if (config.ticketSupportRoleId) {
    const role = guild.roles.cache.get(config.ticketSupportRoleId);
    if (role) return `<@&${role.id}>`;
  }
  return "@Suporte";
}

export function validatePreviewColor(cor?: string | null) {
  if (!cor?.trim()) return undefined;
  if (parseHexColor(cor) === null) {
    throw new Error("Cor inválida. Use hexadecimal, ex: #5865F2");
  }
  return cor.trim().startsWith("#") ? cor.trim() : `#${cor.trim()}`;
}

export function validatePreviewImage(url?: string | null) {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    return url.trim();
  } catch {
    throw new Error("URL de imagem inválida.");
  }
}

export function readPreviewOverrides(options: {
  mensagem?: string | null;
  titulo?: string | null;
  cor?: string | null;
  imagem?: string | null;
  motivo?: string | null;
}): PreviewOverrides {
  return {
    mensagem: options.mensagem,
    titulo: options.titulo,
    cor: options.cor ? validatePreviewColor(options.cor) : undefined,
    imagem: options.imagem ? validatePreviewImage(options.imagem) : undefined,
    motivo: options.motivo,
  };
}
