# Migração do frontend para a API FHDOD

## Contratos migrados nesta etapa

| Fluxo | Contrato usado |
| --- | --- |
| Sessão | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `PATCH /auth/password`, `GET /auth/me` |
| Pesquisa pública | `GET /surveys/public/{slug}`, `POST /surveys/public/{slug}/responses` com `Idempotency-Key` |
| Indicadores | `GET /dashboard/metrics`, `GET /sectors`, `GET /tv/metrics` |
| Administração | `POST /sectors`, `POST /surveys`, `GET/POST /questions`, `PATCH /questions/{id}`, `GET/PUT /settings/notifications`, `GET/POST /users` |
| Ouvidoria | `GET /complaints`, `PATCH /complaints/{id}` |
| Exportação | `GET /reports/responses` paginado; o Next compõe arquivo Excel |

As definições detalhadas estão no [contrato da API](../backend-FHDOD/docs/API.md) e no JSON servido por `/api/docs/json` no backend.

## Regras confirmadas e aplicadas

- Admin tem acesso total e pode criar contas. Ouvidoria pode operar globalmente, exceto criar contas. Gestores consultam somente o dashboard dos setores autorizados, sem gestão, exportação, comentários ou contatos.
- Contas novas são criadas pelo Admin com senha temporária e obrigadas a trocá-la no primeiro acesso. Não há convite por e-mail nesta versão; senha inicial deve ser compartilhada por canal seguro.
- NPS 0–10 é obrigatório. Notas de 1–5 são opcionais. A submissão usa `Idempotency-Key` (UUID) e mapeia `attendedAt` para a data/hora digitada do atendimento.
- O frontend só inclui contato com consentimento. O backend mantém a validação final e decide o registro de Ouvidoria.
- Turnos não são coletados nem filtrados nesta fase. A coluna antiga `shift` permanece nula nas submissões novas.
- TV Wall pública carrega apenas indicadores agregados; relatos, telefones e respostas individuais não são renderizados.
- A exportação Excel contém respostas e notas históricas; a aba de Ouvidoria (comentários/contatos) só é gerada para Admin e Ouvidoria.
- A exportação segue o limite de offset da API (até 100.100 respostas por arquivo); ao atingir o teto, o frontend retorna erro e exige filtros para não entregar uma planilha parcial como completa.
- Não existe rotina de exclusão automática; a retenção é indefinida conforme decisão do cliente.

## Lacunas operacionais restantes

1. O backend precisa ter as migrations aplicadas no banco do ambiente e endpoints implantados na mesma versão do frontend, incluindo migration `002_client_confirmed_requirements.sql` e `/tv/metrics`, `/auth/me`, `/users` e demais rotas de gestão.
2. A API salva a preferência de notificações e enfileira registros, porém o worker de e-mail não está implementado/operacionalizado. A preferência não garante entrega até o worker existir e ser monitorado.
3. Não há UI para associação humana de respostas a equipe/profissional, edição de setores ou arquivamento de pesquisas.
4. Os testes E2E dependem de API e dados de teste configurados; não afirmam conexão com Aiven nem implantação em produção.

## Arquivos históricos

O código de runtime Supabase foi removido e as dependências `@supabase/ssr` e `@supabase/supabase-js` foram removidas. A varredura de `src/` e `package.json` não encontrou consumidores/dependências Supabase de runtime. O diretório `supabase/`, as migrations e os testes associados foram mantidos para preservar histórico e rastreabilidade da versão anterior.
