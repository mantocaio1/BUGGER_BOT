import { GuildMember, PartialGuildMember, TextChannel } from "discord.js";
import {
  DEFAULT_GOODBYE_COLOR,
  DEFAULT_GOODBYE_TITLE,
} from "../config/defaults";
import { getGoodbyeMessage, getGuildConfig } from "../config/store";
import { applyEmbedTitle, buildConfiguredEmbed } from "../utils/embeds";
import { applyTemplate } from "../utils/template";

export async function handleMemberLeave(member: GuildMember | PartialGuildMember) {
  const config = getGuildConfig(member.guild.id);
  if (!config.goodbyeEnabled || !config.goodbyeChannelId) return;

  const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
  if (!channel?.isTextBased() || channel.isDMBased()) return;

  const variables = {
    user: member.user.toString(),
    username: member.user.username,
    server: member.guild.name,
    count: String(member.guild.memberCount),
    avatar: member.user.displayAvatarURL({ size: 512 }),
  };

  const message = applyTemplate(getGoodbyeMessage(config), variables);
  const useEmbed = config.goodbyeUseEmbed !== false;

  if (useEmbed) {
    const embed = buildConfiguredEmbed({
      config,
      colorKey: "goodbyeEmbedColor",
      titleKey: "goodbyeTitle",
      title: applyEmbedTitle(config.goodbyeTitle, variables) ?? DEFAULT_GOODBYE_TITLE,
      description: message,
      imageKey: "goodbyeImageUrl",
      thumbnailUrl: member.user.displayAvatarURL({ size: 256 }),
      defaultColor: DEFAULT_GOODBYE_COLOR,
    });

    await (channel as TextChannel).send({ embeds: [embed] }).catch(() => undefined);
    return;
  }

  await (channel as TextChannel).send(message).catch(() => undefined);
}

export function registerMemberLeave(client: import("../client").BuggerBot) {
  client.on("guildMemberRemove", (member) => {
    handleMemberLeave(member).catch(console.error);
  });
}
