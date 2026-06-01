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

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot está online! 🤖');
});

app.listen(PORT, () => {
  console.log(`Web server rodando na porta ${PORT}`);
});
