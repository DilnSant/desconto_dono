# Mega update de UX e perfil (proposta original)

> Status: o desenho original abaixo propôs uma lista de espera. Essa decisão foi
> substituída: os cadastros são imediatos, a API da lista de espera retorna
> `410 Gone`, os registros existentes são preservados e notificações Resend de
> leads continuam ativas. O desenho comercial vigente está em
> `2026-11-01-planos-cobertura-asaas-design.md`.

## Contexto e objetivo

Registrar a proposta inicial de melhorias de identidade visual, edição de perfil
com múltiplas áreas de atuação, localização de benefícios e lista de espera. O
domínio oficial permanece `https://www.descontododono.com.br`.

O repositório já possui telas e fluxos para esses casos, mas o perfil usa IDs
estáticos, a rota da lista de espera oculta erros e a política atual permite
leitura pública de dados pessoais da tabela `waitlist`.

## Abordagens consideradas

1. **Entrega única em três frentes (selecionada):** identidade/benefícios,
   perfil/dados relacionais e waitlist/RLS/e-mail. Mantém compatibilidade e
   entrega o pedido completo num único commit de implementação.
2. **Duas entregas:** UI e benefícios agora; perfil e waitlist depois. Reduz o
   risco por etapa, mas deixa funcionalidades pedidas incompletas e exige outra
   publicação.
3. **Evitar alterações relacionais:** gravar seleções como texto/JSON sem
   respeitar os UUIDs de `categories` e `subcategories`. Evita parte do SQL
   imediato, mas enfraquece integridade e aumenta a incompatibilidade com o
   esquema existente.

## Decisões aprovadas

- Fazer uma entrega coordenada nos três eixos.
- A proposta de confirmação Resend da lista de espera foi retirada; somente
  notificações de leads permanecem ativas.
- Usar IDs UUID reais do Supabase para áreas de atuação e manter os campos
  legados `category_id` e `subcategory_id` sincronizados com as escolhas
  principais.
- Aplicar as alterações de banco por um script SQL aditivo e idempotente; não
  há migrations automatizadas no repositório.

## Arquitetura e comportamento

### Identidade e navegação

- Fixar `metadataBase` no domínio oficial e auditar todos os `redirectTo` do
  Supabase, incluindo OAuth e redefinição de senha, para usarem URLs absolutas
  do domínio oficial.
- Aumentar a logo do cabeçalho em aproximadamente 30% e exibir, à direita,
  “Desconto do Dono” e o subtítulo “Vantagens reais. Negócios locais.”
- Incluir “Gratuito” no CTA “Anunciar”.
- Substituir o badge de mensagens fixo por uma contagem real de mensagens não
  lidas do usuário autenticado. Não mostrar badge quando a contagem for zero ou
  não puder ser obtida.
- No rodapé, alinhar horizontalmente a logo e o texto institucional fornecido,
  mantendo quebra responsiva e alinhamento vertical:
  “Conectamos empreendedores de direita para fortalecer negócios locais e
  transformar boas parcerias em contratos confiáveis. Nossa plataforma aproxima
  quem produz, gera empregos e movimenta a economia brasileira”.

### Perfil e benefícios

- Carregar o perfil do usuário autenticado e as categorias/subcategorias reais
  do Supabase ao abrir a tela. Estados de erro de consulta/salvamento devem ser
  apresentados ao usuário, não convertidos em formulário vazio.
- Permitir várias categorias e subcategorias. Um rádio marca a categoria
  principal e outro marca uma subcategoria pertencente a essa categoria.
- Persistir `category_ids UUID[]`, `subcategory_ids UUID[]`,
  `primary_category_id UUID` e `primary_subcategory_id UUID`. Sincronizar os
  campos legados individuais com os IDs principais para preservar consumidores
  existentes. Inicializar as novas colunas com os valores legados existentes
  para que perfis atuais não percam suas seleções após a atualização.
- Em `benefits`, adicionar `location_city` e `location_state` opcionais,
  permitir editá-los na publicação e exibi-los quando presentes.
- Marcar os benefícios locais fictícios como exemplos e desabilitar somente
  seus botões “Resgatar Desconto”, mantendo ativos os benefícios reais.

### Waitlist, segurança e e-mail

- Encerrar a lista de espera: novas chamadas a `GET` e `POST /api/waitlist`
  retornam `410 Gone`, sem consultar, inserir ou expor registros.
- Preservar a tabela e os registros antigos, mas remover as políticas públicas
  de INSERT e SELECT e revogar as permissões públicas correspondentes.
- Remover formulários, links e confirmações Resend da lista de espera.
- Manter notificações de leads pela aplicação, com `RESEND_API_KEY` e
  `RESEND_FROM_EMAIL`; o destinatário continua derivado do e-mail público do
  perfil da empresa.

## Persistência e compatibilidade

Criar `supabase/schema_v4.sql` com comandos idempotentes para:

1. adicionar as quatro colunas de seleção múltipla/principal a `profiles`;
   preencher as novas seleções a partir de `category_id` e `subcategory_id`
   legados quando ainda estiverem vazias;
2. adicionar cidade e estado a `benefits`;
3. remover as políticas públicas de INSERT e SELECT da waitlist e revogar as
   permissões públicas correspondentes;
4. preservar a view agregada de ranking para leitura pública.

O script deve ser aplicado no SQL Editor do Supabase antes de publicar a
implementação, pois o código dependerá das novas colunas. As alterações da
tabela `benefits` aplicam-se ao modelo existente; não há tabela `offers` no
esquema utilizado pela aplicação.

## Critérios de aceitação

1. Metadados e todos os callbacks `redirectTo` auditados apontam para
   `https://www.descontododono.com.br`.
2. Cabeçalho e rodapé exibem o conteúdo solicitado com layout responsivo; o
   selo de mensagens nunca usa contagem fixa.
3. Perfil abre com valores atuais, salva os campos existentes e salva listas e
   principais; trocar a categoria principal não deixa uma subcategoria
   principal incompatível.
4. Exemplos fictícios não podem abrir o modal de resgate; um benefício real
   continua resgatável.
5. Benefício aceita e exibe cidade/UF quando informadas.
6. Waitlist retorna `410 Gone` em GET e POST, preserva registros antigos e não
   permite inserção ou leitura pública.
7. TypeScript, lint e build de produção passam; testes direcionados cobrem os
   estados de sucesso, duplicidade e falha de e-mail sem depender de uma chave
   real do Resend.

## Verificação e limites

- Validar o script SQL por revisão estática e testar contra um banco local se
  houver ambiente configurado. Não executar mudanças no banco de produção sem
  autorização e credenciais explícitas.
- Executar testes direcionados, lint, `npx tsc --noEmit` e `npm run build`.
- O envio real não pode ser verificado enquanto as variáveis do Resend não
  estiverem configuradas; a implementação e seus testes serão verificáveis sem
  essas credenciais.
- Preservar alterações locais preexistentes e incluir no commit somente os
  arquivos desta entrega.
