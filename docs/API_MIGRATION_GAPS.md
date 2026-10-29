# Migração do frontend para a API FHDOD

## Contrato verificado

O backend expõe autenticação bearer, troca de senha, leitura e envio de pesquisa pública, setores do usuário autenticado, métricas agregadas, ouvidoria paginada e respostas paginadas. A API não oferece ainda CRUD de pesquisa, perguntas, usuários/convites ou configurações de notificação, nem exportação de planilha com respostas detalhadas.

## Incompatibilidades que bloqueiam uma substituição transparente

- O painel atual depende de métricas por setor, distribuição das notas e contagens de promotores, neutros e detratores. A API entrega `count`, `nps`, `averageNpsScore` e `satisfactionPercent`.
- O relatório atual contém setor, respostas individuais, notas, texto histórico das perguntas e uma planilha de ouvidoria. A API lista respostas sem as notas nem dados da ocorrência.
- A tela de gestão atual cria setores/pesquisas/perguntas, desativa perguntas, convida usuários e altera destinatários das notificações. Não há endpoints correspondentes.
- O backend permite gestores consultar/atualizar ouvidoria limitada aos seus setores; a interface antiga mostra ouvidoria somente para administradores. A regra implementada no backend é a fonte de autorização; a interface deve explicitar a disponibilidade a gestores quando a funcionalidade for integrada.
- O backend calcula plantões 07:00–12:00, 12:00–19:00 e 19:00–07:00 em `America/Sao_Paulo`. O cálculo é exclusivamente do servidor.
- A submissão usa `Idempotency-Key` (UUID), `npsScore`, `answers[{questionId,score,questionText}]` e `complaint[{comment,contact,consent}]`.

## Decisões de integração

- O navegador não guarda tokens. Server Actions/Route Handlers do Next.js mantêm access e refresh tokens em cookies `HttpOnly`, `Secure` em produção e `SameSite=Lax`; chamadas autenticadas à API são feitas no servidor.
- O frontend envia uma ocorrência somente se alguma nota de pergunta for menor que 3. O backend também aplica essa regra para não confiar na validação do cliente.
- Até existir endpoint de exportação, a UI de exportação não pode apresentar uma planilha completa como se os dados fossem equivalentes. Até existirem endpoints administrativos, ações sem suporte devem ser removidas ou explicitamente indisponibilizadas, sem chamadas Supabase remanescentes.
- Não há migração de identidade automática: usuários e hashes de senha precisam ser provisionados no backend conforme `docs/MIGRATION.md` do backend.

## Pendências do contrato para concluir a migração integral

1. Criar endpoints administrativos para setores, surveys, perguntas, convites/usuários e notificações.
2. Expandir `dashboard/metrics` para suportar as visualizações atuais, ou aprovar simplificação do painel.
3. Expandir o relatório para incluir notas e campos de ouvidoria conforme autorização, ou aprovar um novo formato de exportação.
4. Confirmar a regra de acesso de gestores à ouvidoria e os limites de plantão.
