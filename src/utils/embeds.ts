import { ColorResolvable, EmbedBuilder } from "discord.js";
import { GuildConfig } from "../config/store";
import { parseHexColor } from "./color";
import { applyTemplate } from "./template";

export interface EmbedTemplateOptions {
  config: GuildConfig;
  colorKey: "welcomeEmbedColor" | "ticketPanelColor" | "ticketChannelColor" | "modLogColor";
  title?: string;
  titleKey?: "welcomeTitle" | "ticketPanelTitle" | "ticketChannelTitle";
  description: string;
  imageUrl?: string;
  imageKey?: "welcomeImageUrl" | "ticketPanelImageUrl";
  thumbnailUrl?: string;
  footer?: string;
  defaultColor: number;
}

export function buildConfiguredEmbed(options: EmbedTemplateOptions): EmbedBuilder {
  const {
    config,
    colorKey,
    title,
    titleKey,
    description,
    imageUrl,
    imageKey,
    thumbnailUrl,
    footer,
    defaultColor,
  } = options;

  const color =
    parseHexColor(config[colorKey] as string | undefined) ?? defaultColor;

  const embed = new EmbedBuilder()
    .setColor(color as ColorResolvable)
    .setDescription(description);

  const resolvedTitle = title ?? (titleKey ? config[titleKey] : undefined);
  if (resolvedTitle?.trim()) {
    embed.setTitle(resolvedTitle.trim());
  }

  const resolvedImage = imageUrl ?? (imageKey ? config[imageKey] : undefined);
  if (resolvedImage?.trim()) {
    embed.setImage(resolvedImage.trim());
  }

  if (thumbnailUrl) {
    embed.setThumbnail(thumbnailUrl);
  }

  if (footer) {
    embed.setFooter({ text: footer });
  }

  return embed;
}

export function buildTemplateVars(
  base: Record<string, string>,
  extra?: Record<string, string>
) {
  return { ...base, ...extra };
}

export function applyEmbedTitle(
  template: string | undefined,
  variables: Record<string, string>
) {
  if (!template?.trim()) return undefined;
  return applyTemplate(template, variables);
}
