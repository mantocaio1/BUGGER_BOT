import { GuildMember, TextChannel } from "discord.js";
import { applyAutoRole } from "../services/autoRole";
import {
  DEFAULT_WELCOME_COLOR,
  DEFAULT_WELCOME_TITLE,
} from "../config/defaults";
import { getGuildConfig, getWelcomeMessage } from "../config/store";
import { applyEmbedTitle, buildConfiguredEmbed } from "../utils/embeds";
import { applyTemplate } from "../utils/template";

export async function handleMemberJoin(member: GuildMember) {
  await applyAutoRole(member);

  const config = getGuildConfig(member.guild.id);
  if (!config.welcomeEnabled || !config.welcomeChannelId) return;

  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const variables = {
    user: member.toString(),
    username: member.user.username,
    server: member.guild.name,
    count: String(member.guild.memberCount),
    avatar: member.user.displayAvatarURL({ size: 512 }),
  };

  const message = applyTemplate(getWelcomeMessage(config), variables);
  const useEmbed = config.welcomeUseEmbed !== false;

  if (useEmbed) {
    const embed = buildConfiguredEmbed({
      config,
      colorKey: "welcomeEmbedColor",
      titleKey: "welcomeTitle",
      title: applyEmbedTitle(config.welcomeTitle, variables) ?? DEFAULT_WELCOME_TITLE,
      description: message,
      imageKey: "welcomeImageUrl",
      thumbnailUrl: member.user.displayAvatarURL({ size: 256 }),
      defaultColor: DEFAULT_WELCOME_COLOR,
    });

    await (channel as TextChannel).send({ embeds: [embed] }).catch(() => undefined);
    return;
  }

  await (channel as TextChannel).send(message).catch(() => undefined);
}

export function registerMemberJoin(client: import("../client").BuggerBot) {
  client.on("guildMemberAdd", (member) => {
    handleMemberJoin(member).catch(console.error);
  });
}
