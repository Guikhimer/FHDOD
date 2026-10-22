# FHDOD · Pesquisa de satisfação

Estrutura inicial Next.js App Router, TypeScript, Tailwind CSS, componentes no padrão Shadcn/UI e Supabase. Consulte primeiro o [esquema SQL](supabase/migrations/202610020001_initial_schema.sql), depois a [arquitetura e árvore do projeto](docs/ARCHITECTURE.md) e o [formulário do paciente](src/components/SurveyForm.tsx).

## Executar

Node.js 22.12 ou superior:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. Sem variáveis Supabase, a aplicação funciona em demonstração: dados fictícios, nenhuma avaliação armazenada.

| Rota                           | Uso                                         |
| ------------------------------ | ------------------------------------------- |
| /                              | Entrada e orientação ao paciente            |
| /p/pronto-atendimento          | Pesquisa pública por setor                  |
| /p/pronto-atendimento?tablet=1 | Pesquisa com reinício automático            |
| /login                         | Acesso por senha ou link de uso único       |
| /auth/first-access             | Definir senha antes do primeiro painel      |
| /dashboard                     | Indicadores e filtros                       |
| /dashboard/manage              | Pesquisas, equipe, notificações e ouvidoria |
| /dashboard/tv-wall             | Indicadores ampliados com Realtime          |

## Conectar Supabase

1. Crie um projeto Supabase. Execute a migração SQL em um banco novo pelo SQL Editor ou `supabase db push`. O seed é opcional e deve ser executado uma vez.
2. Copie URL e chave publicável para `.env.local`. Defina `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor e uma chave aleatória de pelo menos 32 bytes para `SURVEY_COOKIE_SECRET`.
3. Defina `NEXT_PUBLIC_SITE_URL` com a origem real da aplicação, incluindo protocolo e sem barra final. Configure a mesma URL no Supabase Auth, com `/auth/callback` na lista de redirecionamentos permitidos. Desative cadastro público e configure SMTP para convites reais.
4. Configure os templates de e-mail do Supabase Auth para callbacks SSR. Convite: `<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite">Aceitar convite</a>`. Magic link: use `type=magiclink`; recuperação de senha: `type=recovery`. O callback ignora destinos arbitrários e valida o token de uso único.
5. Crie o primeiro usuário pelo painel Supabase Auth e promova-o pelo SQL Editor, usando o UUID real:

```sql
update public.profiles
set role = 'admin', active = true, must_change_password = true
where id = 'UUID-DO-USUARIO-CRIADO';
```

6. Entre com a senha temporária. A aplicação exige uma senha pessoal antes de liberar os resultados. Novos usuários podem ser convidados por `/dashboard/manage`.
7. Gere os tipos do seu banco ao ampliar a aplicação: `supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts`. Os contratos de domínio iniciais estão em `src/types/index.ts`.

## Notificações

As notas 1 ou 2 criam registros de ouvidoria e uma fila atômica, mesmo quando comentário e contato estão vazios. Publique a função:

```powershell
supabase functions deploy notify-complaints
supabase secrets set RESEND_API_KEY=SUA_CHAVE NOTIFICATION_FROM="FHDOD <ouvidoria@seu-dominio.org.br>" SITE_URL=https://seu-dominio.org.br
```

Use domínio validado no Resend. Configure os destinatários e ative os avisos em `/dashboard/manage`. Habilite Cron e pg_net no Supabase, salve no Vault os segredos `fhdod_project_url` e `fhdod_service_role_key` e execute [o agendamento](supabase/operations/schedule-notifications.sql). A função exige o bearer de serviço, bloqueia lotes concorrentes e repete falhas após 5 minutos. A chave de idempotência do Resend evita duplicações nas novas tentativas próximas; monitore falhas persistentes no banco e no provedor. O e-mail não contém comentário nem telefone.

## Vercel

Importe o repositório como projeto Next.js. Defina as cinco variáveis de produção indicadas em `.env.example` no ambiente Vercel, revise as URLs no Auth e publique a branch aprovada. Esta implementação não publica automaticamente nem cria serviços externos.

## Verificação

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm exec playwright install chromium
npm run test:e2e
```

Os testes de banco executam o SQL real em PostgreSQL via PGlite com um substituto mínimo do schema Auth; verificam RLS, validação, atomicidade, idempotência e métricas. Realtime, SMTP, Supabase Auth e a Edge Function requerem validação adicional em um projeto Supabase configurado. Os testes de navegador verificam o fluxo opcional, NPS zero, ouvidoria, reinício do tablet, zoom, teclado e axe.

[Gitflow e inicialização das branches](docs/GITFLOW.md) · [Arquitetura, decisões e escopo](docs/ARCHITECTURE.md)

Referências oficiais: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy), [templates de e-mail](https://supabase.com/docs/guides/auth/auth-email-templates), [agendamento de Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).
