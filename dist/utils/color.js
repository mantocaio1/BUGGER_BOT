"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHexColor = parseHexColor;
exports.formatHexColor = formatHexColor;
const HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;
function parseHexColor(raw) {
    if (!raw?.trim())
        return null;
    const match = raw.trim().match(HEX_COLOR);
    if (!match)
        return null;
    return parseInt(match[1], 16);
}
function formatHexColor(value) {
    if (value === undefined || value === null)
        return "—";
    return `#${value.toString(16).padStart(6, "0").toUpperCase()}`;
}
