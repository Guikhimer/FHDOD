# Validação da aplicação

## Comandos

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm exec playwright install chromium
npm run test:e2e
```

## Escopo de testes

- Unitários: validação de submissão, filtros e mapeamento do modelo de tela para o contrato da API.
- Banco legado: `tests/database.test.ts` executa as migrations históricas do diretório `supabase/` em PGlite. Esse teste valida a primeira implementação e não configura nem representa o runtime atual baseado na API.
- HTTP/E2E: autenticação, troca obrigatória de senha, pesquisa pública com idempotência, envio de notas opcionais, autorização por papel, exportação e estados de falha devem ser exercitados com backend isolado e dados descartáveis.
- A TV Wall deve ser acessível sem sessão e conter apenas indicadores agregados; conferir no DOM que não há texto livre, contato ou identificador de respostas.

## Limites da validação local

Execuções sem `NEXT_PUBLIC_API_URL` ficam no modo de demonstração e não comprovam integração. Testes com dados reais devem usar backend e banco de teste dedicados, nunca produção. A aplicação não verifica provisionamento de Aiven, deploy, entrega de e-mail ou configuração de domínio.
