import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
  Guild,
  TextChannel,
  User,
} from "discord.js";
import { getGuildConfig } from "../config/store";
import { parseHexColor } from "../utils/color";

export type ModAction =
  | "ban"
  | "unban"
  | "kick"
  | "timeout"
  | "untimeout";

const ACTION_COLORS: Record<ModAction, ColorResolvable> = {
  ban: 0xed4245,
  unban: 0x57f287,
  kick: 0xfaa61a,
  timeout: 0x5865f2,
  untimeout: 0x57f287,
};

const ACTION_LABELS: Record<ModAction, string> = {
  ban: "Banimento",
  unban: "Desbanimento",
  kick: "Expulsão",
  timeout: "Silenciamento",
  untimeout: "Silenciamento removido",
};

interface ModLogTarget {
  id: string;
  tag: string;
}

export async function sendModLog(options: {
  guild: Guild;
  action: ModAction;
  target: ModLogTarget;
  moderator: User;
  reason?: string;
  extra?: string;
}) {
  const config = getGuildConfig(options.guild.id);
  if (!config.modLogChannelId) return;

  const channel = options.guild.channels.cache.get(config.modLogChannelId);
  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const customColor = parseHexColor(config.modLogColor);
  const embed = new EmbedBuilder()
    .setColor(customColor ?? ACTION_COLORS[options.action])
    .setTitle(ACTION_LABELS[options.action])
    .addFields(
      { name: "Membro", value: `${options.target.tag} (\`${options.target.id}\`)`, inline: true },
      {
        name: "Moderador",
        value: `${options.moderator.tag} (\`${options.moderator.id}\`)`,
        inline: true,
      }
    )
    .setTimestamp();

  if (options.reason) {
    embed.addFields({ name: "Motivo", value: options.reason });
  }

  if (options.extra) {
    embed.addFields({ name: "Detalhes", value: options.extra });
  }

  await (channel as TextChannel).send({ embeds: [embed] }).catch(() => undefined);
}
