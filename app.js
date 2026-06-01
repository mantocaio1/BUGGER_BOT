const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();

app.get("/", (req, res) => {
    res.send("Bot online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Web Server iniciado na porta ${PORT}`);
});

// Seu código do bot aqui
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.login(process.env.DISCORD_TOKEN);