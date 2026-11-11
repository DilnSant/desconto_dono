# Pendências para deixar o projeto pronto

Revisado em 08/11/2026. Base da revisão: HEAD `1f5ac6e` (`fix: valida selecao de municipios e atualiza checklist`); branch `main` antes das correções descritas abaixo.

## Sandbox Asaas — configuração manual pendente

- [x] Confirmado que o prefixo local da chave é do **Sandbox** (`$aact_hmlg_`); não adicionar `/` ao valor. O `$` inicial foi escapado no `.env.local` para o Next.js carregar o valor literal corretamente. O arquivo é local e não versionado; nenhum segredo foi registrado neste checklist.
- [x] Liberar o IP de saída deste ambiente de teste na lista de IPs permitidos para a chave Sandbox. ✅ IP `2.24.67.84` removido em 07/11/2026. Confirmado HTTP 200 na API Sandbox após remoção.
- [x] `ASAAS_ENV=sandbox` e uma única `ASAAS_WEBHOOK_TOKEN` estão presentes localmente. O token correspondente no painel Sandbox ainda precisa ser confirmado.
- [x] `SUPABASE_SERVICE_ROLE_KEY` está presente localmente, sem inspeção/divulgação do valor. Sua presença não confirma acesso ou schema no banco remoto.
- [ ] No painel Asaas Sandbox, confirmar URL pública `/api/asaas/webhook`, token correspondente e eventos de checkout, pagamento e assinatura. A configuração do painel não foi verificada nesta revisão.
- [ ] Depois de substituir a chave e confirmar o webhook, testar checkout/pagamento, renovação, atraso, cancelamento e reativação, conferindo plano e limites após cada evento.

## Supabase e implantação

- [x] A URL Supabase do `.env.local` coincide com o bundle público atual, e os claims das chaves anon e service role correspondem ao projeto da URL. Local e deploy usam o mesmo projeto Supabase.
- [x] Corrigir a resolução de schema no projeto correto. `reset_and_rebuild.sql` executado com sucesso em 07/11/2026 — schema base + v4 recriado, perfis restaurados de `auth.users`. Erros `42703 is_active`, `22P02 plan_type_enum` e `42703 is_premium` resolvidos definitivamente.
- [ ] Revisar RLS e grants no SQL Editor. Em banco novo, aplicar `schema.sql` antes de `schema_v4.sql`; em banco legado, aplicar somente a migration v4 revisada. A v4 local inclui gestão de planos/assinaturas e preservação da carência em cancelamentos. A v4 não foi aplicada nesta revisão.
- [x] Adicionadas subcategorias profissionais à categoria “Prestação de Serviços” no seed e na migration idempotente `schema_v5.sql`. As 17 novas opções foram inseridas no Supabase remoto e a leitura com chave pública confirmou 19 opções disponíveis.
- [x] O Supabase Auth está com confirmação por e-mail ativa (`mailer_autoconfirm=false`) e aceitou o callback de produção `/auth/callback` no preflight de verificação (HTTP 303 usando token inválido de diagnóstico). O cadastro e o reenvio usam esse mesmo endereço.
- [ ] Conferir no painel Supabase se o template de confirmação personalizado usa `{{ .ConfirmationURL }}` ou `{{ .RedirectTo }}`. O conteúdo do template hospedado não está disponível pela API pública.
- [x] Corrigidos os marcadores de conflito de `schema_v4.sql` e reconciliadas as colunas de localização dos benefícios, seleções múltiplas de perfil e backfill de categorias com a waitlist encerrada. A migration passou em PostgreSQL 16 descartável e foi reaplicada para conferir idempotência; dados sintéticos com categoria/subcategoria legadas foram preservados e migrados. Isso não confirma nem altera o banco remoto.
- [ ] Implantar as alterações locais em Preview e validar cadastro, login, recuperação, perfil público/privado, anúncios, benefícios, checkout Sandbox e `/assinatura`. O bundle público foi consultado para comparar a URL Supabase, mas não foram feitos testes de escrita ou de conta real.
- [ ] Depois de corrigir o schema, validar perfil e publicação de anúncios autenticados e revisar logs do deploy. O redirecionamento indevido de `/perfil/{id}` foi corrigido localmente e a regressão HTTP passou em 07/11; o erro `PGRST205` registrado naquele teste ainda precisa ser revalidado após a implantação.

## E-mail e produção

- [x] Presença local de `RESEND_API_KEY` e `RESEND_FROM_EMAIL` confirmada em 08/11 sem ler seus valores.
- [ ] Confirmar as variáveis nos ambientes da Vercel e validar entrega de lead; presença local não confirma credenciais válidas nem configuração Vercel.
- [ ] Conferir SMTP de recuperação de senha em Supabase Auth separadamente do Resend da aplicação.
- [ ] Após aprovação dos testes Sandbox, configurar credenciais e webhook de produção separados e obter autorização explícita antes de qualquer cobrança real.

## Implementações locais concluídas

- [x] Corrigida a proteção de rotas para manter `/perfil` privado e `/perfil/{id}` público.
- [x] Atualizadas as URLs base da API Asaas para `https://api-sandbox.asaas.com/v3` e `https://api.asaas.com/v3`, e o link hospedado de checkout para o formato oficial.
- [x] Adicionada gestão da assinatura em `/assinatura` e cancelamento autenticado em `POST /api/asaas/cancel`. O Asaas é definido como `INACTIVE`, mantendo cobranças já emitidas; o acesso respeita período pago ou carência. O evento `SUBSCRIPTION_DELETED` não tenta buscar um recurso removido.
- [x] Eliminada a dependência de rede do IBGE durante cadastro: a API local consulta um catálogo versionado com os 5.571 municípios oficiais e 27 UFs. O script `node scripts/update-municipality-catalog.mjs` atualiza o arquivo usando a API oficial e valida integridade antes de gravar.
- [x] Corrigido o favicon: removido o ícone gerado com a letra “D”; o arquivo de convenção `src/app/icon.png` usa exatamente `public/images/favicon.nova.png`.
- [x] Substituído o favicon pela imagem `public/images/favicon.nova.png` fornecida pelo usuário.
- [x] O cadastro envia a confirmação para `/auth/callback`, informa que o usuário deve confirmar o e-mail, e o login oferece reenvio do link para contas pendentes.
- [x] Corrigida a seta duplicada do seletor de segmento e ampliadas as subcategorias concretas de Prestação de Serviços.
- [x] Todas as imagens `next/image` que usavam `fill` agora informam dimensões intrínsecas, mantendo a proporção visual e os tamanhos responsivos.
- [x] Corrigido o layout da mensagem de erro da busca de municípios para telas estreitas.
- [x] Checklist revisado com os resultados desta verificação; segredos não foram copiados nem registrados.

## Validação local (08/11/2026)

- `npm run lint`: passou, 0 erros e 0 avisos; dependências omitidas no efeito de `MunicipalitySelect` estão documentadas como intencionais.
- `npx tsc --noEmit`: passou, 0 erros de tipagem.
- `npm run build -- --webpack`: build de produção passou. O build padrão Turbopack falhou no sandbox ao criar subprocesso/vincular uma porta (`Operation not permitted`); o build Webpack documentado pelo Next 16 concluiu sem erro.
- Suíte `tests/*.test.mjs`: **121/121 passaram**, incluindo páginas HTTP e favicon no servidor de produção local.
- Corrigido o caso de busca de municípios sem termo e sem UF, que estava carregando desnecessariamente o catálogo; testes de municípios passaram.
- Contrato de favicon atualizado para validar o recurso de ícone servido pela convenção do Next e comparar seus bytes com a imagem oficial da marca.
- Busca de municípios testada sem rede e com o catálogo oficial completo (5.571 registros / 27 UFs). API local respondeu HTTP 200 para SC no build de produção; a página `/cadastro` serviu 5 imagens, todas com largura e altura, e o contrato do favicon foi atualizado para `/icon.png` com o PNG oficial fornecido.
- Cadastro, callback de autenticação, reenvio do e-mail, seta única, 17 subcategorias profissionais e bytes do novo `favicon.nova.png` cobertos por testes; a consulta pública do Supabase confirmou 19 subcategorias no segmento e o preflight do Auth aceitou a URL final de callback.
- `.env.local`: presença verificada para variáveis Supabase, Asaas e Resend sem exibir nem copiar valores. Isso não valida credenciais, webhooks nem configurações de produção.
- Git antes desta revisão: `main` sincronizada com `origin/main`, sem commits à frente nem alterações locais.
- Nenhuma migração remota, alteração de conta/dados, cobrança ou ativação de produção foi executada nesta revisão.

## Validação local histórica (07/11/2026)

- `npm run lint`: passou (0 erros, 0 avisos).
- `npx tsc --noEmit`: passou (0 erros de tipagem).
- Suíte `tests/*.test.mjs` (107 testes independentes de servidor): **107/107 passaram**.
- `supabase/schema.sql`: tornado idempotente — `ADD COLUMN IF NOT EXISTS` para `is_active`, `is_premium`, `plan_type`; `DROP IF EXISTS` em todas as policies e triggers.
- `supabase/reset_and_rebuild.sql`: criado, testado em PostgreSQL 16 descartável (banco vazio e banco com usuário preexistente em `auth.users`), e executado com sucesso no Supabase remoto.
- Asaas Sandbox: IP `2.24.67.84` removido da lista de IPs autorizados. Confirmado HTTP 200 na API `/v3/customers`.
- Git: branch `agents/update-logo-footer-login-bypass` integrada a `main`. Push para `origin/main` realizado. HEAD: `6e657de`.
- Nenhum segredo, chave ou token foi exposto, copiado ou registrado em logs ou arquivos versionados.
- Nenhuma cobrança real, migração não autorizada ou ativação de produção foi executada.

## Revisão de copywriting e atratividade da oferta (10/11/2026)

- [x] Preenchida e versionada a planilha `Planilha_Oferta_Desconto_do_Dono.xlsx` com os 5 passos, pacotes de preços e versões da oferta do Desconto do Dono em `.superpowers/implantar/`.
- [x] Documento estratégico de identidade, proposta de valor, moat e análise Porter versionado em `.superpowers/implantar/PROJETO_DESCONTO_DO_DONO.md`.
- [x] Implantação do Método Vitrine do Dono e nova redação de alta conversão nas páginas de entrada (`LandingPage.tsx`, `/cadastro`, `/planos` e metadata em `/page.tsx`): 100% da receita para o lojista, sem comissão por pedido, busca em 5.571 municípios do IBGE e contato direto no WhatsApp.
- [x] Reconciliação completa com `origin/main` realizada; conflitos de mesclagem resolvidos preservando as melhorias de handoff e integridade dos testes.
- [x] Validações locais executadas: `npx tsc --noEmit` passou com 0 erros; `npm run lint` passou com 0 avisos.
- [x] Push dos commits pendentes para `origin/main` concluído com sucesso.

## Revisão após publicação (08/11/2026)

- [x] Publicadas em `origin/main` as correções independentes da migration v6: `e70f9d7` (checkout, diretório e respostas da galeria), `518eed0` (verificação de sessão antes do cliente administrativo) e `5698ef6` (confirmação do cadastro e preenchimento do login). A verificação Vercel do último commit concluiu com sucesso.
- [x] Produção: `/empresas?stateCode=SC` retorna HTTP 200 com a sidebar de filtros; `/api/profile/gallery` sem sessão retorna HTTP 401 em JSON; `/api/municipios?state=SC` retorna HTTP 200 com 20 municípios.
- [x] Cadastro: o texto informa que o link pode atrasar ou falhar, oferece reenvio pelo callback da aplicação e permite abrir o login com e-mail e senha preenchidos por uma passagem em memória (consumo único, expiração em 60 segundos, sem URL ou armazenamento persistente). O bundle publicado contém o novo fluxo.
- [x] Testes locais: `tests/*.test.mjs` **135/135**, `npm run lint`, `npx tsc --noEmit` e `npm run build -- --webpack` passaram no clone limpo do `main`.
- [x] Revalidação da produção: Auth `/settings` respondeu HTTP 200 com `mailer_autoconfirm=false`; a view pública `profiles_public` respondeu com contagem exata zero. `/empresas?stateCode=SC` entrega a sidebar e o estado vazio, confirmando que a conta de teste não está elegível para aparecer.
- [ ] A entrega do e-mail de confirmação continua sem validação: `mailer_autoconfirm=false`, mas os logs e o SMTP do Supabase Auth não são acessíveis pela API pública. Conferir e configurar SMTP no painel Supabase; Resend da aplicação é separado.
- [ ] O checkout foi publicado, mas não foi concluído um checkout autenticado de sandbox. Rotacionar a chave Sandbox e o token do webhook que apareceram em output de diagnóstico anterior, atualizar variáveis locais/Vercel, conferir webhook no painel Asaas e testar o ciclo completo antes de produção.
- [ ] Restaurar, revisar e versionar `supabase/schema_v6.sql` antes de aplicá-la no Supabase. A migration e o código local associado ficaram no worktree do volume externo, que está desmontado; não estão neste `main` clonado. As colunas de público/horários ainda não existem remotamente, então essas opções não foram publicadas.
- [ ] A auditoria remota anterior encontrou o perfil de teste confirmado, porém inativo e sem nome comercial, categoria ou área; `profiles_public` estava vazio. O diretório publicado mostra estado vazio corretamente. Completar o perfil após a migration para que a empresa apareça.
- [ ] Confirmar `NEXT_PUBLIC_APP_URL`/`VERCEL_URL`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN` nos ambientes da Vercel e revisar os logs do checkout; não há acesso administrativo da Vercel neste ambiente.

## Referências

- `README.md` — configuração local e verificações.
- `docs/superpowers/specs/2026-11-01-planos-cobertura-asaas-design.md` — decisões de planos e cobrança.
- `docs/superpowers/plans/2026-11-01-integracao-asaas.md` — contrato e testes Asaas.
- `docs/superpowers/plans/2026-11-01-resend-app-email.md` — Resend e verificações manuais de e-mail.
- [Asaas: ambientes da API](https://docs.asaas.com/reference/about-this-doc).
- [Supabase: códigos de erro PostgREST](https://supabase.com/docs/guides/api/rest/postgrest-error-codes).
