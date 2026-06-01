"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMemberJoin = handleMemberJoin;
exports.registerMemberJoin = registerMemberJoin;
const autoRole_1 = require("../services/autoRole");
const defaults_1 = require("../config/defaults");
const store_1 = require("../config/store");
const embeds_1 = require("../utils/embeds");
const template_1 = require("../utils/template");
async function handleMemberJoin(member) {
    await (0, autoRole_1.applyAutoRole)(member);
    const config = (0, store_1.getGuildConfig)(member.guild.id);
    if (!config.welcomeEnabled || !config.welcomeChannelId)
        return;
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const variables = {
        user: member.toString(),
        username: member.user.username,
        server: member.guild.name,
        count: String(member.guild.memberCount),
        avatar: member.user.displayAvatarURL({ size: 512 }),
    };
    const message = (0, template_1.applyTemplate)((0, store_1.getWelcomeMessage)(config), variables);
    const useEmbed = config.welcomeUseEmbed !== false;
    if (useEmbed) {
        const embed = (0, embeds_1.buildConfiguredEmbed)({
            config,
            colorKey: "welcomeEmbedColor",
            titleKey: "welcomeTitle",
            title: (0, embeds_1.applyEmbedTitle)(config.welcomeTitle, variables) ?? defaults_1.DEFAULT_WELCOME_TITLE,
            description: message,
            imageKey: "welcomeImageUrl",
            thumbnailUrl: member.user.displayAvatarURL({ size: 256 }),
            defaultColor: defaults_1.DEFAULT_WELCOME_COLOR,
        });
        await channel.send({ embeds: [embed] }).catch(() => undefined);
        return;
    }
    await channel.send(message).catch(() => undefined);
}
function registerMemberJoin(client) {
    client.on("guildMemberAdd", (member) => {
        handleMemberJoin(member).catch(console.error);
    });
}
