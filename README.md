# 🏷️ Desconto do Dono

> **O Clube de Descontos e Diretório de Empresas que mais cresce no Brasil.**
> Conecte empreendedores verificados, resgate ofertas exclusivas e amplie sua visibilidade com vídeo marketing — tudo em uma única plataforma B2B/B2C.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 Sobre o Projeto

**Desconto do Dono** é uma plataforma comunitária de empreendedores brasileiros que une:

- 🏪 **Diretório B2B/B2C** — Encontre empresas verificadas em 14 segmentos de negócio
- 🎬 **Vídeo Marketing** — Perfis com embed de vídeo (YouTube/Vimeo) para planos Profissional e Premium
- 🏷️ **Clube de Descontos** — Ofertas e benefícios exclusivos entre membros
- 📥 **Geração de Leads** — Visitantes resgatam descontos e deixam contato via modal "Resgatar Desconto"
- 💬 **Mensagens Privadas** — Chat em tempo real entre empreendedores (Supabase Realtime)
- 🏆 **Visibilidade por Planos** — Gratuito → Essencial → Profissional → Premium

### Modelo de Lançamento por Comunidade

1. Empreendedores se cadastram na **lista de espera**
2. Um **ranking em tempo real** exibe as cidades com mais inscritos
3. Ao atingir o número mínimo, a cidade é **"aberta"**
4. Membros acessam o **diretório completo**, **clube de benefícios**, **chat** e seus **leads**

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 16 (App Router) + TypeScript 5 |
| **Estilização** | Tailwind CSS v4 |
| **Ícones** | Lucide React |
| **Backend / Auth** | Supabase (PostgreSQL 15 + RLS + Realtime) |
| **Middleware** | `middleware.ts` (proxy de autenticação) |
| **Deploy** | Vercel (Edge + Serverless) |

---

## 💡 Planos de Visibilidade

| Plano | Contatos Públicos | Vídeo Embed | Borda Destaque | Badge Azul |
|-------|:-----------------:|:-----------:|:--------------:|:----------:|
| **Gratuito** | ❌ | ❌ | ❌ | ❌ |
| **Essencial** | ✅ | ❌ | ❌ | ❌ |
| **Profissional** | ✅ | ✅ (1 vídeo) | ✅ Dourada | ❌ |
| **Premium** | ✅ | ✅ (3 vídeos) | ✅ Dourada | ✅ |

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                       # Landing page + lista de espera
│   ├── dashboard/page.tsx             # Feed de anúncios pós-login
│   ├── login/page.tsx                 # Autenticação
│   ├── cadastro/page.tsx              # Registro
│   ├── beneficios/
│   │   ├── page.tsx                   # Clube de benefícios / descontos
│   │   └── novo/page.tsx              # Criar benefício
│   ├── anuncio/
│   │   ├── novo/page.tsx              # Criar anúncio
│   │   └── [id]/
│   │       ├── page.tsx               # Ver anúncio + botão "Resgatar Desconto"
│   │       └── AnuncioClientActions.tsx  # Client wrapper do LeadCaptureModal
│   ├── perfil/
│   │   ├── page.tsx                   # Editar perfil
│   │   └── [id]/page.tsx              # Perfil público com lógica de planos
│   ├── categoria/[slug]/page.tsx      # Anúncios por categoria
│   ├── categorias/page.tsx            # Todas as categorias
│   ├── mensagens/page.tsx             # Chat em tempo real
│   └── api/
│       └── waitlist/route.ts          # API da lista de espera
├── components/
│   ├── landing/LandingPage.tsx        # Landing page completa
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── Footer.tsx                 # Inclui SponsorBanner (Método Develops)
│   ├── categories/CategoryGrid.tsx
│   ├── listings/ListingCard.tsx       # Card com borda Premium/Profissional
│   ├── profile/ProfileCard.tsx        # Card com lógica de planos
│   ├── chat/ChatWindow.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── ui/
│       ├── LeadCaptureModal.tsx       # Modal "Resgatar Desconto" → INSERT leads
│       ├── SponsorBanner.tsx          # Banner patrocinado (Método Develops)
│       ├── Skeletons.tsx
│       └── Toast.tsx
└── lib/
    ├── supabase/
    │   ├── client.ts                  # Cliente browser tipado
    │   ├── server.ts                  # Cliente SSR (com cookies)
    │   ├── db.ts                      # Helper sem tipagem (client-side)
    │   └── server-db.ts               # Helper sem tipagem (server-side)
    ├── constants/categories.ts        # 14 categorias + mapa de cores
    └── utils/helpers.ts               # formatCurrency, formatDate, getInitials...
```

---

## 🗄️ Banco de Dados (Supabase v3)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis dos membros — inclui `plan_type`, redes sociais, vídeo |
| `waitlist` | Lista de espera pré-abertura de cidades |
| `categories` | 14 categorias de negócios com slug e cor |
| `subcategories` | Subcategorias por categoria |
| `listings` | Anúncios do diretório — inclui `video_embed_url` |
| `benefits` | Clube de benefícios / descontos |
| `leads` | Leads capturados via "Resgatar Desconto" (RLS: só o dono lê) |
| `messages` | Mensageria privada em tempo real |
| `conversations` | Agrupamento de conversas |

### View

| View | Descrição |
|------|-----------|
| `cities_ranking` | Ranking de cidades por número de inscritos na waitlist |

---

## 🏷️ Categorias (14 segmentos)

| Categoria | Cor | Subcategorias |
|-----------|-----|---------------|
| Beleza | pink | Depilação, Estética, Massagem, Salões |
| Comércios | blue | Calçados, Construção, Móveis, Vestuário |
| Desenvolvedores | slate | Apps, Sites, Sistemas, CRMs |
| Diversos | neutral | Outros segmentos |
| Ensino | cyan | Escolas, Cursos, Faculdades |
| Financeiras | teal | Contabilidade, Empréstimos, Investimentos |
| Gastronomia | orange | Bares, Padarias, Pizzarias, Restaurantes |
| Hotelaria | purple | Camping, Hotéis, Motéis, Pousadas |
| Lazer | green | Academias, Clubes, Esportes, Lan House |
| Marketing | rose | Campanhas, Design de Marcas, Social Media |
| Prestação de Serviços | indigo | Residenciais e Comerciais |
| Saúde | red | Clínicas, Dentistas, Farmácias, Médicos |
| Serviços para seu Pet | yellow | Clínicas Pet, Pet Shop, Agropecuárias |
| Veículos | gray | Acessórios, Elétrica, Mecânica, Pneus |

---

## 🚀 Setup Local

### 1. Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com) (plano gratuito funciona)
- Git

### 2. Clonar o Repositório

```bash
git clone https://github.com/<SEU_USUARIO>/desconto-do-dono.git
cd desconto-do-dono
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Configurar Variáveis de Ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_AQUI
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Configurar o Banco de Dados

**Para banco novo** — execute o schema completo:
```
supabase/schema.sql → SQL Editor do Supabase
```

**Para banco existente (Ordem & Negócios)** — execute apenas a migração:
```
supabase/schema_v3.sql → SQL Editor do Supabase
```

> ⚠️ **Storage Buckets necessários** (todos públicos): `avatars`, `covers`, `listings`

### 6. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Segurança e LGPD

- **RLS (Row Level Security)** habilitado em **todas** as tabelas
- Leads: apenas o dono do anúncio lê seus próprios leads
- **Sem coleta de dados políticos, religiosos ou partidários**
- Aceite obrigatório da **Carta de Princípios** no cadastro
- Direito à exclusão total conforme **Lei 13.709/2018 (LGPD)**
- Autenticação via Supabase Auth (OAuth Google + E-mail/Senha)

---

## 📦 Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy de produção
vercel --prod
```

> Configure as variáveis de ambiente no painel Vercel antes do deploy.

---

## ✅ Funcionalidades

- [x] Landing page com lista de espera e ranking de cidades em tempo real
- [x] Carta de Princípios + aceite LGPD
- [x] Cadastro / Login (E-mail + Google OAuth)
- [x] Dashboard com diretório de empresas filtrado por categoria
- [x] 14 categorias + accordion de subcategorias
- [x] Anúncios com upload de imagem e embed de vídeo (Profissional/Premium)
- [x] Botão "Resgatar Desconto" com modal de captura de lead
- [x] Tabela `leads` com RLS — apenas o anunciante vê seus leads
- [x] Clube de benefícios (criar e resgatar descontos)
- [x] Chat privado em tempo real (Supabase Realtime)
- [x] Perfil público com lógica de visibilidade por plano
- [x] Borda dourada e badge de plano nos cards (Profissional/Premium)
- [x] Banner patrocinado (Método Develops) no feed e rodapé
- [x] Mobile-first + BottomNav para mobile
- [x] Página 404 customizada
- [x] SEO completo (metadata por página)
- [x] API de waitlist com posição na fila da cidade

---

## 🤝 Patrocinador Oficial

<a href="https://www.metododevelops.com.br" target="_blank">
  <strong>Método Develops</strong>
</a> — Desenvolvimento de aplicativos e sites profissionais para empreendedores brasileiros.

> 💡 Quer impulsionar suas vendas com um App ou Site próprio? [Conheça a Método Develops](https://www.metododevelops.com.br)

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: descrição da feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT © 2024 Desconto do Dono
