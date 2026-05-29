import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_TICKET_CHANNEL_MESSAGE,
  DEFAULT_TICKET_PANEL_MESSAGE,
  DEFAULT_WELCOME_MESSAGE,
} from "./defaults";

export interface TicketRecord {
  userId: string;
  reason?: string;
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
  /** @deprecated formato legado string — migrado automaticamente */
  openTickets?: Record<string, string | TicketRecord>;
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

export function getTicketPanelMessage(config: GuildConfig) {
  return config.ticketPanelMessage?.trim() || DEFAULT_TICKET_PANEL_MESSAGE;
}

export function getTicketChannelMessage(config: GuildConfig) {
  return config.ticketChannelMessage?.trim() || DEFAULT_TICKET_CHANNEL_MESSAGE;
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
  userId: string,
  reason?: string
) {
  const config = getGuildConfig(guildId);
  const openTickets = {
    ...config.openTickets,
    [channelId]: { userId, reason },
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
