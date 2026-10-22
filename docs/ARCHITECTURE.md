# Arquitetura inicial

## 1. Banco e segurança

O DDL completo está em `supabase/migrations/202610020001_initial_schema.sql`, incluindo a pergunta NPS obrigatória inicial. Aplique a migração antes da aplicação e execute `supabase/seed.sql` uma única vez para criar três setores e as perguntas opcionais iniciais. O seed não cria pacientes, respostas ou usuários.

| Tabela                    | Finalidade                                                           |
| ------------------------- | -------------------------------------------------------------------- |
| profiles                  | Identidade ligada ao Supabase Auth, role, ativação e primeiro acesso |
| sectors                   | Setores e slugs públicos únicos                                      |
| sector_managers           | Vínculo muitos-para-muitos entre gestores e setores                  |
| surveys                   | Pesquisa do setor, publicação e tempo de reinício do tablet          |
| questions                 | Perguntas setoriais, gerais e NPS global                             |
| responses                 | Nota NPS obrigatória, plantão e horário de envio                     |
| answers                   | Notas opcionais de 1 a 5 e cópia do texto da pergunta                |
| complaints                | Comentário e contato opcionais, autorização e situação               |
| app_settings              | Destinatários e ativação das notificações                            |
| private.submission_keys   | Idempotência e hash de sessão, inacessíveis aos clientes             |
| private.notification_jobs | Fila transacional de avisos com bloqueio e novas tentativas          |

Clientes públicos consultam somente `get_public_survey(slug)`. A API Next.js valida os dados e chama `submit_survey` com uma chave de serviço exclusivamente no servidor. O banco valida novamente o NPS, as notas, perguntas ativas, setor, duplicações e autorização de contato. A transação grava resposta, notas, ouvidoria e fila; uma falha desfaz tudo.

O papel do usuário não é lido de metadata enviada por ele. O trigger cria perfis inativos, com role de gestor e primeiro acesso obrigatório. Somente o administrador ativa usuários e atribui setores. Gestores não podem promover seu perfil, modificar perguntas gerais ou ler respostas de outro setor. A troca de senha é realizada pelo Supabase Auth antes de o servidor liberar `must_change_password`.

A leitura administrativa usa a sessão do usuário e RLS, inclusive exportação e agregações. Contatos e comentários são exclusivos do administrador. A publicação Realtime contém somente `responses`; não contém dados de ouvidoria, chaves de sessão ou notas individuais. O painel TV exige uma conta e apresenta apenas agregados. Para exibição prolongada, use uma conta de gestor dedicada aos setores desejados.

## 2. Estrutura

```text
src/
  app/
    layout.tsx, page.tsx, globals.css, error.tsx, not-found.tsx
    p/[slug]/page.tsx
    api/surveys/[slug]/route.ts
    api/reports/route.ts
    login/page.tsx
    auth/actions.ts
    auth/callback/route.ts
    auth/first-access/page.tsx
    dashboard/layout.tsx, page.tsx
    dashboard/manage/page.tsx, actions.ts
    dashboard/tv-wall/page.tsx
  components/
    ui/button.tsx
    SurveyForm.tsx, RatingFace.tsx, Brand.tsx, ActionForm.tsx
    DashboardShell.tsx, MetricsCards.tsx, DashboardCharts.tsx
    RealtimeRefresh.tsx
  lib/
    supabase/client.ts, server.ts, admin.ts
    auth.ts, env.ts, dashboard.ts, demo.ts
    survey-validation.ts, filters.ts, utils.ts
  types/index.ts
  proxy.ts
supabase/
  migrations/202610020001_initial_schema.sql
  seed.sql, config.toml
  functions/notify-complaints/index.ts
  operations/schedule-notifications.sql
tests/
docs/
```

Server Components carregam dados; formulários administrativos usam Server Actions; o envio público e o Excel usam Route Handlers. A sessão SSR é renovada por `src/proxy.ts`. O botão segue a composição Shadcn/UI com Radix Slot e Class Variance Authority, personalizado para alvos amplos; `components.json` permite ampliar o conjunto. Tailwind CSS 4 e CSS global definem o design inclusivo, sem depender de fontes externas.

## 3. Interface do paciente

`SurveyForm.tsx` ordena perguntas setoriais, gerais e NPS. A RPC também fornece essa ordem. Uma pergunta é exibida por tela, com legenda textual e escala visual em SVG. Somente o NPS é obrigatório; a nota zero é válida. Uma nota opcional 1 ou 2 adiciona a etapa da ouvidoria após o NPS. Comentário e telefone continuam opcionais, e contato preenchido exige autorização.

O formulário oferece A−/A+ de 18 até 24px para conteúdo e controles, navegação por teclado, grupos de rádio nativos, foco no título da etapa, progresso, mensagens de erro e confirmação. Alvos interativos têm pelo menos 48px; cores não são a única indicação de escolha. O layout se adapta a celulares e zoom. A conformidade WCAG integral requer auditoria humana com leitores de tela e avaliação de usuários, além da verificação automática incluída.

Use `/p/pronto-atendimento?tablet=1` para reinício automático após o tempo da pesquisa (20 segundos por padrão). Campos são limpos ao enviar e antes da próxima pessoa. Não gravamos comentários, contatos ou notas em armazenamento local. A UUID de envio fica apenas em memória e é reutilizada em novas tentativas. Um cookie HttpOnly assinado por hash HMAC identifica a sessão no servidor; o banco bloqueia novos envios por 8 segundos e retorna a mesma resposta para uma UUID já recebida. Isso evita acidentes; não é proteção completa contra robôs ou múltiplos dispositivos. Antes de grande exposição pública, configure limites de requisição no serviço de hospedagem.

## 4. Indicadores e relatórios

- NPS = 100 × (promotores 9–10 − detratores 0–6) / total. Neutros: 7–8. Escala −100 a +100.
- Média = média das notas opcionais, escala 1–5.
- Satisfação = percentual das notas opcionais 4 ou 5; não é o NPS e não é média convertida em porcentagem.
- Ausência de respostas aparece como `—`, nunca como uma nota artificialmente positiva.
- Plantões iniciais: manhã 7–13h, tarde 13–19h, noite 19–7h, horário de São Paulo. O banco determina o plantão pelo horário de envio. Ajuste esse mapeamento à escala real da fundação.
- Datas incluem o dia final inteiro. O Excel preserva o texto original da pergunta e pagina resultados; não se limita às primeiras mil linhas. Contatos e comentários só entram no Excel do administrador.

## Escopo da base e próximos incrementos

Inclui criação de setores/pesquisas/perguntas, desativação de perguntas, convite de usuários, preferências de aviso, acompanhamento da ouvidoria, indicadores e Excel. Edição avançada de perguntas/setores, reatribuição e suspensão de usuários pela UI, versionamento de pesquisas, escalas configuráveis, trilha de auditoria, retenção e expurgo ficam para próximas features. Essas operações podem ser administradas no Supabase enquanto a UI é ampliada. O esquema usa restrições e preserva perguntas com respostas em vez de apagá-las.

Sem credenciais, as telas exibem dados fictícios identificados e não armazenam avaliações. Os filtros nesse modo retornam um estado vazio para não simular resultados inexistentes; o Excel de demonstração contém somente exemplos por setor. Nenhum banco ou serviço externo foi provisionado por esta implementação.
