# Desconto do Dono — Documento de Identidade, Estrutura e Estratégia do Projeto

---

## 1. Visão Geral e Identificação do Projeto

### 1.1 O que é o Desconto do Dono
O **Desconto do Dono** é uma plataforma e clube de negócios que conecta diretamente empresários, comerciantes e profissionais autônomos aos consumidores locais e a outros empreendedores em todo o território nacional.

Diferente de marketplaces e plataformas genéricas de cupons, o Desconto do Dono foi concebido com foco na **humanização do comércio local**, na **autenticidade das conexões** e na **geração de networking e negócios confiáveis**. A plataforma destaca a figura do próprio dono do estabelecimento — sua história, seus vídeos diretos, sua reputação e seus benefícios reais —, criando uma relação de confiança mútua e eliminando intermediários predatórios.

---

## 2. Missão, Visão e Proposta de Valor

### 2.1 Missão
> **"Fortalecer quem move o Brasil: conectar empreendedores autênticos a consumidores conscientes e a outros empresários, gerando conexões, contatos e contratos altamente confiáveis através da proximidade, da verdade e de vantagens exclusivas."**

A missão é dar voz e protagonismo ao empresário brasileiro, valorizando quem assume o risco de empreender e oferecendo ao consumidor local uma experiência direta, sem taxas abusivas e com benefícios reais.

### 2.2 Visão
> **"Tornar-se o ecossistema de negócios locais e de networking empresarial de maior autoridade e autenticidade do Brasil, estabelecendo um padrão de mercado protegido por barreiras competitivas reais (Moat), tecnologia inteligente e uma comunidade engajada e leal."**

### 2.3 Proposta de Valor Única (PVP)
1. **Autenticidade e Humanização:** O consumidor não compra apenas um produto ou serviço com desconto; ele conhece quem está por trás do negócio por meio de vídeos gravados pelo próprio dono.
2. **Conexões e Contratos Seguros (B2B e B2C):** Um ambiente onde empresários encontram outros empresários com histórico verificado para fechar parcerias, fornecimento e contratações mútuas.
3. **Liberdade Comercial e Sustentabilidade:** Ao contrário de aplicativos de entrega ou marketplaces de cupons que retêm comissões pesadas, o lojista tem controle total sobre suas ofertas e mantém contato direto com seus clientes (via WhatsApp, telefone ou balcão).
4. **Abrangência Geográfica com Raiz Local:** Presença nacional estruturada município a município pelo catálogo oficial do IBGE, permitindo busca hiperlocal ou atuação nacional conforme o modelo de cada negócio.

---

## 3. Design, Identidade Visual e Experiência do Usuário (UI/UX)

### 3.1 Posicionamento Visual e Tom da Marca
- **Autoridade e Sobriedade:** Cores sólidas (tons escuros como Slate e Gray-950, combinados com o verde escuro brasileiro e dourado institucional), transmitindo seriedade, patriotismo econômico e segurança institucional.
- **Foco em Conexões Reais:** Tipografia limpa, moderna (Inter) e sem distrações visuais excessivas.
- **Transparência Absoluta:** O usuário sempre sabe com quem está falando, onde fica o estabelecimento e quais são as condições exatas da oferta.

### 3.2 Estrutura da Interface e Componentes Principais
- **Header e Identidade Global:** Logomarca oficial circular e transparente (`logo.DDD2.jpeg`), navegação rápida entre Diretório de Empresas, Benefícios, Planos, Anúncios e Área do Membro.
- **Seção "Conheça quem já faz parte" (Empresas Participantes):**
  - **Título:** *Conheça quem já faz parte — Empresas que acreditam em conexões reais com seus clientes.*
  - **Cards de Empresas:** Apresentação em grid responsivo (3 colunas no desktop, lista empilhada no mobile), exibindo logotipo, razão/nome fantasia, município/UF, segmentos de atuação e botão com link direto para assistir ao vídeo do proprietário.
  - **Ação Global:** Botão "Ver todas as empresas" direcionando para o catálogo de busca e filtros.
- **Cards de Planos e Assinatura:**
  - Layout em 3 colunas no desktop e empilhado no mobile.
  - Chamadas claras para ação com checkout direto e seguro integrado ao Asaas.
  - Destaque visual para o plano mais vantajoso.
- **Tooltips Informativos e Educacionais (🛈 ou ❓):**
  - Textos de auxílio ao passar o mouse ou tocar em termos específicos para eliminar dúvidas e aumentar a confiança do assinante:
    - *Atualização de vídeo 🛈:* "Você pode solicitar um novo vídeo promocional após o período indicado no seu plano."
    - *Selo de empresa verificada 🛈:* "Concedido apenas a empresas com dados cadastrais validados e histórico positivo na plataforma."
    - *Analytics avançado 🛈:* "Relatórios com visualizações, cliques no botão de contato e tempo médio de permanência."
    - *Publicação permanente 🛈:* "Enquanto o plano estiver ativo, o anúncio e o vídeo permanecem visíveis sem interrupções."
- **Rodapé Institucional:**
  - Área imponente (`bg-gray-950`) com texto de apoio à economia real brasileira, links de conformidade (Termos de Uso, Privacidade, LGPD) e chancela de desenvolvimento.

---

## 4. Estrutura de Planos e Modelo de Negócios

O modelo de monetização do Desconto do Dono é baseado em **assinatura recorrente (SaaS/Clube)** com cobrança automatizada via Asaas (cartão de crédito ou Pix recorrente), complementado por um nível gratuito de entrada para facilitar a adesão rápida de novos empreendedores.

### 4.1 Níveis de Planos

| Recursos | Gratuito | Essencial | Profissional | Premium |
|---|:---:|:---:|:---:|:---:|
| **Mensalidade** | R$ 0 | R$ 39,90 / mês | R$ 69,90 / mês | R$ 99,90 / mês |
| **Opção Anual** | — | R$ 358,80 / ano | R$ 598,80 / ano | R$ 958,80 / ano |
| **Vídeos Promocionais** | — | 1 vídeo de até 30s | 2 vídeos de até 30s | 3 vídeos de até 30s |
| **Atualização do Vídeo** | — | A cada 12 meses | A cada 6 meses | A cada 3 meses |
| **Anúncios Ativos** | 1 anúncio | Até 3 anúncios | Até 5 anúncios | Ilimitados / Destaque |
| **Canais de Contato** | Internos | WhatsApp, Endereço, Fone | Redes sociais e Site inclusos | Todos os canais + WhatsApp 24h |
| **Galeria de Fotos** | Não | Básica (3 fotos) | Expandida (10 fotos) | Completa (alta resolução) |
| **Destaque na Plataforma** | Padrão | Categoria | Destaque na Categoria | Destaque na Home + Topo |
| **Selo de Verificação** | Não | Não | Selo de Membro | **Selo Empresa Verificada** |
| **Relatórios e Analytics** | Não | Não | Relatório mensal simples | Analytics completo (views, cliques, tempo) |
| **Suporte** | Central de Ajuda | Suporte por E-mail | WhatsApp Prioritário | WhatsApp Dedicado 24h |

### 4.2 Recursos Avançados em Implementação Contínua
- **Relatórios Mensais em PDF:** Exportação de métricas do perfil do empresário contendo número de visualizações, contatos via WhatsApp gerados e conversão de cupons.
- **Badge Visual "Empresa Verificada":** Destaque gráfico exclusivo para membros que validam formalmente seus dados cadastrais (CNPJ, endereço físico e contrato social).

---

## 5. Análise Estratégica Competitiva (As Cinco Forças de Porter)

Documentação fundamentada na análise de mercado para blindar o Desconto do Dono contra movimentos da concorrência e assegurar relevância econômica duradoura.

### 5.1 Ameaça de Novos Entrantes
- **Cenário:** Barreiras tecnológicas para criar um diretório simples são baixas. O desafio real reside na retenção de lojistas, engajamento e liquidez de ofertas locais.
- **Oportunidades Ocultas:**
  - Posicionamento em autenticidade via vídeo do dono: estabelece um vínculo emocional que clones de software não conseguem copiar.
  - Criação de um ecossistema com vantagens reais, experiências locais e benefícios exclusivos.
- **Ameaças Invisíveis:**
  - Grandes plataformas (como iFood, Mercado Livre ou marketplaces de bancos) testando programas similares.
  - Desistência inicial por falta de tração de audiência.
- **Ações Estratégicas:**
  - Criar comunidade fechada e forte antes de escalar geograficamente.
  - Programa de recomendação "Empresário Convida Empresário" para crescer com custo de aquisição (CAC) baixo.
- **KPIs de Controle:** Taxa de adesão de estabelecimentos, tempo médio de engajamento e Net Promoter Score (NPS).

### 5.2 Poder de Barganha dos Fornecedores (Os Donos dos Negócios)
- **Cenário:** Os próprios lojistas e donos de empresas são os "fornecedores" da plataforma. Se eles não virem retorno prático ou acharem o processo trabalhoso, deixam de ofertar benefícios.
- **Oportunidades Ocultas:**
  - Flexibilidade total para o lojista definir descontos de acordo com sua margem e sazonalidade.
  - Integração com programas e ferramentas que o lojista já utiliza (WhatsApp, redes sociais).
- **Ameaças Invisíveis:**
  - Empresários gravarem vídeos de baixa qualidade ou hesitarem em aparecer.
  - Redução súbita de benefícios por pressão no caixa das empresas parceiras.
- **Ações Estratégicas:**
  - Fornecer suporte, roteiros práticos e kits rápidos de orientação para gravação de vídeos de alto impacto.
  - Consultorias e materiais rápidos de marketing para os lojistas parceiros.
- **KPIs de Controle:** Taxa de retenção/renovação de parceiros, engajamento nos vídeos e conversão de visitas em mensagens/leads.

### 5.3 Poder de Barganha dos Clientes (Consumidores e Membros)
- **Cenário:** O consumidor moderno é bombardeado por promoções, anúncios digitais e aplicativos de cupom.
- **Oportunidades Ocultas:**
  - Hiperpersonalização de ofertas com recomendação baseada em geolocalização e histórico de interesse.
  - Gamificação: desbloqueio de vantagens exclusivas conforme frequência de uso e compras no comércio local.
- **Ameaças Invisíveis:**
  - Percepção de pouca diferença se a plataforma parecer apenas "mais uma lista telefônica de cupons".
- **Ações Estratégicas:**
  - Testes contínuos de conversão dos formatos de desconto (porcentagem vs. valor fixo vs. brinde do dono).
  - Conteúdo educacional que evidencia a importância de fortalecer o comércio local e o consumo consciente.
- **KPIs de Controle:** Taxa de retorno de clientes (recorrência), tempo de uso na plataforma e resgates de cupons via modal.

### 5.4 Ameaça de Produtos Substitutos
- **Cenário:** Programas de cashback bancário (Méliuz, cartões de crédito), cupons automáticos de navegadores e promoções diretas no Instagram/Google.
- **Oportunidades Ocultas:**
  - Ofertas atreladas a experiências reais (ex.: ser atendido pelo proprietário, degustações VIP, prioridade de mesa) impossíveis de serem entregues por cashback impessoal.
  - Modelo híbrido com acesso a rodadas de negócios e clubes de compras privadas.
- **Ameaças Invisíveis:**
  - Preferência de parte do público por retorno financeiro imediato (cashback puro) em vez de benefícios de relacionamento.
- **Ações Estratégicas:**
  - Reforçar que o Desconto do Dono é uma rede de relacionamento e prestígio, não apenas uma lista de pechinchas.
- **KPIs de Controle:** Taxa de conversão de experiências VIP vs. cupons simples e proporção de assinantes pagantes.

### 5.5 Rivalidade entre Concorrentes Existentes
- **Cenário:** Concorrência fragmentada entre guias comerciais locais, portais de cupons e anúncios de redes sociais.
- **Oportunidades Ocultas:**
  - Posicionamento único como comunidade de donos de negócios patriotas e dedicados, criando senso de pertencimento e orgulho de participar.
  - Parcerias estratégicas com formadores de opinião locais e associações comerciais.
- **Ameaças Invisíveis:**
  - Plataformas consolidadas lançando áreas de "vídeos curtos locais".
- **Ações Estratégicas:**
  - Construir barreiras de relacionamento difíceis de transpor; quem é parceiro antigo tem histórico e avaliações consolidadas.
- **KPIs de Controle:** Taxa de renovação contratual, engajamento orgânico e índice de compartilhamento comunitário.

---

## 6. Estratégia de Moat (Fosso Defensivo e Diferenciais Incomparáveis)

O "Moat" (fosso estratégico) é o conjunto de vantagens estruturais que tornam o Desconto do Dono difícil de ser copiado por concorrentes que disponham apenas de capital ou tecnologia genérica.

```
       ┌────────────────────────────────────────────────────────┐
       │             FOSSO DEFENSIVO (MOAT SÓLIDO)              │
       └────────────────────────────────────────────────────────┘
                                    │
    ┌──────────────┬────────────────┼──────────────┬─────────────┐
    ▼              ▼                ▼              ▼             ▼
1. Parcerias   2. Tecnologia   3. Comunidade   4. Realidade   5. Dados &
   Exclusivas     Proprietária    Forte e         Aumentada      Cashback
   & Benefícios   de Recomen-     Exclusiva       (Imersão       Inteligente
   VIP            dação IA                        Local)
```

### 6.1 Pilar 1: Rede de Parcerias Exclusivas e Benefícios Incomparáveis
- **Conceito:** Acordos de vantagens que só existem dentro da plataforma. O empresário oferece uma condição exclusiva que nenhum outro portal ou rede social possui.
- **Execução:**
  - Acordos de exclusividade com comércios âncora de cada município.
  - Categoria de benefícios "Acesso VIP" reservada a membros cadastrados.
- **Métricas:** Taxa de retenção de lojistas, percentual de usuários que utilizam vantagens exclusivas.

### 6.2 Pilar 2: Tecnologia Proprietária para Personalização de Ofertas
- **Conceito:** Mecanismos de busca e recomendação inteligente que aprendem os interesses, localização e hábitos de consumo de cada membro para entregar a melhor oferta no momento certo.
- **Execução:**
  - Algoritmo de correspondência entre o perfil do usuário e as empresas do seu raio geográfico.
  - Testes A/B automatizados para maximizar a conversão de cada anúncio e oferta.
- **Métricas:** Taxa de cliques nas ofertas recomendadas, taxa de resgate e volume de negócios gerados.

### 6.3 Pilar 3: Construção de uma Comunidade Forte e Exclusiva
- **Conceito:** Transformar usuários e empresários em membros ativos de um clube com princípios alinhados, networking de alto nível e defesa ativa da marca.
- **Execução:**
  - Canais e grupos exclusivos de comunicação para troca de experiências e parcerias entre donos de negócios.
  - Eventos fechados, encontros de networking regional e votações da comunidade para eleger destaques locais.
- **Métricas:** Engajamento nos canais internos, índice de indicações boca a boca (K-Factor) e retenção anual.

### 6.4 Pilar 4: Experiências Imersivas e Realidade Aumentada (RA Local)
- **Conceito:** Aplicação gradual de recursos visuais inovadores onde o consumidor pode visualizar estabelecimentos parceiros e ofertas ativas ao caminhar pelas ruas comerciais.
- **Execução:**
  - Mapas interativos e filtros de proximidade imediata.
  - Gamificação com desbloqueio de vantagens especiais ao realizar check-in presencial no estabelecimento.
- **Métricas:** Engajamento na busca interativa, volume de visitas físicas geradas e adesão dos lojistas ao modelo interativo.

### 6.5 Pilar 5: Fidelização Inteligente e Cashback Baseado em Dados
- **Conceito:** Um ecossistema de recompensas baseado na frequência e consistência do relacionamento do cliente com os comércios participantes.
- **Execução:**
  - Pontuação unificada ou cashback inteligente em parceria com comerciantes locais.
  - Benefícios progressivos: clientes mais fiéis recebem condições especiais diretamente dos donos.
- **Métricas:** Frequência de compras recorrentes, taxa de retorno após a primeira experiência e LTV (Life Time Value) do usuário.

---

## 7. Estrutura Técnica e Arquitetura do Sistema

Para dar sustentação a essa estratégia de negócio e garantir escalabilidade, segurança e confiabilidade, o projeto adota uma arquitetura full-stack moderna:

### 7.1 Componentes de Engenharia
- **Front-end:** Next.js 16 (App Router), React 19, TypeScript e Tailwind CSS 4. Interfaces ultra-rápidas com renderização otimizada para dispositivos móveis.
- **Banco de Dados e Segurança:** Supabase PostgreSQL com **Row Level Security (RLS)** rigoroso em todas as tabelas. Views de segurança (`profiles_public` e `listings_public`) com barreira de segurança ativa para impedir vazamento de dados privados.
- **Cobrança e Assinaturas:** Asaas Gateway (API v3), processando pagamentos recorrentes de cartões de crédito e Pix, com webhooks idempotentes protegidos por token de segurança.
- **Comunicação Transacional:** Resend API para entrega de notificações críticas de leads aos donos dos anúncios.
- **Geolocalização:** Integração direta e em cache com o catálogo oficial de municípios do IBGE, garantindo consistência territorial sem depender de preenchimentos manuais imprecisos.

---

## 8. Resumo Executivo das Diretrizes

1. **O Dono é a Marca:** Todo o design e a experiência colocam a pessoa do empresário no centro, transformando transações frias em relacionamentos duradouros.
2. **Monetização Justa e Sustentável:** O plano Gratuito garante presença; os planos Essencial, Profissional e Premium destravam ferramentas de escala, autoridade, vídeos e alcance geográfico ampliado.
3. **Segurança e Idempotência:** Cada funcionalidade técnica é testada e blindada contra falhas ou inconsistências de dados.
4. **Crescimento em Camadas:** O lançamento foca na experiência imediata de busca, publicação e contato; as camadas de gamificação, IA e experiências imersivas são acopladas sobre uma base estável e validada.
