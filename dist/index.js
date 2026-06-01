"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("./client");
const commands_1 = require("./commands");
const register_1 = require("./events/register");
const token = process.env.DISCORD_TOKEN;
if (!token) {
    throw new Error("DISCORD_TOKEN não definido no arquivo .env");
}
const client = new client_1.BuggerBot();
(0, commands_1.loadCommands)(client);
(0, register_1.registerEvents)(client);
client.login(token);

import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Online");
});

app.listen(process.env.PORT || 3000);
