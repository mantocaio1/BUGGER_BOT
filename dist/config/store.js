"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuildConfig = getGuildConfig;
exports.setGuildConfig = setGuildConfig;
exports.getWelcomeMessage = getWelcomeMessage;
exports.getGoodbyeMessage = getGoodbyeMessage;
exports.getTicketPanelMessage = getTicketPanelMessage;
exports.getTicketChannelMessage = getTicketChannelMessage;
exports.getTicketChannelTitle = getTicketChannelTitle;
exports.getActiveTicketTypes = getActiveTicketTypes;
exports.getTicketTypeCategory = getTicketTypeCategory;
exports.getTicketTypeDefinition = getTicketTypeDefinition;
exports.getTicketRecord = getTicketRecord;
exports.registerOpenTicket = registerOpenTicket;
exports.removeOpenTicket = removeOpenTicket;
exports.findUserTicketChannel = findUserTicketChannel;
exports.getTranscriptChannelId = getTranscriptChannelId;
const fs_1 = require("fs");
const path_1 = require("path");
const defaults_1 = require("./defaults");
const DATA_DIR = (0, path_1.join)(process.cwd(), "data");
const CONFIG_PATH = (0, path_1.join)(DATA_DIR, "guilds.json");
function ensureStore() {
    if (!(0, fs_1.existsSync)(DATA_DIR)) {
        (0, fs_1.mkdirSync)(DATA_DIR, { recursive: true });
    }
    if (!(0, fs_1.existsSync)(CONFIG_PATH)) {
        (0, fs_1.writeFileSync)(CONFIG_PATH, "{}", "utf-8");
    }
}
function readAll() {
    ensureStore();
    const raw = (0, fs_1.readFileSync)(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
}
function writeAll(data) {
    ensureStore();
    (0, fs_1.writeFileSync)(CONFIG_PATH, JSON.stringify(data, null, 2), "utf-8");
}
function getGuildConfig(guildId) {
    const all = readAll();
    return all[guildId] ?? {};
}
function setGuildConfig(guildId, patch) {
    const all = readAll();
    all[guildId] = { ...getGuildConfig(guildId), ...patch };
    writeAll(all);
}
function getWelcomeMessage(config) {
    return config.welcomeMessage?.trim() || defaults_1.DEFAULT_WELCOME_MESSAGE;
}
function getGoodbyeMessage(config) {
    return config.goodbyeMessage?.trim() || defaults_1.DEFAULT_GOODBYE_MESSAGE;
}
function getTicketPanelMessage(config) {
    return config.ticketPanelMessage?.trim() || defaults_1.DEFAULT_TICKET_PANEL_MESSAGE;
}
function getTicketChannelMessage(config, typeId) {
    const override = typeId ? config.ticketTypeOverrides?.[typeId]?.channelMessage : undefined;
    return override?.trim() || config.ticketChannelMessage?.trim() || defaults_1.DEFAULT_TICKET_CHANNEL_MESSAGE;
}
function getTicketChannelTitle(config, typeId) {
    const override = typeId ? config.ticketTypeOverrides?.[typeId]?.channelTitle : undefined;
    return override?.trim() || config.ticketChannelTitle?.trim() || defaults_1.DEFAULT_TICKET_CHANNEL_TITLE;
}
function getActiveTicketTypes(config) {
    if (!config.ticketTypesEnabled)
        return [];
    return defaults_1.DEFAULT_TICKET_TYPES;
}
function getTicketTypeCategory(config, typeId) {
    return config.ticketTypeCategories?.[typeId] ?? config.ticketCategoryId;
}
function getTicketTypeDefinition(typeId) {
    return defaults_1.DEFAULT_TICKET_TYPES.find((t) => t.id === typeId);
}
function normalizeTicketRecord(raw) {
    if (typeof raw === "string")
        return { userId: raw };
    return raw;
}
function getTicketRecord(guildId, channelId) {
    const raw = getGuildConfig(guildId).openTickets?.[channelId];
    if (!raw)
        return undefined;
    return normalizeTicketRecord(raw);
}
function registerOpenTicket(guildId, channelId, record) {
    const config = getGuildConfig(guildId);
    const openTickets = {
        ...config.openTickets,
        [channelId]: { ...record, openedAt: record.openedAt ?? Date.now() },
    };
    setGuildConfig(guildId, { openTickets });
}
function removeOpenTicket(guildId, channelId) {
    const config = getGuildConfig(guildId);
    if (!config.openTickets?.[channelId])
        return;
    const openTickets = { ...config.openTickets };
    delete openTickets[channelId];
    setGuildConfig(guildId, { openTickets });
}
function findUserTicketChannel(guildId, userId) {
    const tickets = getGuildConfig(guildId).openTickets ?? {};
    return Object.entries(tickets).find(([, record]) => normalizeTicketRecord(record).userId === userId)?.[0];
}
function getTranscriptChannelId(config) {
    if (config.ticketTranscriptEnabled === false)
        return undefined;
    return config.ticketTranscriptChannelId ?? config.modLogChannelId;
}
