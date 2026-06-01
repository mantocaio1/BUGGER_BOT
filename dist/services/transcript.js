"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAndSendTranscript = saveAndSendTranscript;
const fs_1 = require("fs");
const path_1 = require("path");
const discord_js_1 = require("discord.js");
const store_1 = require("../config/store");
const TRANSCRIPT_DIR = (0, path_1.join)(process.cwd(), "data", "transcripts");
function ensureTranscriptDir(guildId) {
    const dir = (0, path_1.join)(TRANSCRIPT_DIR, guildId);
    if (!(0, fs_1.existsSync)(dir))
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    return dir;
}
async function saveAndSendTranscript(guild, channelId, closedById) {
    const config = (0, store_1.getGuildConfig)(guild.id);
    const transcriptChannelId = (0, store_1.getTranscriptChannelId)(config);
    if (!transcriptChannelId)
        return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const textChannel = channel;
    const record = (0, store_1.getTicketRecord)(guild.id, channelId);
    let messages;
    try {
        messages = await textChannel.messages.fetch({ limit: 100 });
    }
    catch {
        return;
    }
    const sorted = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const lines = sorted.map((msg) => {
        const time = new Date(msg.createdTimestamp).toISOString();
        const author = msg.author.tag;
        const content = msg.content || "[embed/anexo]";
        return `[${time}] ${author}: ${content}`;
    });
    const header = [
        `Ticket transcript — ${guild.name}`,
        `Canal: #${textChannel.name} (${channelId})`,
        record
            ? `Dono: ${record.userId} · Tipo: ${record.typeLabel ?? record.typeId ?? "—"}`
            : "",
        record?.reason ? `Motivo: ${record.reason}` : "",
        `Fechado por: ${closedById}`,
        `Mensagens: ${lines.length}`,
        "─".repeat(40),
        "",
    ]
        .filter(Boolean)
        .join("\n");
    const body = header + lines.join("\n");
    const fileName = `ticket-${channelId}-${Date.now()}.txt`;
    const dir = ensureTranscriptDir(guild.id);
    (0, fs_1.writeFileSync)((0, path_1.join)(dir, fileName), body, "utf-8");
    const logChannel = guild.channels.cache.get(transcriptChannelId);
    if (!logChannel?.isTextBased() || logChannel.isDMBased())
        return;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Transcript de ticket")
        .addFields({ name: "Canal", value: `#${textChannel.name}`, inline: true }, {
        name: "Membro",
        value: record ? `<@${record.userId}>` : "—",
        inline: true,
    }, {
        name: "Tipo",
        value: record?.typeLabel ?? record?.typeId ?? "—",
        inline: true,
    }, { name: "Fechado por", value: `<@${closedById}>`, inline: true }, { name: "Mensagens", value: String(lines.length), inline: true })
        .setTimestamp();
    if (record?.reason) {
        embed.addFields({ name: "Motivo", value: record.reason.slice(0, 1024) });
    }
    await logChannel.send({
        embeds: [embed],
        files: [{ attachment: Buffer.from(body, "utf-8"), name: fileName }],
    });
}
