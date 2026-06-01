"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendModLog = sendModLog;
const discord_js_1 = require("discord.js");
const store_1 = require("../config/store");
const color_1 = require("../utils/color");
const ACTION_COLORS = {
    ban: 0xed4245,
    unban: 0x57f287,
    kick: 0xfaa61a,
    timeout: 0x5865f2,
    untimeout: 0x57f287,
};
const ACTION_LABELS = {
    ban: "Banimento",
    unban: "Desbanimento",
    kick: "Expulsão",
    timeout: "Silenciamento",
    untimeout: "Silenciamento removido",
};
async function sendModLog(options) {
    const config = (0, store_1.getGuildConfig)(options.guild.id);
    if (!config.modLogChannelId)
        return;
    const channel = options.guild.channels.cache.get(config.modLogChannelId);
    if (!channel?.isTextBased() || channel.isDMBased())
        return;
    const customColor = (0, color_1.parseHexColor)(config.modLogColor);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(customColor ?? ACTION_COLORS[options.action])
        .setTitle(ACTION_LABELS[options.action])
        .addFields({ name: "Membro", value: `${options.target.tag} (\`${options.target.id}\`)`, inline: true }, {
        name: "Moderador",
        value: `${options.moderator.tag} (\`${options.moderator.id}\`)`,
        inline: true,
    })
        .setTimestamp();
    if (options.reason) {
        embed.addFields({ name: "Motivo", value: options.reason });
    }
    if (options.extra) {
        embed.addFields({ name: "Detalhes", value: options.extra });
    }
    await channel.send({ embeds: [embed] }).catch(() => undefined);
}
