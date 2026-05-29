import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface GuildConfig {
  modLogChannelId?: string;
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
