"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMemberLeave = handleMemberLeave;
exports.registerMemberLeave = registerMemberLeave;
const defaults_1 = require("../config/defaults");
const store_1 = require("../config/store");
const embeds_1 = require("../utils/embeds");
const template_1 = require("../utils/template");
async function handleMemberLeave(member) {
    const config = (0, store_1.getGuildConfig)(member.guild.id);
    if (!config.goodbyeEnabled || !config.goodbyeChannelId)
        return;
    const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const variables = {
        user: member.user.toString(),
        username: member.user.username,
        server: member.guild.name,
        count: String(member.guild.memberCount),
        avatar: member.user.displayAvatarURL({ size: 512 }),
    };
    const message = (0, template_1.applyTemplate)((0, store_1.getGoodbyeMessage)(config), variables);
    const useEmbed = config.goodbyeUseEmbed !== false;
    if (useEmbed) {
        const embed = (0, embeds_1.buildConfiguredEmbed)({
            config,
            colorKey: "goodbyeEmbedColor",
            titleKey: "goodbyeTitle",
            title: (0, embeds_1.applyEmbedTitle)(config.goodbyeTitle, variables) ?? defaults_1.DEFAULT_GOODBYE_TITLE,
            description: message,
            imageKey: "goodbyeImageUrl",
            thumbnailUrl: member.user.displayAvatarURL({ size: 256 }),
            defaultColor: defaults_1.DEFAULT_GOODBYE_COLOR,
        });
        await channel.send({ embeds: [embed] }).catch(() => undefined);
        return;
    }
    await channel.send(message).catch(() => undefined);
}
function registerMemberLeave(client) {
    client.on("guildMemberRemove", (member) => {
        handleMemberLeave(member).catch(console.error);
    });
}
