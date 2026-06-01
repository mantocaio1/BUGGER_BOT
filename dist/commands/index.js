"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
exports.loadCommands = loadCommands;
const role_1 = require("./role");
const event_1 = require("./event");
const ping_1 = require("./ping");
const serverinfo_1 = require("./serverinfo");
const moderation_1 = require("./moderation");
const setup_1 = require("./setup");
const preview_1 = require("./preview");
const roles_1 = require("./roles");
const cores_1 = require("./cores");
exports.commands = [
    ping_1.pingCommand,
    serverinfo_1.serverinfoCommand,
    setup_1.setupCommand,
    preview_1.previewCommand,
    role_1.roleCommand,
    event_1.eventCommand,
    moderation_1.moderationCommand,
    cores_1.coresCommand,
    roles_1.rolesCommand,
];
function loadCommands(client) {
    for (const command of exports.commands) {
        client.commands.set(command.data.name, command);
    }
}
