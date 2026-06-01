"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTemplate = applyTemplate;
function applyTemplate(template, variables) {
    return template.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`);
}
