# FHDOD · Pesquisa de satisfação

Frontend Next.js para pesquisas de satisfação hospitalar. A aplicação usa a API REST independente FHDOD; o navegador não acessa PostgreSQL e não usa credenciais Supabase. A API é a única camada que se conecta ao PostgreSQL hospedado.

## Executar localmente

Requisitos: Node.js 22.12 ou superior e o backend FHDOD em execução.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Configure `NEXT_PUBLIC_API_URL` para a origem HTTP da API (por exemplo, `http://localhost:3001`) e execute:

```powershell
npm run dev
```

Abra `http://localhost:3000`. Sem `NEXT_PUBLIC_API_URL`, as páginas usam dados demonstrativos e nenhuma avaliação é persistida. Consulte [API.md do backend](../backend-FHDOD/docs/API.md) e [SECURITY.md](../backend-FHDOD/docs/SECURITY.md) para contratos e configuração da API.

| Rota | Uso |
| --- | --- |
| `/` | Entrada e orientação ao paciente |
| `/p/{slug}` | Pesquisa pública por setor |
| `/p/{slug}?tablet=1` | Pesquisa com reinício automático |
| `/login` | Acesso da equipe por e-mail e senha |
| `/auth/first-access` | Troca obrigatória da senha temporária |
| `/dashboard` | Indicadores e filtros por período/setor |
| `/dashboard/manage` | Administração para Admin e Ouvidoria |
| `/tv-wall` | Painel público somente com indicadores agregados |

## Sessão e dados

O Next.js atua como BFF para chamadas autenticadas: access e refresh tokens ficam em cookies `HttpOnly`, `Secure` em produção e `SameSite=Lax`; as chamadas bearer são feitas no servidor. Configure CORS da API com as origens necessárias ao ambiente. Não coloque URL de banco, segredo JWT ou credenciais privadas em variáveis `NEXT_PUBLIC_*`.

A pesquisa pública usa `GET /api/v1/surveys/public/{slug}` e envia para o backend por um Route Handler do Next.js. A chave UUID de idempotência segue no cabeçalho `Idempotency-Key`. NPS de 0 a 10 é obrigatório; notas de 1 a 5 são opcionais. O horário informado pelo paciente descreve o atendimento e é separado do horário de envio. Contato só é enviado com consentimento. A API decide os registros de Ouvidoria e grava os dados.

O painel público `/tv-wall` recebe somente agregados e não mostra relatos, telefones ou linhas de respostas. A equipe de Ouvidoria e Admin consultam dados individuais da Ouvidoria; gestores têm somente o dashboard dos setores autorizados e não podem exportar dados brutos.

## Notificações

A tela salva destinatários e a preferência de notificação na API. O backend documenta a fila, mas o worker de envio de e-mails ainda precisa ser configurado; não considere o envio operacional até publicar e validar esse serviço. Não inclua comentário ou telefone em notificações.

## Dados históricos Supabase

O diretório `supabase/` e os testes de banco relacionados são mantidos como histórico da primeira implementação. Eles não são usados pelo frontend em runtime e não devem ser executados para configurar esta arquitetura. Não apague migrations/histórico sem um plano separado de arquivamento.

## Verificação

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm exec playwright install chromium
npm run test:e2e
```

Consulte [Arquitetura](docs/ARCHITECTURE.md), [lacunas de migração](docs/API_MIGRATION_GAPS.md), [validação](docs/VALIDATION.md) e [Gitflow](docs/GITFLOW.md). O frontend não provisiona Aiven nem implanta serviços externos.
