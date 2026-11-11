# Pendências para deixar o projeto pronto

Revisado em 08/11/2026. Base da revisão: HEAD `1f5ac6e` (`fix: valida selecao de municipios e atualiza checklist`); branch `main` antes das correções descritas abaixo.

## Sandbox Asaas — configuração manual pendente

- [x] Confirmado que o prefixo local da chave é do **Sandbox** (`$aact_hmlg_`); não adicionar `/` ao valor. O `$` inicial foi escapado no `.env.local` para o Next.js carregar o valor literal corretamente. O arquivo é local e não versionado; nenhum segredo foi registrado neste checklist.
- [x] Liberar o IP de saída deste ambiente de teste na lista de IPs permitidos para a chave Sandbox. ✅ IP `2.24.67.84` removido em 07/11/2026. Confirmado HTTP 200 na API Sandbox após remoção.
- [x] `ASAAS_ENV=sandbox` e uma única `ASAAS_WEBHOOK_TOKEN` estão presentes localmente. O token correspondente no painel Sandbox ainda precisa ser confirmado.
- [x] `SUPABASE_SERVICE_ROLE_KEY` está presente localmente, sem inspeção/divulgação do valor. Sua presença não confirma acesso ou schema no banco remoto.
- [ ] Rotacionar a chave Sandbox do Asaas e o token do webhook: uma consulta local de diagnóstico imprimiu esses dois valores no output da ferramenta. Não foram reutilizados depois disso; atualizar também as variáveis locais e do deploy antes do próximo teste Sandbox.
- [ ] No painel Asaas Sandbox, confirmar URL pública `/api/asaas/webhook`, token correspondente e eventos de checkout, pagamento e assinatura. A configuração do painel não foi verificada nesta revisão.
- [ ] Depois de substituir a chave e confirmar o webhook, testar checkout/pagamento, renovação, atraso, cancelamento e reativação, conferindo plano e limites após cada evento.

## Supabase e implantação

- [ ] Aplicar `supabase/schema_v6.sql` depois das migrations v4 e v5 no banco Supabase. A v6 adiciona tipo de atendimento por segmento e horário semanal no perfil; até essa aplicação, a versão publicada não pode ler/gravar os novos campos.
- [x] A URL Supabase do `.env.local` coincide com o bundle público atual, e os claims das chaves anon e service role correspondem ao projeto da URL. Local e deploy usam o mesmo projeto Supabase.
- [x] Corrigir a resolução de schema no projeto correto. `reset_and_rebuild.sql` executado com sucesso em 07/11/2026 — schema base + v4 recriado, perfis restaurados de `auth.users`. Erros `42703 is_active`, `22P02 plan_type_enum` e `42703 is_premium` resolvidos definitivamente.
- [ ] Revisar RLS e grants no SQL Editor. Em banco novo, aplicar `schema.sql` antes de `schema_v4.sql`; em banco legado, aplicar somente a migration v4 revisada. A v4 local inclui gestão de planos/assinaturas e preservação da carência em cancelamentos. A v4 não foi aplicada nesta revisão.
- [x] Adicionadas subcategorias profissionais à categoria “Prestação de Serviços” no seed e na migration idempotente `schema_v5.sql`. As 17 novas opções foram inseridas no Supabase remoto e a leitura com chave pública confirmou 19 opções disponíveis.
- [x] O Supabase Auth está com confirmação por e-mail ativa (`mailer_autoconfirm=false`) e aceitou o callback de produção `/auth/callback` no preflight de verificação (HTTP 303 usando token inválido de diagnóstico). O cadastro e o reenvio usam esse mesmo endereço.
- [ ] Conferir no painel Supabase se o template de confirmação personalizado usa `{{ .ConfirmationURL }}` ou `{{ .RedirectTo }}`. O conteúdo do template hospedado não está disponível pela API pública.
- [ ] Conferir os logs de Auth e a configuração SMTP no painel Supabase. A API pública confirma que a confirmação de e-mail está ativa, mas não expõe o SMTP; não há token de Management API neste ambiente para ler os logs ou alterar essa configuração.
- [x] Corrigidos os marcadores de conflito de `schema_v4.sql` e reconciliadas as colunas de localização dos benefícios, seleções múltiplas de perfil e backfill de categorias com a waitlist encerrada. A migration passou em PostgreSQL 16 descartável e foi reaplicada para conferir idempotência; dados sintéticos com categoria/subcategoria legadas foram preservados e migrados. Isso não confirma nem altera o banco remoto.
- [ ] Implantar as alterações locais em Preview e validar cadastro, login, recuperação, perfil público/privado, anúncios, benefícios, checkout Sandbox e `/assinatura`. O bundle público foi consultado para comparar a URL Supabase, mas não foram feitos testes de escrita ou de conta real.
- [ ] Depois de corrigir o schema, validar perfil e publicação de anúncios autenticados e revisar logs do deploy. O redirecionamento indevido de `/perfil/{id}` foi corrigido localmente e a regressão HTTP passou em 07/11; o erro `PGRST205` registrado naquele teste ainda precisa ser revalidado após a implantação.

## E-mail e produção

- [x] Presença local de `RESEND_API_KEY` e `RESEND_FROM_EMAIL` confirmada em 08/11 sem ler seus valores.
- [ ] Substituir e validar a chave Resend local: a consulta somente de leitura a `GET /domains` retornou HTTP 401. Essa chave é da aplicação e não configura o SMTP de confirmação do Supabase Auth.
- [ ] Confirmar as variáveis nos ambientes da Vercel e validar entrega de lead; presença local não confirma configuração Vercel.
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
- [x] Adicionada opção por segmento para atender empresas (comercial), residencial ou ambos no cadastro e em Meu Perfil. Cadastro com confirmação de e-mail preserva as seleções e conclui o salvamento no callback autenticado. Horários semanais são configurados somente em Meu Perfil e exibidos no perfil público; perfis existentes recebem as duas opções como padrão. A migration `schema_v6.sql` ainda precisa ser aplicada no Supabase.
- [x] Corrigido o layout da mensagem de erro da busca de municípios para telas estreitas.
- [x] Checklist revisado com os resultados desta verificação. Nenhum segredo foi adicionado a arquivos do repositório; a consulta Asaas descrita acima apareceu em output de diagnóstico e exige rotação da chave Sandbox e do token de webhook.

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

## Revisão complementar (08/11/2026)

- Implementadas opções por segmento para atendimento Comercial, Residencial ou ambos no cadastro e em Meu Perfil. Horários semanais são editáveis somente em Meu Perfil e aparecem no perfil público. O callback autenticado conclui as seleções quando a confirmação de e-mail impede o salvamento imediato.
- Corrigido o cadastro com sessão imediata para chamar `save_profile_coverage_with_audiences`; a RPC anterior recebia as opções, mas não as gravava. Testes agora cobrem ambos os caminhos de cadastro, edição do perfil e validação/serialização do horário semanal.
- `npx tsc --noEmit`, `npm run lint` e `npm run build -- --webpack`: passaram após essas alterações.
- Criada `supabase/schema_v6.sql`, idempotente e aditiva. Ela ainda precisa ser executada no Supabase depois da v4 e da v5, antes de publicar o código; comportamento conectado ao banco remoto não foi validado.
- Git: branch `main`, HEAD `aead80a0857a6c3680bbb8cc0513a4c6e02bb685`; alterações desta revisão estão locais e ainda não foram commitadas.

## Revisão de cadastro, busca, galeria e checkout (08/11/2026)

- [x] Corrigido o cadastro com sessão imediata para gravar `serviceAudiences` pela RPC `save_profile_coverage_with_audiences`; no cadastro confirmado por e-mail, o callback já usa essa RPC. Comercial, Residencial ou ambos seguem configuráveis em cada segmento. O horário semanal continua disponível apenas em Meu Perfil e é validado, salvo e mostrado no perfil público.
- [x] Quando o cadastro aguarda confirmação, a tela informa que a entrega depende do provedor, oferece reenvio direto pelo mesmo callback e permite abrir o login com o e-mail preenchido via `sessionStorage`. A senha é apagada do estado do cadastro e nunca é colocada em URL ou armazenamento persistente.
- [x] O cadastro ativa o perfil público somente depois de confirmar o e-mail e salvar dados, segmentos e área de atuação; salvamentos completos em Meu Perfil também ativam o perfil. A consulta remota atual encontrou 1 perfil Auth confirmado e com termos aceitos, mas inativo e sem nome comercial, categoria ou área de atendimento. O metadata temporário do cadastro já foi removido, então não há dados suficientes para publicá-lo automaticamente; `profiles_public` retorna zero perfis. O usuário precisa completar os dados no perfil após a migration v6 e o deploy.
- [x] A busca por UF considera `profiles.state` apenas para perfis legados com `service_area_state_codes` vazio; perfis com cobertura normalizada em outra UF não entram indevidamente pelo estado base. A busca por município continua restrita ao código IBGE. Build local de produção serviu `/empresas?stateCode=SC` com HTTP 200, UF selecionada, 14 segmentos e sem erro de consulta. Em 08/11, o site publicado também respondeu HTTP 200 em `/empresas?stateCode=SC` com os filtros de UF, categoria e município; `/api/municipios?state=SC` respondeu HTTP 200 com 20 municípios. Não há perfil elegível nos dados remotos.
- [x] A rota da galeria agora devolve JSON mesmo em falhas de inicialização, trata sessão ausente como HTTP 401 e o cliente tolera respostas vazias ou não JSON. Build local de produção confirmou HTTP 401 JSON para requisição sem sessão.
- [x] O checkout usa `NEXT_PUBLIC_APP_URL` ou o host confiável `VERCEL_URL`; a origem da requisição só é aceita em loopback local. Uma URL `localhost` configurada localmente é ignorada em requisições de produção. A configuração é validada antes de reservar assinatura, e sem origem confiável retorna HTTP 503 sem deixar assinatura `PENDING`. O log Asaas registra estágio/status/códigos sem credenciais ou dados do cliente. Não foi criado checkout Sandbox depois da necessidade de rotacionar a chave.
- [x] Testes direcionados para fallback de UF, origem de callbacks e confirmação/reenvio passaram; suíte `tests/*.test.mjs`: **139/139**; `npm run lint`: passou.
- [x] Após os ajustes locais: `npx tsc --noEmit`, `npm run build -- --webpack` e `git diff --check` passaram. O servidor local de produção respondeu HTTP 401 JSON para `/api/profile/gallery` sem sessão e HTTP 200 para `/empresas?stateCode=SC`, com sidebar e filtros de UF/categoria/município.
- [x] Consultas somente de leitura em 08/11: Auth retorna `mailer_autoconfirm=false`; as colunas da v6 ainda não existem (`42703`); há 1 perfil, mas ele está inativo, sem nome comercial, categoria ou área e `profiles_public` retorna 0 perfis. A conta Auth correspondente está confirmada e aceitou os termos, mas não há dados de segmento/área recuperáveis em `pending_profile_setup`.
- [x] Tabela `subscriptions` e colunas usadas pelo checkout estão acessíveis no banco remoto. A chave Resend local continua rejeitada (HTTP 401). O status do SMTP do Supabase e das variáveis Vercel não pode ser consultado via APIs públicas; as CLIs Supabase/Vercel e `psql` não estão instalados/autenticados neste ambiente.
- [x] Auditoria HTTP da produção em 08/11: `/empresas?stateCode=SC` responde HTTP 200 e mostra os filtros atuais em faixa horizontal; o sidebar responsivo ainda não foi publicado. `/api/profile/gallery` sem sessão ainda responde HTTP 500 com corpo não JSON; a correção local responde HTTP 401 JSON. `/api/municipios?state=SC` responde HTTP 200 com 20 municípios.
- [ ] Publicar as correções locais de galeria, diretório e checkout. As mudanças de perfil que dependem da v6 precisam aguardar a migration; o worktree ainda contém alterações não commitadas.
- [ ] Confirmar `NEXT_PUBLIC_APP_URL` ou `VERCEL_URL` no ambiente Vercel para habilitar o checkout publicado; sem uma origem confiável a rota responde HTTP 503 antes de criar uma assinatura pendente.
- [ ] Aplicar `supabase/schema_v6.sql` ao banco conectado depois das migrations v4 e v5. Este ambiente não tem token Supabase de Management API, CLI autenticada nem cliente PostgreSQL; as alterações locais que usam os novos campos/RPCs ainda dependem dessa migration.
- [ ] Corrigir/validar a entrega da confirmação no Supabase Auth após revisar logs e SMTP no painel. `mailer_autoconfirm=false` confirma que a validação é exigida, mas a API pública não expõe o provedor SMTP nem o log de entrega. A chave Resend rejeitada é da aplicação e não prova o estado do SMTP Auth. O provedor de e-mail padrão do Supabase só entrega a endereços da equipe e tem limite atual de 2 mensagens/hora; verificar o SMTP customizado no projeto antes de atribuir a falha a essa limitação.

## Referências

- `README.md` — configuração local e verificações.
- `docs/superpowers/specs/2026-11-01-planos-cobertura-asaas-design.md` — decisões de planos e cobrança.
- `docs/superpowers/plans/2026-11-01-integracao-asaas.md` — contrato e testes Asaas.
- `docs/superpowers/plans/2026-11-01-resend-app-email.md` — Resend e verificações manuais de e-mail.
- [Asaas: ambientes da API](https://docs.asaas.com/reference/about-this-doc).
- [Supabase: códigos de erro PostgREST](https://supabase.com/docs/guides/api/rest/postgrest-error-codes).
