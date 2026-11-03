# Planos, cobertura e Asaas — Fase 1

## Status e objetivo

Especificação arquitetural para preparar o Desconto do Dono para divulgação,
com cadastro gratuito imediato, regras de plano verificáveis, cobertura
geográfica confiável, diretório público seguro e cobrança recorrente pelo
Asaas. O foco desta entrega é uma fundação executável, sem prometer benefícios
que ainda não existem.

Esta especificação incorpora as decisões aprovadas na conversa e as propostas
dos documentos em `.superpowers/implantar`. Ela substitui decisões anteriores
que dependiam de lista de espera, arrays de categorias ou planos sem cobrança
integrada. A confirmação de e-mail da lista de espera deixa de fazer sentido;
notificações de leads via Resend permanecem uma funcionalidade separada.

## Análise do projeto e dos documentos

O projeto ainda não implementa integralmente os modelos comerciais e
estratégicos:

- Há rótulos Gratuito, Essencial, Profissional e Premium, mas não há cobrança
  Asaas funcional; os benefícios de nível superior não são cobrados nem
  aplicados de forma consistente.
- O perfil persiste uma cidade/UF e uma categoria/subcategoria, sem relações
  para múltiplas áreas de atuação e segmentos.
- Não existe diretório público `/empresas`.
- A política atual permite leitura pública de todas as colunas de `profiles`,
  incluindo dados privados. A página pública também consulta `select('*')` e
  exibe e-mail de contato sem aplicar o limite do plano.
- O cadastro de anúncios não aplica um limite confiável por plano no servidor
  ou banco.
- O perfil não tem galeria de fotos da empresa; há referências e renderização
  de vídeo em perfis, anúncios e benefícios.
- Há dados de demonstração e mensagens de lista de espera ainda visíveis em
  algumas telas. Conteúdo público precisa vir de dados reais ou de estados
  vazios explícitos.

Os documentos estratégicos apresentam oportunidades de parcerias/aquisição,
retenção/inteligência operacional, comunidades, fidelidade/gamificação,
cashback, IA e realidade aumentada. Elas ficam organizadas em fases posteriores
para não lançar simulações nem depender de parceiros ou dados ainda
inexistentes.

## Abordagem escolhida

Implementar agora uma fundação modular: cadastro/cobertura, limites reais dos
planos, diretório e privacidade, galeria, Asaas e ajustes de comunicação.
Parcerias, retenção e iniciativas avançadas ficam em projetos separados,
dependentes de validação e capacidade. Não lançar cobrança manual nem executar
todas as propostas estratégicas numa única entrega.

## Planos e benefícios

| Plano | Preço mensal | Anúncios novos ativos | Áreas de atuação | Segmentos e subcategorias | Fotos adicionais no perfil |
|---|---:|---:|---|---|---:|
| Gratuito | R$ 0 | 1 | 1 município | 1 segmento, até 3 subcategorias | 0 |
| Essencial | R$ 39,90 | 3 | Até 3 municípios ou nacional para operação digital/não presencial | Até 2 segmentos e 6 subcategorias no total | Até 3 |
| Profissional | R$ 59,90 | 5 | Até 5 municípios ou nacional para operação digital/não presencial | Até 3 segmentos e 10 subcategorias no total | Até 10 |

Todos os planos permitem criar conta e conversar pelo chat. O anúncio pode
conter uma imagem do produto/serviço em qualquer plano; a cota de fotos acima
refere-se à galeria/vitrine do perfil da empresa, além da logomarca. A capa,
quando usada, conta como uma das fotos adicionais. Vídeos não fazem parte do
produto.

Essencial e Profissional permitem contatos públicos. Apenas contatos
explicitamente cadastrados para divulgação (`email_public` e WhatsApp público)
podem aparecer, e somente enquanto o plano efetivo permitir. E-mail de login e
WhatsApp privado nunca são campos públicos.

Atuação nacional é uma escolha exclusiva dos planos pagos, exige declaração de
que o atendimento é digital ou não presencial e não implica presença física em
todo o Brasil. A declaração poderá ser moderada. Anúncios mantêm seu próprio
município e não se tornam nacionais pela abrangência do perfil.

O selo de empresa verificada depende de comprovação e processo independente;
nunca é vendido nem concedido pelo nível do plano. Não oferecer plano Premium,
anual, destaque, analytics, suporte 24h, alterações ilimitadas ou benefícios
não implementados. “Grátis”, “Fixo” e “Negociável” descrevem o preço do item
anunciado, não uma cobrança da plataforma.

### Anúncios existentes na transição

Na aplicação da migration, anúncios que já estiverem ativos serão marcados
como legados e permanecerão ativos, preservados e isentos dos novos limites.
Os limites de 1/3/5 contam apenas anúncios ativos criados após o lançamento.
Editar ou reativar um anúncio antigo não cria uma nova vaga; anúncios que
estavam inativos na transição não recebem isenção. Essa exceção de transição é
deliberada e não se aplica a anúncios novos.

Anúncios permanecem públicos enquanto ativos, até o titular desativá-los ou
removê-los, ou a moderação intervir. Não haverá expiração automática por plano.
Ao mudar de nível, antes do fim do período pago o titular poderá escolher quais
anúncios novos manter ativos, respeitando a cota do plano de destino (3 no
Essencial, 1 no Gratuito). Se não escolher, permanecem ativos os anúncios novos
mais recentemente atualizados dentro da cota; os excedentes são preservados
inativos. Anúncios legados isentos permanecem ativos. O sistema não apagará
anúncios por causa de cancelamento.

## Cadastro, localização e segmentos

- Cadastro Gratuito continua imediato e aberto para qualquer município.
- Seleção de município usa busca/autocomplete baseado na lista oficial do IBGE,
  persistindo código IBGE, nome e UF. A lista deve ser consultada/cacheada no
  servidor, sem enviar dados pessoais ao IBGE. Falha de consulta deve ser
  apresentada com opção de tentar novamente; não aceitar texto livre como
  substituto de município oficial.
- A cidade principal existente continua sendo a sede/base. No cadastro, ela
  também inicia a primeira área de atuação para evitar exigir duas escolhas
  iguais; o usuário poderá alterá-las separadamente depois.
- As áreas de atuação serão relações próprias, com município IBGE ou escopo
  nacional mutuamente exclusivo. Os limites serão aplicados no servidor/banco.
- Segmentos e subcategorias serão relações normalizadas com UUIDs reais. Cada
  subcategoria deverá pertencer a um segmento selecionado. Os campos legados
  `category_id` e `subcategory_id` continuarão sincronizados com a seleção
  principal para compatibilidade.
- Dados legados de cidade, categoria e subcategoria serão preservados. Só
  valores correspondentes sem ambiguidade à lista oficial serão migrados para
  um código IBGE; demais perfis poderão selecionar novamente uma cidade válida
  ao editar, sem perder a sede antiga.

## Fotos e limites de uso

- `avatar_url` continua sendo a logomarca, disponível em todos os planos.
- Capa e galeria compõem a cota de fotos adicionais do perfil: 0/3/10,
  respectivamente. Imagens existentes são preservadas; itens acima da cota
  efetiva ficam salvos e não públicos até o plano permitir sua reativação.
- A galeria usa registros próprios ligados ao perfil e ao caminho no Storage,
  com ordenação definida pelo titular. Upload, exclusão e ativação devem
  verificar propriedade e cota no servidor/banco, não somente na interface.
- O bucket de capas/galeria é privado. O servidor só gera URLs temporárias para
  imagens ativas dentro da cota efetiva; o bucket de logomarcas permanece
  público. URLs antigas de capa continuam armazenadas, mas a aplicação passa a
  carregá-las por URLs assinadas, sem apagar os objetos.
- O limite de anúncios conta registros ativos novos. A inserção deve ser
  validada de forma transacional para impedir ultrapassagem por chamadas
  concorrentes ou clientes modificados.

## Diretório e perfil público

Criar `/empresas` com filtros por município/UF e segmento. Exibir perfis
empresariais reais, com dados públicos mínimos e link para `/perfil/[id]`.
Perfis nacionais podem aparecer em buscas locais com identificação explícita
“Atuação nacional”; atendimentos presenciais aparecem somente nas áreas
cadastradas. O diretório e a landing nunca usam empresas, rankings, contagens
ou estatísticas fictícias. Sem resultados, exibir estado vazio e CTA real de
cadastro.

Remover a leitura pública irrestrita de `profiles`. Criar a view
`profiles_public`, executada com privilégios do proprietário, `security_barrier`
e lista explícita de campos/linhas, e conceder leitura pública somente dessa
view. A tabela base terá leitura própria para o titular; páginas públicas e
joins usarão a view e nunca `select('*')` da tabela base. `cover_url` não será
projetado; capas/galeria serão servidas por URLs assinadas e condicionadas ao
plano efetivo. A projeção pode retornar
e-mail/WhatsApp públicos apenas para Essencial/Profissional e segundo a
assinatura efetiva. Consultas e joins de listagens também serão limitados aos
campos públicos necessários. Criar também `listings_public`, com lista fixa de
campos de anúncio e filtro pelo plano efetivo no instante da consulta:
anúncios legados ativos continuam elegíveis; anúncios novos respeitam a cota
do plano e a seleção de downgrade ou o fallback dos anúncios mais recentes.

Campos de plano, assinatura, verificação e isenção de anúncio legado não podem
ser alterados por clientes. O webhook/rotas administrativas serão os únicos
responsáveis por atualizar estado de cobrança; verificação terá seu próprio
processo.

## Assinaturas Asaas

### Fluxo

1. Usuário autenticado escolhe Essencial ou Profissional e um ciclo mensal no
   painel/página de planos.
2. O servidor valida o plano e cria checkout hospedado/assinatura no Asaas;
   o browser nunca recebe a chave de API.
3. O redirecionamento de retorno não concede benefício. O plano só é ativado
   após evento de pagamento confirmado, validado pelo webhook.
4. Webhook autentica o token compartilhado, consulta/valida o estado do
   recurso no Asaas e registra eventos/processamentos de forma idempotente.
   Eventos repetidos ou fora de ordem não podem duplicar cobranças nem
   rebaixar estado incorretamente.
5. Estado da assinatura e período pago ficam em tabela própria. O perfil pode
   manter um plano derivado para leitura eficiente, protegido contra alteração
   pelo cliente.

### Regras comerciais e de estado

- Somente cobrança mensal no lançamento via checkout hospedado com cartão de
  crédito. O checkout recorrente atual do Asaas aceita cartão; Pix e boleto não
  estão disponíveis para esta recorrência. Outros meios exigem um fluxo e uma
  decisão comercial separados. Referência: [Checkout with Subscription
  (Recurring), documentação oficial do Asaas](https://docs.asaas.com/docs/checkout-with-subscription-recurring).
- Assinatura criada, mas ainda não paga, permanece Gratuito.
- O evento Asaas `CHECKOUT_PAID`, autenticado e validado pelo estado atual do
  checkout, confirma a contratação inicial. Eventos de pagamento e assinatura
  sincronizam as renovações e mudanças seguintes. URLs de retorno do browser
  nunca confirmam pagamento.
- O plano efetivo é calculado em cada leitura/mutação protegida usando o status
  e as datas atuais: cancelamento mantém o benefício até `current_period_end`;
  atraso mantém até `grace_period_ends_at`. A expiração do prazo não depende da
  chegada de um webhook posterior.
- Cancelamento interrompe cobranças futuras e preserva benefícios até o fim do
  período já pago.
- Cobrança vencida tem três dias de tolerância; depois, o plano efetivo volta
  ao Gratuito e seleções pagas excedentes ficam inativas, mas preservadas.
- Pagamento confirmado posteriormente reativa o plano compatível.
- Perfis legados sem assinatura Asaas ativa serão migrados para Gratuito,
  preservando dados e anúncios; anúncios ativos na transição recebem a isenção
  descrita acima.

### Configuração manual

Antes de habilitar cobranças reais, o proprietário deverá:

1. Criar/obter credencial de sandbox e depois credencial de produção no Asaas.
2. Configurar a URL de webhook da aplicação e o token compartilhado no painel
   Asaas.
3. Configurar na Vercel `ASAAS_API_KEY`, `ASAAS_ENV` (`sandbox` ou `production`)
   e `ASAAS_WEBHOOK_TOKEN` como variáveis server-only. O webhook usará
   `SUPABASE_SERVICE_ROLE_KEY` ou mecanismo administrativo equivalente,
   também server-only, para persistir eventos e estados. Nunca enviar essas
   credenciais pela conversa nem usar prefixo `NEXT_PUBLIC_`.
4. Aplicar a migration aditiva no SQL Editor do Supabase e conferir as políticas
   RLS.
5. Configurar os eventos de checkout, pagamento e assinatura necessários e
   validar contratação recorrente por cartão, confirmação, renovação, atraso,
   cancelamento e reativação em sandbox antes de produção.

## Lista de espera, e-mail e comunicação

Remover formulários e links da lista de espera e desativar sua API para novos
cadastros (resposta explícita `410 Gone`). Preservar registros e tabela
existentes; não apagar dados. A confirmação Resend de lista de espera fica
obsoleta. Notificações de leads existentes continuam independentes.

Atualizar textos legais e de contato para
`faleconosco@descontododono.com.br`. Remover dados demonstrativos e promessas
de crescimento/volume não verificadas da landing, cadastro, login, dashboard e
benefícios. A aplicação usa `RESEND_FROM_EMAIL` para notificações de leads;
não há configuração de remetente para uma lista de espera encerrada.

Remover do comportamento e das interfaces as referências a atualização de
vídeo, galeria de vídeos, botão “Assistir vídeo”, métricas de tempo assistido e
incorporação de vídeo em perfis/anúncios/benefícios. Colunas antigas podem
permanecer sem uso para evitar remoção destrutiva de dados.

## Migração e compatibilidade

Criar um script aditivo e idempotente `supabase/schema_v4.sql`, pois o
repositório não tem migrations automatizadas. O script deve:

1. criar relações de áreas de atuação, segmentos, subcategorias, galeria,
   assinaturas e ledger de eventos Asaas;
2. adicionar código IBGE e campos de compatibilidade necessários sem apagar
   cidade/UF, categoria/subcategoria ou anúncios existentes;
3. marcar anúncios ativos legados como isentos no instante da migration e
   anúncios inativos como não isentos;
4. migrar para Gratuito perfis sem assinatura Asaas ativa e manter os campos
   legados sincronizados com escolhas principais;
5. substituir políticas públicas amplas por acesso próprio e projeções
   públicas seguras; proteger plano, assinatura e verificação de escrita pelo
   cliente;
6. estabelecer políticas de Storage e tabelas para que titulares alterem
   somente seus próprios dados, capas/galeria permaneçam em bucket privado e a
   projeção pública exponha apenas campos aprovados;
7. suportar downgrade preservando seleções, imagens e anúncios, com excesso
   não público/inativo conforme as regras deste documento; permitir escolha
   dos anúncios que permanecem ativos e aplicar o fallback dos mais recentes
   quando o titular não escolher.

O script deve ser revisado/testado antes de aplicação manual no projeto
Supabase. Não executar mudanças em produção automaticamente.

## Fases estratégicas posteriores

1. **Fundação e monetização — Fase 1:** cadastro, planos, cobertura, diretório,
   privacidade, galeria e Asaas descritos aqui.
2. **Parcerias e aquisição:** indicação, parceiros locais e canais de
   aquisição após definir operação e responsáveis.
3. **Retenção e inteligência operacional:** comunidade/grupos, fidelidade e
   gamificação, mais relatórios internos quando houver volume e dados
   suficientes.
4. **Iniciativas avançadas:** IA, realidade aumentada e cashback/parcerias
   somente após validar viabilidade, custos, privacidade, volume e parceiros.

As fases posteriores são roadmap, não funcionalidades desta entrega e não
podem aparecer como benefícios já disponíveis nos planos.

## Critérios de aceitação

1. Cadastro novo inicia em Gratuito e aceita qualquer município válido do IBGE.
2. Limites de município, segmento, subcategoria, anúncio novo e foto são
   aplicados no servidor/banco para cada plano, incluindo tentativas de
   ultrapassagem concorrente.
3. Anúncios ativos existentes na migration permanecem ativos e isentos; novos
   anúncios respeitam 1/3/5 por plano.
4. Downgrade preserva dados e não deixa campos excedentes como públicos/ativos
   fora das regras do plano.
5. Diretório filtra por código IBGE e segmento, diferencia atuação nacional e
   não mostra perfis fictícios.
6. Consultas anônimas não acessam e-mail de login, WhatsApp privado, assinatura
   ou outros campos privados; contatos públicos só aparecem em planos pagos.
7. Plano e selo de verificação não podem ser alterados pelo cliente.
8. Checkout sem confirmação de pagamento não ativa plano; webhook inválido é
   rejeitado; evento repetido/out-of-order é idempotente.
9. Cancelamento, carência de três dias, downgrade e pagamento atrasado
   reativado seguem as regras acima.
10. Perfis exibem logo em todos os planos; galeria tem cota 0/3/10; imagens
    excedentes são preservadas e não públicas.
11. Lista de espera não aceita novo cadastro, dados antigos são preservados e
    o endpoint responde explicitamente.
12. Nenhuma tela pública depende de dados inventados nem promete benefícios
    indisponíveis; referências de vídeo foram removidas do produto ativo.
13. Testes direcionados, lint, type-check e build passam. O teste real de
    cobrança depende de credenciais e configuração manual do sandbox.

## Fora do escopo desta fase

- Implementar cashback, IA, realidade aumentada, gamificação, grupos ou
  parcerias.
- Excluir registros antigos de lista de espera, fotos, anúncios ou colunas
  legadas.
- Diagnosticar os erros de produção já relatados no perfil e publicação de
  anúncios; esse diagnóstico foi reservado para depois do commit/deploy.
- Fazer deploy ou executar migration em produção sem configuração e
  autorização explícitas.
