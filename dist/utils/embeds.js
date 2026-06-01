"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfiguredEmbed = buildConfiguredEmbed;
exports.buildTemplateVars = buildTemplateVars;
exports.applyEmbedTitle = applyEmbedTitle;
const discord_js_1 = require("discord.js");
const color_1 = require("./color");
const template_1 = require("./template");
function buildConfiguredEmbed(options) {
    const { config, colorKey, title, titleKey, description, imageUrl, imageKey, thumbnailUrl, footer, defaultColor, } = options;
    const color = (0, color_1.parseHexColor)(config[colorKey]) ?? defaultColor;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(color)
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
function buildTemplateVars(base, extra) {
    return { ...base, ...extra };
}
function applyEmbedTitle(template, variables) {
    if (!template?.trim())
        return undefined;
    return (0, template_1.applyTemplate)(template, variables);
}
