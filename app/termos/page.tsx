const sections = [
  {
    title: "1. Sobre o Serviço",
    paragraphs: [
      "Este site permite a criação de páginas personalizadas para compartilhamento de memórias, fotos e momentos especiais.",
      "Ao utilizar o serviço, você concorda com estes Termos de Uso e com esta Política de Privacidade."
    ]
  },
  {
    title: "2. Responsabilidade do Conteúdo",
    paragraphs: [
      "Todo conteúdo enviado pelos usuários, incluindo textos, imagens e informações pessoais, é de responsabilidade exclusiva de quem o enviou.",
      "Você declara possuir os direitos necessários para utilizar e compartilhar os conteúdos enviados através da plataforma.",
      "É proibido utilizar o serviço para publicar conteúdo ilegal, ofensivo, discriminatório, difamatório ou que viole direitos de terceiros."
    ]
  },
  {
    title: "3. Disponibilidade e Expiração",
    paragraphs: [
      "As páginas criadas possuem prazo de disponibilidade conforme o plano adquirido.",
      "Após a expiração, o conteúdo poderá deixar de estar acessível publicamente.",
      "Não garantimos armazenamento permanente dos dados após o período contratado."
    ]
  },
  {
    title: "4. Pagamentos",
    paragraphs: [
      "Os pagamentos são processados por provedores terceirizados especializados em pagamentos online.",
      "Não armazenamos informações completas de cartão de crédito em nossos servidores.",
      "Todos os pagamentos são finais, salvo quando exigido por lei."
    ]
  },
  {
    title: "5. Privacidade e LGPD",
    paragraphs: [
      "Coletamos apenas as informações necessárias para fornecer o serviço, incluindo nome, endereço de e-mail, fotos enviadas, informações fornecidas durante a criação da página e dados técnicos básicos de acesso.",
      "Esses dados são utilizados exclusivamente para operação da plataforma, processamento de pagamentos, geração das páginas criadas e atendimento ao usuário.",
      "Não vendemos dados pessoais a terceiros.",
      "Os dados poderão ser armazenados por fornecedores de infraestrutura, hospedagem, autenticação, armazenamento e pagamento necessários para a operação do serviço.",
      "Nos termos da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), o usuário poderá solicitar informações, correções ou exclusão de seus dados através dos canais de contato disponibilizados pela plataforma."
    ]
  },
  {
    title: "6. Limitação de Responsabilidade",
    paragraphs: [
      'O serviço é fornecido "como está", sem garantias de disponibilidade ininterrupta ou ausência total de falhas.',
      "Em nenhuma hipótese os responsáveis pela plataforma serão responsáveis por danos indiretos, lucros cessantes ou perdas decorrentes do uso do serviço."
    ]
  },
  {
    title: "7. Propriedade Intelectual",
    paragraphs: [
      "A plataforma, seu design, código-fonte, marca e funcionalidades são protegidos pela legislação aplicável e pertencem aos seus respectivos titulares."
    ]
  },
  {
    title: "8. Relação com Terceiros",
    paragraphs: [
      "Este site não é afiliado, associado, autorizado, endossado ou patrocinado pelo Facebook, Instagram, Meta Platforms, Inc., Google, Stripe ou qualquer outra empresa mencionada pelos usuários em seus conteúdos.",
      "Todas as marcas citadas pertencem aos seus respectivos proprietários."
    ]
  },
  {
    title: "9. Alterações",
    paragraphs: [
      "Estes termos poderão ser atualizados periodicamente sem aviso prévio.",
      "O uso contínuo da plataforma após alterações implica aceitação da versão mais recente dos termos."
    ]
  },
  {
    title: "10. Contato",
    paragraphs: [
      "Em caso de dúvidas relacionadas a estes Termos de Uso ou à privacidade dos dados, entre em contato pelo email guilherme@unidaystudio.com.br."
    ]
  }
];

export default function TermsPage() {
  return (
    <main className="bg-[#fbfbfb] px-5 py-12 text-ink sm:px-8">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-rosewood">Última atualização: Junho de 2026</p>
        <h1 className="mt-4 text-5xl font-black leading-tight">Termos de Uso e Política de Privacidade</h1>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="rounded-md border border-ink/10 bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-black">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base font-semibold leading-8 text-ink/70">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
