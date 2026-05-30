import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_GOODBYE_MESSAGE,
  DEFAULT_TICKET_CHANNEL_MESSAGE,
  DEFAULT_TICKET_CHANNEL_TITLE,
  DEFAULT_TICKET_PANEL_MESSAGE,
  DEFAULT_TICKET_TYPES,
  DEFAULT_WELCOME_MESSAGE,
  TicketTypeDefinition,
} from "./defaults";

export interface TicketRecord {
  userId: string;
  reason?: string;
  typeId?: string;
  typeLabel?: string;
  openedAt?: number;
}

export interface TicketTypeOverride {
  categoryId?: string;
  channelTitle?: string;
  channelMessage?: string;
  channelColor?: string;
}

export interface RoleButtonEntry {
  roleId: string;
  label: string;
  emoji?: string;
}

export interface RolePanelConfig {
  title?: string;
  message?: string;
  color?: string;
  imageUrl?: string;
  buttons: RoleButtonEntry[];
}

export interface ColorPanelConfig {
  title?: string;
  message?: string;
  embedColor?: string;
  /** IDs dos cargos de cor, em ordem dos botões */
  roleIds: string[];
}

export interface GuildConfig {
  modLogChannelId?: string;
  modLogColor?: string;

  welcomeEnabled?: boolean;
  welcomeChannelId?: string;
  welcomeMessage?: string;
  welcomeTitle?: string;
  welcomeEmbedColor?: string;
  welcomeImageUrl?: string;
  welcomeUseEmbed?: boolean;

  goodbyeEnabled?: boolean;
  goodbyeChannelId?: string;
  goodbyeMessage?: string;
  goodbyeTitle?: string;
  goodbyeEmbedColor?: string;
  goodbyeImageUrl?: string;
  goodbyeUseEmbed?: boolean;

  autoRoleEnabled?: boolean;
  autoRoleId?: string;

  ticketEnabled?: boolean;
  ticketCategoryId?: string;
  ticketSupportRoleId?: string;
  ticketPanelMessage?: string;
  ticketPanelTitle?: string;
  ticketPanelColor?: string;
  ticketPanelImageUrl?: string;
  ticketChannelMessage?: string;
  ticketChannelTitle?: string;
  ticketChannelColor?: string;
  ticketReasonRequired?: boolean;
  ticketReasonMinLength?: number;
  ticketTypesEnabled?: boolean;
  /** categoryId por typeId (suporte, denuncia, parceria) */
  ticketTypeCategories?: Record<string, string>;
  ticketTypeOverrides?: Record<string, TicketTypeOverride>;
  ticketTranscriptEnabled?: boolean;
  ticketTranscriptChannelId?: string;
  openTickets?: Record<string, string | TicketRecord>;

  rolePanel?: RolePanelConfig;
  colorPanel?: ColorPanelConfig;
}

type ConfigFile = Record<string, GuildConfig>;

const DATA_DIR = join(process.cwd(), "data");
const CONFIG_PATH = join(DATA_DIR, "guilds.json");

function ensureStore() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, "{}", "utf-8");
  }
}

function readAll(): ConfigFile {
  ensureStore();
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as ConfigFile;
}

function writeAll(data: ConfigFile) {
  ensureStore();
  writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getGuildConfig(guildId: string): GuildConfig {
  const all = readAll();
  return all[guildId] ?? {};
}

export function setGuildConfig(guildId: string, patch: Partial<GuildConfig>) {
  const all = readAll();
  all[guildId] = { ...getGuildConfig(guildId), ...patch };
  writeAll(all);
}

export function getWelcomeMessage(config: GuildConfig) {
  return config.welcomeMessage?.trim() || DEFAULT_WELCOME_MESSAGE;
}

export function getGoodbyeMessage(config: GuildConfig) {
  return config.goodbyeMessage?.trim() || DEFAULT_GOODBYE_MESSAGE;
}

export function getTicketPanelMessage(config: GuildConfig) {
  return config.ticketPanelMessage?.trim() || DEFAULT_TICKET_PANEL_MESSAGE;
}

export function getTicketChannelMessage(config: GuildConfig, typeId?: string) {
  const override = typeId ? config.ticketTypeOverrides?.[typeId]?.channelMessage : undefined;
  return override?.trim() || config.ticketChannelMessage?.trim() || DEFAULT_TICKET_CHANNEL_MESSAGE;
}

export function getTicketChannelTitle(config: GuildConfig, typeId?: string) {
  const override = typeId ? config.ticketTypeOverrides?.[typeId]?.channelTitle : undefined;
  return override?.trim() || config.ticketChannelTitle?.trim() || DEFAULT_TICKET_CHANNEL_TITLE;
}

export function getActiveTicketTypes(config: GuildConfig): TicketTypeDefinition[] {
  if (!config.ticketTypesEnabled) return [];
  return DEFAULT_TICKET_TYPES;
}

export function getTicketTypeCategory(config: GuildConfig, typeId: string) {
  return config.ticketTypeCategories?.[typeId] ?? config.ticketCategoryId;
}

export function getTicketTypeDefinition(typeId: string): TicketTypeDefinition | undefined {
  return DEFAULT_TICKET_TYPES.find((t) => t.id === typeId);
}

function normalizeTicketRecord(raw: string | TicketRecord): TicketRecord {
  if (typeof raw === "string") return { userId: raw };
  return raw;
}

export function getTicketRecord(
  guildId: string,
  channelId: string
): TicketRecord | undefined {
  const raw = getGuildConfig(guildId).openTickets?.[channelId];
  if (!raw) return undefined;
  return normalizeTicketRecord(raw);
}

export function registerOpenTicket(
  guildId: string,
  channelId: string,
  record: Omit<TicketRecord, "openedAt"> & { openedAt?: number }
) {
  const config = getGuildConfig(guildId);
  const openTickets = {
    ...config.openTickets,
    [channelId]: { ...record, openedAt: record.openedAt ?? Date.now() },
  };
  setGuildConfig(guildId, { openTickets });
}

export function removeOpenTicket(guildId: string, channelId: string) {
  const config = getGuildConfig(guildId);
  if (!config.openTickets?.[channelId]) return;

  const openTickets = { ...config.openTickets };
  delete openTickets[channelId];
  setGuildConfig(guildId, { openTickets });
}

export function findUserTicketChannel(
  guildId: string,
  userId: string
): string | undefined {
  const tickets = getGuildConfig(guildId).openTickets ?? {};
  return Object.entries(tickets).find(
    ([, record]) => normalizeTicketRecord(record).userId === userId
  )?.[0];
}

export function getTranscriptChannelId(config: GuildConfig): string | undefined {
  if (config.ticketTranscriptEnabled === false) return undefined;
  return config.ticketTranscriptChannelId ?? config.modLogChannelId;
}
