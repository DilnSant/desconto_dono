export interface LegalSection {
  title: string
  paragraphs: string[]
}

export const termsSections: LegalSection[] = [
  {
    title: 'Aceitação dos Termos',
    paragraphs: [
      'Ao acessar ou utilizar a plataforma Desconto do Dono, você declara que leu e aceita estes Termos de Uso. Se não concordar com alguma condição, não utilize a plataforma.',
    ],
  },
  {
    title: 'Propósito da plataforma',
    paragraphs: [
      'O Desconto do Dono é uma rede de networking e um clube de benefícios voltado a conectar empreendedores de direita e consumidores, fortalecer negócios locais e incentivar relações comerciais e contratos confiáveis.',
    ],
  },
  {
    title: 'Papel do Desconto do Dono',
    paragraphs: [
      'A plataforma funciona como uma vitrine digital para anúncios, empresas e descontos. Salvo quando uma funcionalidade indicar expressamente o contrário, o Desconto do Dono não é vendedor dos produtos ou serviços anunciados, não recebe pagamentos pelas negociações e não participa dos contratos firmados entre as partes.',
      'O contato e a negociação acontecem diretamente entre o consumidor (ou lead) e a empresa anunciante, por canais como WhatsApp, telefone ou atendimento presencial. Cabe às partes confirmar condições, preços, disponibilidade, prazos e demais detalhes antes de contratar.',
    ],
  },
  {
    title: 'Responsabilidade pelas ofertas e negociações',
    paragraphs: [
      'A empresa anunciante é responsável pelas informações que publica, pela qualidade, segurança e entrega de seus produtos ou serviços, pelo cumprimento dos descontos oferecidos e pelo atendimento ao consumidor. O Desconto do Dono não controla nem garante o resultado das transações realizadas diretamente entre as partes.',
      'Nada nestes Termos afasta direitos do consumidor ou responsabilidades que não possam ser excluídos ou limitados pela legislação aplicável.',
    ],
  },
  {
    title: 'Conduta e conteúdo',
    paragraphs: [
      'É proibido publicar ou transmitir conteúdo ilegal, ofensivo, discriminatório, enganoso ou fraudulento, violar direitos de terceiros, manipular ofertas ou utilizar a plataforma para finalidade ilícita.',
      'Reservamo-nos o direito de revisar, limitar ou remover anúncios e de suspender ou banir empresas que violem estes Termos ou os princípios de ética, respeito e confiança da comunidade. Sempre que adequado e possível, poderemos informar o responsável sobre a medida adotada.',
    ],
  },
  {
    title: 'Atualizações e contato',
    paragraphs: [
      'Estes Termos podem ser atualizados para refletir mudanças na plataforma ou na legislação. A versão vigente será publicada nesta página, com a respectiva data de atualização.',
      'Dúvidas sobre estes Termos podem ser encaminhadas para desconto.do.dono@gmail.com.',
    ],
  },
]

export const privacySections: LegalSection[] = [
  {
    title: 'Controlador e contato',
    paragraphs: [
      'O controlador dos dados tratados nesta plataforma é o Desconto do Dono. Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, escreva para desconto.do.dono@gmail.com.',
    ],
  },
  {
    title: 'Dados que coletamos',
    paragraphs: [
      'No cadastro de uma conta, coletamos nome, e-mail e informações de perfil necessárias ao serviço, como cidade, estado e, quando fornecidos, nome da empresa, WhatsApp, site e perfis em redes sociais.',
      'Para solicitar um desconto, o formulário de resgate coleta o nome e o WhatsApp do interessado, além da identificação da oferta solicitada. Esse formulário não solicita e-mail. Empresas cadastradas podem fornecer dados de contato e informações comerciais que escolhem exibir em seus perfis e anúncios.',
    ],
  },
  {
    title: 'Como usamos os dados',
    paragraphs: [
      'Usamos os dados para criar e administrar contas, autenticar usuários, exibir perfis e anúncios, registrar solicitações de desconto, permitir o contato relacionado à oferta e manter a segurança e o funcionamento da plataforma.',
      'O tratamento é realizado para as finalidades informadas e conforme as bases legais aplicáveis da Lei Geral de Proteção de Dados (LGPD), incluindo a execução dos serviços solicitados e o cumprimento de obrigações legais.',
    ],
  },
  {
    title: 'Compartilhamento',
    paragraphs: [
      'Os dados de contato enviados ao solicitar um desconto são disponibilizados à empresa responsável pela oferta, para que ela possa responder à solicitação. Não vendemos dados pessoais. O Supabase é utilizado como fornecedor de infraestrutura para banco de dados e autenticação, podendo processar dados para prestar esses serviços técnicos.',
    ],
  },
  {
    title: 'Segurança e armazenamento',
    paragraphs: [
      'Utilizamos o Supabase para gestão do banco de dados e autenticação. O Supabase Auth armazena senhas como hashes criptográficos, não em texto simples. Adotamos recursos de segurança e controle de acesso disponíveis na plataforma e medidas técnicas razoáveis para proteger os dados. Nenhum serviço conectado à internet pode garantir segurança absoluta.',
      'Mantemos os dados pelo período necessário para prestar os serviços e cumprir obrigações legais ou proteger direitos. Quando aplicável, pedidos de exclusão podem estar sujeitos a prazos ou retenções exigidos por lei.',
    ],
  },
  {
    title: 'Seus direitos',
    paragraphs: [
      'Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou eliminação de dados, além de outras providências previstas em lei. Para solicitar a exclusão da conta e dos dados associados, ou exercer qualquer direito, entre em contato com a administração pelo e-mail desconto.do.dono@gmail.com.',
    ],
  },
  {
    title: 'Atualizações desta Política',
    paragraphs: [
      'Esta Política pode ser atualizada para refletir mudanças nos serviços ou nas exigências legais. A versão vigente e sua data de atualização serão mantidas nesta página.',
    ],
  },
]
