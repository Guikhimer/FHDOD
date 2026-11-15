# Arquitetura vigente do frontend

## Componentes e limites

```text
Navegador
  └─ Next.js (interface, Server Components, Server Actions e BFF)
       └─ API REST FHDOD (`/api/v1`, autenticação bearer)
            └─ PostgreSQL gerenciado pela API (Aiven no ambiente implantado)
```

O frontend não abre conexão PostgreSQL e não contém credenciais Supabase operacionais. `NEXT_PUBLIC_API_URL` configura a origem da API; apesar do prefixo público usado pelo Next para compilar a origem, nenhum segredo acompanha essa variável. `src/lib/api.ts` centraliza chamadas autenticadas feitas no servidor, e `src/lib/api-schemas.ts` valida respostas de leitura com Zod. O navegador não recebe tokens JWT.

## Sessão e autorização

- Login, refresh, logout e troca de senha usam os endpoints reais de `/auth`.
- O Next mantém access e refresh tokens em cookies `HttpOnly`; em produção, `Secure` e `SameSite=Lax`. O proxy valida sessão e tenta refresh em navegação protegida; autorização efetiva continua no backend.
- `mustChangePassword` direciona para `/auth/first-access`; o painel não é liberado antes da troca.
- O backend aplica as regras Admin, Ouvidoria e Gestor. Gestores consultam o dashboard apenas para os próprios setores; Admin e Ouvidoria têm acesso operacional global. Somente Admin lista/cria contas.
- Comentários e telefones da Ouvidoria não são incluídos para gestores e não aparecem na TV Wall pública. A rota de Excel também é bloqueada a gestores.

## Fluxos de dados

- **Pesquisa pública:** Server Component carrega setor e questões ativas via `GET /surveys/public/{slug}`. O Route Handler valida a submissão, verifica origem e tamanho e repassa `Idempotency-Key` ao backend. NPS 0–10 é obrigatório; notas 1–5 são opcionais. `attendedAt` guarda a data/hora do atendimento, distinta de `created_at`. O servidor da API mantém `shift` nulo; plantões estão fora do escopo atual.
- **Dashboard:** Server Components consultam métricas e setores. O backend calcula escopo de gestores, filtros e agregados.
- **Ouvidoria e gestão:** Server Actions validam os dados com Zod e usam endpoints REST. Usuário novo é criado pelo Admin com senha temporária, hash Argon2id no backend e troca obrigatória no primeiro acesso. A senha temporária é definida pelo Admin e deve ser compartilhada por canal seguro.
- **Excel:** Route Handler do Next pagina respostas do backend e gera planilhas de respostas e notas. Comentários/contatos entram somente para Admin e Ouvidoria. Gestores não têm acesso a esse endpoint.
- **TV Wall:** rota pública `/tv-wall`; consome `/tv/metrics`, que devolve somente agregados. Não renderiza amostras, comentários, telefones ou respostas individuais.

## Modelo de negócio preservado

- NPS e notas de avaliação são medidas diferentes. NPS de 0–10 é obrigatório; avaliações de 1–5 são opcionais.
- Mensagens da Ouvidoria são texto livre e classificação/vinculação com equipe ou profissional é humana.
- A Ouvidoria só é registrada quando há avaliação menor que 3, conforme regra vigente no backend.
- Contato é opcional e só pode ser enviado com consentimento.
- A retenção de respostas, comentários, contatos e histórico é indefinida. Não existe rotina de expurgo nesta migração.
- A TV Wall exibe indicadores agregados públicos.

## Limites conhecidos

- Os endpoints de publicação e criação de perguntas/setores estão implementados. Edição/arquivamento de setores e edição/arquivamento de pesquisas continuam fora da UI.
- A API persiste preferências de notificações e enfileira ocorrências, mas o worker que efetivamente envia e-mails ainda precisa ser operacionalizado.
- A associação humana de respostas a profissionais/equipes não possui interface nesta versão.
- `supabase/` e testes de banco antigos são artefatos históricos da versão monolítica; não fazem parte do runtime atual. Migrações históricas devem ser preservadas.

## Estrutura relevante

```text
src/
  app/
    api/reports/route.ts              # Exportação Excel via API
    api/surveys/[slug]/route.ts       # BFF de submissão pública
    auth/actions.ts                   # Sessão da API
    dashboard/                        # Painel e gestão
    p/[slug]/page.tsx                 # Pesquisa por setor
    tv-wall/page.tsx                  # Painel público agregado
  components/                         # Interface reutilizável
  lib/api.ts                          # Cliente server-side
  lib/api-schemas.ts                  # Validação de respostas
  lib/auth.ts                         # Perfil e proteção de página
  lib/dashboard.ts                    # Métricas e setores
  proxy.ts                            # Validação/renovação otimista de sessão
docs/
  API_MIGRATION_GAPS.md
  ARCHITECTURE.md
  VALIDATION.md
```
