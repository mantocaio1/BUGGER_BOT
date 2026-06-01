"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewCommand = void 0;
const discord_js_1 = require("discord.js");
const client_1 = require("../client");
const previewGuide_1 = require("../services/previewGuide");
const preview_1 = require("../services/preview");
const tickets_1 = require("../services/tickets");
function addEmbedPreviewOptions(sub, withImage = true) {
    sub
        .addStringOption((opt) => opt
        .setName("mensagem")
        .setDescription("Texto para testar (substitui config salva)")
        .setRequired(false))
        .addStringOption((opt) => opt.setName("titulo").setDescription("Título do embed").setRequired(false))
        .addStringOption((opt) => opt.setName("cor").setDescription("Cor hex (ex: #5865F2)").setRequired(false));
    if (withImage) {
        sub.addStringOption((opt) => opt
            .setName("imagem")
            .setDescription("URL do banner para testar")
            .setRequired(false));
    }
    return sub;
}
exports.previewCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("preview")
        .setDescription("Visualiza embeds e mostra sugestões antes de configurar.")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) => addEmbedPreviewOptions(sub.setName("goodbye").setDescription("Preview das despedidas.")))
        .addSubcommand((sub) => addEmbedPreviewOptions(sub.setName("welcome").setDescription("Preview das boas-vindas.")))
        .addSubcommand((sub) => addEmbedPreviewOptions(sub.setName("ticket-painel").setDescription("Preview do painel de tickets.")))
        .addSubcommand((sub) => {
        addEmbedPreviewOptions(sub.setName("ticket-canal").setDescription("Preview do embed dentro do ticket."), false);
        sub.addStringOption((opt) => opt
            .setName("motivo")
            .setDescription("Motivo de exemplo para o preview")
            .setRequired(false));
        return sub;
    })
        .addSubcommand((sub) => sub
        .setName("logs")
        .setDescription("Preview dos logs de moderação.")
        .addStringOption((opt) => opt.setName("cor").setDescription("Cor hex (ex: #ED4245)").setRequired(false)))
        .addSubcommand((sub) => sub
        .setName("guia")
        .setDescription("Guia completo com placeholders, cores e exemplos.")
        .addStringOption((opt) => opt
        .setName("modulo")
        .setDescription("Módulo específico ou tudo")
        .setRequired(false)
        .addChoices({ name: "Tudo", value: "todos" }, { name: "Boas-vindas", value: "welcome" }, { name: "Despedidas", value: "goodbye" }, { name: "Painel de tickets", value: "ticket_painel" }, { name: "Canal do ticket", value: "ticket_canal" }, { name: "Logs", value: "logs" }))),
    async execute(interaction) {
        (0, client_1.requirePermissions)(interaction, client_1.MANAGE_GUILD);
        const guild = (0, client_1.requireGuild)(interaction);
        const sub = interaction.options.getSubcommand(true);
        if (sub === "guia") {
            const modulo = (interaction.options.getString("modulo") ?? "todos");
            await interaction.reply({
                embeds: (0, previewGuide_1.buildSuggestionsEmbeds)(modulo),
                ephemeral: true,
            });
            return;
        }
        const overrides = (0, preview_1.readPreviewOverrides)({
            mensagem: interaction.options.getString("mensagem"),
            titulo: interaction.options.getString("titulo"),
            cor: interaction.options.getString("cor"),
            imagem: interaction.options.getString("imagem"),
            motivo: interaction.options.getString("motivo"),
        });
        let previewModule;
        let previewEmbed;
        let components;
        if (sub === "welcome") {
            previewModule = "welcome";
            const config = (0, preview_1.mergePreviewConfig)(guild.id, (0, preview_1.welcomeOverridesToConfig)(overrides));
            previewEmbed = (0, preview_1.buildWelcomePreviewEmbed)(guild, interaction.user, config);
        }
        else if (sub === "goodbye") {
            previewModule = "welcome";
            const config = (0, preview_1.mergePreviewConfig)(guild.id, (0, preview_1.goodbyeOverridesToConfig)(overrides));
            previewEmbed = (0, preview_1.buildGoodbyePreviewEmbed)(guild, interaction.user, config);
        }
        else if (sub === "ticket-painel") {
            previewModule = "ticket_painel";
            const config = (0, preview_1.mergePreviewConfig)(guild.id, (0, preview_1.ticketPanelOverridesToConfig)(overrides));
            const staff = (0, preview_1.resolveStaffMention)(guild, config);
            previewEmbed = (0, preview_1.buildTicketPanelPreviewEmbed)(guild, config, staff);
            components = (0, tickets_1.buildTicketPanelRows)(config);
        }
        else if (sub === "ticket-canal") {
            previewModule = "ticket_canal";
            const config = (0, preview_1.mergePreviewConfig)(guild.id, (0, preview_1.ticketChannelOverridesToConfig)(overrides));
            const staff = (0, preview_1.resolveStaffMention)(guild, config);
            previewEmbed = (0, preview_1.buildTicketChannelPreviewEmbed)(guild, interaction.user, config, staff, overrides.motivo ?? undefined);
            components = [(0, tickets_1.buildTicketCloseRow)()];
        }
        else {
            previewModule = "logs";
            const config = (0, preview_1.mergePreviewConfig)(guild.id, (0, preview_1.logsOverridesToConfig)(overrides));
            previewEmbed = (0, preview_1.buildModLogPreviewEmbed)(config, interaction.user);
        }
        const guideEmbeds = (0, previewGuide_1.buildSuggestionsEmbeds)(previewModule);
        await interaction.reply({
            content: "**Preview** — assim ficará no servidor (dados de exemplo):",
            embeds: [previewEmbed, ...guideEmbeds],
            components,
            ephemeral: true,
        });
    },
};
