import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { EmbedBuilder, Guild, TextChannel } from "discord.js";
import { getGuildConfig, getTicketRecord, getTranscriptChannelId } from "../config/store";

const TRANSCRIPT_DIR = join(process.cwd(), "data", "transcripts");

function ensureTranscriptDir(guildId: string) {
  const dir = join(TRANSCRIPT_DIR, guildId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export async function saveAndSendTranscript(
  guild: Guild,
  channelId: string,
  closedById: string
) {
  const config = getGuildConfig(guild.id);
  const transcriptChannelId = getTranscriptChannelId(config);
  if (!transcriptChannelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const textChannel = channel as TextChannel;
  const record = getTicketRecord(guild.id, channelId);

  let messages;
  try {
    messages = await textChannel.messages.fetch({ limit: 100 });
  } catch {
    return;
  }

  const sorted = [...messages.values()].sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

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
  writeFileSync(join(dir, fileName), body, "utf-8");

  const logChannel = guild.channels.cache.get(transcriptChannelId);
  if (!logChannel?.isTextBased() || logChannel.isDMBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Transcript de ticket")
    .addFields(
      { name: "Canal", value: `#${textChannel.name}`, inline: true },
      {
        name: "Membro",
        value: record ? `<@${record.userId}>` : "—",
        inline: true,
      },
      {
        name: "Tipo",
        value: record?.typeLabel ?? record?.typeId ?? "—",
        inline: true,
      },
      { name: "Fechado por", value: `<@${closedById}>`, inline: true },
      { name: "Mensagens", value: String(lines.length), inline: true }
    )
    .setTimestamp();

  if (record?.reason) {
    embed.addFields({ name: "Motivo", value: record.reason.slice(0, 1024) });
  }

  await (logChannel as TextChannel).send({
    embeds: [embed],
    files: [{ attachment: Buffer.from(body, "utf-8"), name: fileName }],
  });
}
