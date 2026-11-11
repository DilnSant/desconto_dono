# Desconto do Dono

Plataforma para empreendedores encontrarem empresas, publicarem anúncios e benefícios e conversarem pelo chat. O cadastro é imediato e gratuito para qualquer município brasileiro.

## Planos vigentes

| Plano | Mensalidade | Anúncios novos ativos | Municípios | Segmentos / subcategorias | Fotos adicionais |
|---|---:|---:|---:|---:|---:|
| Gratuito | R$ 0 | 1 | 1 | 1 / 3 | 0 |
| Essencial | R$ 39,90 | 3 | 3 ou atuação nacional não presencial | 2 / 6 | 3 |
| Profissional | R$ 59,90 | 5 | 5 ou atuação nacional não presencial | 3 / 10 | 10 |

Os preços e limites têm uma única fonte em `src/lib/plans/entitlements.ts` e são apresentados em `/planos`. A página oferece checkout mensal hospedado pelo Asaas para cobrança recorrente no cartão de crédito. A assinatura só altera o plano após confirmação autenticada do Asaas; o retorno do navegador não concede benefícios. Não existe plano Premium, cobrança anual, benefício de vídeo ou selo de verificação vendido por plano.

O cadastro e o login estão disponíveis na página inicial. A lista de espera foi encerrada: os dados históricos são preservados e `/api/waitlist` responde `410 Gone`.

## Stack e estrutura

- Next.js 16 App Router, React 19, TypeScript e Tailwind CSS 4.
- Supabase Auth, PostgreSQL, RLS e Storage.
- Asaas para checkout e assinaturas; Resend para notificações de novos leads.
- Código da aplicação em `src/`, testes de contrato em `tests/` e documentação de decisões/execução em `docs/superpowers/`.

## Configuração local

Requer Node.js 20 ou superior. Instale dependências com `npm ci`, copie `.env.local.example` para `.env.local` e informe as credenciais do projeto Supabase. Configure as chaves Asaas de sandbox no servidor para testar assinaturas; nunca use prefixo `NEXT_PUBLIC_` nas chaves privadas.

Em um banco novo, execute `supabase/schema.sql` e depois `supabase/schema_v4.sql`, `supabase/schema_v5.sql` e `supabase/schema_v6.sql`, nessa ordem, no SQL Editor do Supabase. Para atualizar um banco legado, revise e aplique `supabase/schema_v4.sql`, `supabase/schema_v5.sql` e `supabase/schema_v6.sql`. As migrations v5 e v6 são idempotentes; a v6 mantém Comercial e Residencial como opções padrão nos segmentos existentes e adiciona horários configuráveis no perfil.

```bash
npm run dev
```

## Variáveis de ambiente

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: conexão pública Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: acesso administrativo, somente no servidor.
- `NEXT_PUBLIC_APP_URL`: origem pública da aplicação.
- `ASAAS_API_KEY`, `ASAAS_ENV` (`sandbox` ou `production`) e `ASAAS_WEBHOOK_TOKEN`: cobrança, somente no servidor.
- `RESEND_API_KEY` e `RESEND_FROM_EMAIL`: notificação transacional de leads.

As chaves Asaas reais começam com `$`; no `.env.local`, escape esse caractere inicial como `\$`. No painel da Vercel, informe o valor sem escape.

Configure no Asaas o webhook `/api/asaas/webhook` com o token compartilhado e os eventos de checkout, pagamento e assinatura. Sandbox e produção têm configurações e credenciais independentes. Valide checkout pago, renovação, atraso e cancelamento em sandbox antes de ativar produção. A integração de e-mail do Supabase Auth é configurada no painel Supabase e não usa o remetente Resend da aplicação.

Para confirmação de e-mail, configure no Supabase Auth o Site URL `https://www.descontododono.com.br` e permita o callback `https://www.descontododono.com.br/auth/callback` (e `http://localhost:3000/auth/callback` para desenvolvimento). O template de confirmação deve usar `{{ .ConfirmationURL }}` ou construir o link com `{{ .RedirectTo }}`. O cadastro e o reenvio de confirmação usam o callback da origem atual.

## Verificações locais

```bash
node --experimental-strip-types --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

Alguns testes de páginas e autenticação fazem requisições HTTP e precisam da aplicação em execução (`npm run dev` ou `npm start`). Testes locais de Asaas não confirmam uma cobrança real; isso depende das credenciais e do webhook de sandbox.

## Catálogo de municípios

A busca usa um snapshot dos municípios oficiais do IBGE incluído no projeto, então o cadastro não depende da disponibilidade da API externa. Para atualizar o snapshot, execute `node scripts/update-municipality-catalog.mjs`; o script valida códigos, cobertura das 27 UFs e quantidade de registros antes de gravar o arquivo.
