# BUGGER_BOT

Bot de Discord para **gerenciamento de servidores**: cargos, eventos agendados e informações do servidor.

## Stack

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [discord.js v14](https://discord.js.org/) — API oficial do Discord com slash commands

## Pré-requisitos

1. Conta no [Discord Developer Portal](https://discord.com/developers/applications)
2. Node.js 18+ instalado

## Configuração

### 1. Criar a aplicação no Discord

1. Acesse o [Developer Portal](https://discord.com/developers/applications) → **New Application**
2. Em **Bot** → **Reset Token** → copie o token
3. Ative as **Privileged Gateway Intents** se for usar presença de membros no futuro
4. Em **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permissões recomendadas: `Manage Roles`, `Manage Events`, `Ban Members`, `Kick Members`, `Moderate Members`, `Manage Guild`, `Send Messages`, `Use Slash Commands`
5. Use a URL gerada para adicionar o bot ao seu servidor de teste

### 2. Configurar o projeto

```bash
npm install
cp .env.example .env
```

Edite o `.env`:

```env
DISCORD_TOKEN=seu_token
DISCORD_CLIENT_ID=id_da_aplicacao
DISCORD_GUILD_ID=id_do_servidor_teste   # opcional — registra comandos só nesse servidor (mais rápido)
```

### 3. Registrar comandos e iniciar

```bash
npm run deploy-commands
npm run dev
```

### Comandos antigos aparecendo?

Isso acontece quando o bot já registrou slash commands **globalmente** em outra configuração. Com `DISCORD_GUILD_ID` no `.env`, o `deploy-commands` agora **remove os globais** e registra só no seu servidor.

Para limpar tudo manualmente:

```bash
npm run clear-commands
npm run deploy-commands
```

## Comandos disponíveis

### Geral
| Comando | Descrição |
|---------|-----------|
| `/ping` | Verifica se o bot está online |
| `/serverinfo` | Informações do servidor |
| `/setup logs` | Define canal de logs de moderação |
| `/setup ver` | Mostra configurações do servidor |

### Moderação (Fase 2)
| Comando | Descrição |
|---------|-----------|
| `/mod ban` | Bane membro (motivo, apagar mensagens 0-7 dias) |
| `/mod unban` | Desbane por ID do usuário |
| `/mod kick` | Expulsa membro |
| `/mod timeout` | Silencia por tempo (`10m`, `2h`, `1d`) |
| `/mod untimeout` | Remove silenciamento |

### Automação personalizável (Fase 3)
| Comando | Descrição |
|---------|-----------|
| `/setup welcome` | Canal + mensagem custom (`{user}` `{server}` `{count}`) |
| `/setup autorole` | Cargo automático ao entrar |
| `/setup ticket` | Categoria, cargo suporte, mensagens do painel e do ticket |
| `/setup reset` | Restaura textos padrão |
| `/setup ver` | Ver todas as configs |
| `/ticket painel` | Publica botões de abrir/fechar ticket |

### Preview e guia
| Comando | Descrição |
|---------|-----------|
| `/preview welcome` | Preview do embed de boas-vindas + sugestões |
| `/preview ticket-painel` | Preview do painel + botão de abrir |
| `/preview ticket-canal` | Preview dentro do ticket (com motivo exemplo) |
| `/preview logs` | Preview do embed de moderação |
| `/preview guia` | Guia completo: placeholders, cores, exemplos |

**Placeholders:** `{user}` `{username}` `{server}` `{count}` `{staff}` `{reason}` `{reason_block}` `{avatar}`

### Cargos e eventos
| Comando | Descrição |
|---------|-----------|
| `/role criar` | Cria um cargo (nome, cor, mencionável) |
| `/role deletar` | Remove um cargo |
| `/role dar` | Atribui cargo a um membro |
| `/role remover` | Remove cargo de um membro |
| `/role listar` | Lista cargos do servidor |
| `/evento criar` | Cria evento (início, fim, local, canal de voz opcional) |
| `/evento listar` | Lista eventos com IDs |
| `/evento cancelar` | Cancela um evento pelo ID |

## Estrutura do projeto

```
src/
├── index.ts              # Entrada do bot
├── client.ts             # Cliente e tipos
├── deploy-commands.ts      # Registro de slash commands
├── commands/             # Comandos modulares
│   ├── moderation.ts
│   ├── setup.ts
│   └── ...
├── config/store.ts       # Config por servidor (JSON)
├── services/modLog.ts    # Embeds de log
└── events/register.ts
```

## Próximos passos sugeridos

- **Painel web** ou mais placeholders (ex: `{avatar}`)
- **Auto-roles**: cargo ao entrar ou por reação
- **Banco de dados**: SQLite/PostgreSQL para configs por servidor
- **Painel web**: dashboard para admins (opcional, mais avançado)

## Insights de arquitetura

1. **Slash commands** — padrão atual do Discord; evite prefixos (`!`) para bots novos
2. **Permissões** — cada comando sensível usa `setDefaultMemberPermissions` + checagem em runtime
3. **Modularidade** — um arquivo por comando facilita crescer sem virar spaghetti
4. **Guild vs Global commands** — use `DISCORD_GUILD_ID` em dev; remova para produção global
5. **Hierarquia de cargos** — o bot só gerencia cargos **abaixo** do cargo dele no servidor

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Desenvolvimento com hot reload |
| `npm run build` | Compila TypeScript |
| `npm start` | Roda versão compilada |
| `npm run deploy-commands` | Registra/atualiza slash commands |
| `npm run clear-commands` | Remove todos os slash commands |
