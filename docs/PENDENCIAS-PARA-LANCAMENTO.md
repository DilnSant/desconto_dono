# Pendências para deixar o projeto pronto

Revisado em 06/11/2026. HEAD `dad4aec92c0658f81d5b7a8657253fc4bd6da9b9` (`schema v4`); branch `agents/update-logo-footer-login-bypass` (1 commit à frente de `origin/agents/update-logo-footer-login-bypass`).

## Sandbox Asaas — chave reconhecida; acesso bloqueado pela lista de IPs

- [x] Confirmado que o prefixo local da chave é do **Sandbox** (`$aact_hmlg_`); não adicionar `/` ao valor. O `$` inicial foi escapado no `.env.local` para o Next.js carregar o valor literal corretamente. O arquivo é local e não versionado; nenhum segredo foi registrado neste checklist.
- [ ] Liberar o IP de saída deste ambiente de teste na lista de IPs permitidos para a chave Sandbox. Uma consulta autenticada somente de leitura ao endpoint de status respondeu HTTP 403, código `not_allowed_ip`; portanto a chave não foi validada com sucesso pelo endpoint. Após permitir o IP de saída correto, repetir a consulta e confirmar autenticação. Não ampliar a lista sem necessidade.
- [x] `ASAAS_ENV=sandbox` e uma única `ASAAS_WEBHOOK_TOKEN` estão presentes localmente. O token correspondente no painel Sandbox ainda precisa ser confirmado.
- [x] `SUPABASE_SERVICE_ROLE_KEY` está presente localmente, sem inspeção/divulgação do valor. Sua presença não confirma acesso ou schema no banco remoto.
- [ ] No painel Asaas Sandbox, confirmar URL pública `/api/asaas/webhook`, token correspondente e eventos de checkout, pagamento e assinatura.
- [ ] Depois de substituir a chave e confirmar o webhook, testar checkout/pagamento, renovação, atraso, cancelamento e reativação, conferindo plano e limites após cada evento.

## Supabase e implantação

- [x] A URL Supabase do `.env.local` coincide com o bundle público atual, e os claims das chaves anon e service role correspondem ao projeto da URL. Local e deploy usam o mesmo projeto Supabase.
- [ ] Corrigir a resolução de schema no projeto correto. Consultas read-only sem linhas para `profiles_public`, `listings_public` e `subscriptions` retornaram HTTP 404 / `PGRST205`. Não foram consultadas linhas de usuários. Verificar se `schema_v4.sql` foi aplicado, se as relações estão expostas à Data API e se o cache PostgREST está atualizado.
- [ ] Revisar RLS e grants no SQL Editor. Em banco novo, aplicar `schema.sql` antes de `schema_v4.sql`; em banco legado, aplicar somente a migration v4 revisada. A v4 local inclui gestão de planos/assinaturas e preservação da carência em cancelamentos. Nenhuma migration foi executada nesta revisão.
- [x] Corrigidos os marcadores de conflito de `schema_v4.sql` e reconciliadas as colunas de localização dos benefícios, seleções múltiplas de perfil e backfill de categorias com a waitlist encerrada. A migration passou em PostgreSQL 16 descartável e foi reaplicada para conferir idempotência; dados sintéticos com categoria/subcategoria legadas foram preservados e migrados. Isso não confirma nem altera o banco remoto.
- [ ] Implantar as alterações locais em Preview e validar cadastro, login, recuperação, perfil público/privado, anúncios, benefícios, checkout Sandbox e `/assinatura`. O bundle público foi consultado para comparar a URL Supabase, mas não foram feitos testes de escrita ou de conta real.
- [ ] Depois de corrigir o schema, validar perfil e publicação de anúncios autenticados e revisar logs do deploy. O redirecionamento indevido de `/perfil/{id}` já foi corrigido localmente e a regressão HTTP passou; o `PGRST205` continua impedindo confirmar o fluxo completo.

## E-mail e produção

- [ ] `RESEND_API_KEY` e `RESEND_FROM_EMAIL` estão presentes localmente. Confirmar os ambientes necessários na Vercel e validar entrega de lead; a presença local não confirma credenciais válidas nem configuração Vercel.
- [ ] Conferir SMTP de recuperação de senha em Supabase Auth separadamente do Resend da aplicação.
- [ ] Após aprovação dos testes Sandbox, configurar credenciais e webhook de produção separados e obter autorização explícita antes de qualquer cobrança real.

## Implementações locais concluídas

- [x] Corrigida a proteção de rotas para manter `/perfil` privado e `/perfil/{id}` público.
- [x] Atualizadas as URLs base da API Asaas para `https://api-sandbox.asaas.com/v3` e `https://api.asaas.com/v3`, e o link hospedado de checkout para o formato oficial.
- [x] Adicionada gestão da assinatura em `/assinatura` e cancelamento autenticado em `POST /api/asaas/cancel`. O Asaas é definido como `INACTIVE`, mantendo cobranças já emitidas; o acesso respeita período pago ou carência. O evento `SUBSCRIPTION_DELETED` não tenta buscar um recurso removido.
- [x] Checklist revisado com os resultados desta verificação; segredos não foram copiados nem registrados.

## Validação local (06/11/2026)

- `npm run lint`: passou (0 erros, 0 avisos).
- `npx tsc --noEmit`: passou (0 erros de tipagem).
- `npm run build -- --webpack`: passou com 25 rotas estáticas/dinâmicas geradas (incluindo `/assinatura`, `/planos`, `/empresas`, `/termos`, `/privacidade` e rotas de API do Asaas e Resend).
- Suíte completa `tests/*.test.mjs` com servidor local ativo: 113/113 testes passaram.
- `supabase/schema_v4.sql`: livre de marcadores de conflito de merge, mantendo contratos de planos, benefícios (`location_city`, `location_state`), perfil multi-categoria/subcategoria e encerramento da waitlist.
- O runtime local carrega `ASAAS_API_KEY` com prefixo Sandbox e sem `/` no valor. A consulta de status retorna `403 not_allowed_ip` devido à restrição de IP de saída na chave Sandbox.
- Nenhum segredo, chave ou token foi exposto, copiado ou registrado em logs ou arquivos versionados.
- Nenhuma migration em banco de produção, cobrança real ou alteração não autorizada foi executada.

## Referências

- `README.md` — configuração local e verificações.
- `docs/superpowers/specs/2026-11-01-planos-cobertura-asaas-design.md` — decisões de planos e cobrança.
- `docs/superpowers/plans/2026-11-01-integracao-asaas.md` — contrato e testes Asaas.
- `docs/superpowers/plans/2026-11-01-resend-app-email.md` — Resend e verificações manuais de e-mail.
- [Asaas: ambientes da API](https://docs.asaas.com/reference/about-this-doc).
- [Supabase: códigos de erro PostgREST](https://supabase.com/docs/guides/api/rest/postgrest-error-codes).
