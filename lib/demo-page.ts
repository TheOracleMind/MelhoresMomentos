import type { LovePageDraft } from "@/lib/types";

const image = (path: string) => ({
  imageUrl: path,
  signedUrl: path
});

export const demoPage: LovePageDraft = {
  slug: "lucas-e-marina-demo",
  creatorName: "Lucas",
  recipientName: "Marina",
  relationshipType: "namoro",
  metAt: "2021-08-14",
  relationshipStartedAt: "2021-10-02",
  shortMessage: "Uma surpresa para lembrar tudo que a gente viveu.",
  title: "Lucas e Marina",
  introMessage: "Um presente digital para guardar nossos dias favoritos, nossas viagens e cada detalhe que virou saudade boa.",
  finalMessage: "Marina, que essa página lembre você do quanto eu amo construir essa história ao seu lado.",
  mainPhotoUrl: "/demo/capa.jpg",
  mainPhotoSignedUrl: "/demo/capa.jpg",
  theme: "classic",
  status: "active",
  planType: null,
  paidAt: null,
  expiresAt: null,
  bestPhotos: [
    { ...image("/demo/capa.jpg"), sortOrder: 0 },
    { ...image("/demo/praia.png"), sortOrder: 1 },
    { ...image("/demo/viagem-carro.png"), sortOrder: 2 },
    { ...image("/demo/lugar-bonito.png"), sortOrder: 3 },
    { ...image("/demo/capa.jpg?favorita=5"), sortOrder: 4 }
  ],
  moments: [
    {
      title: "O dia em que tudo ganhou outro sentido",
      description: "A gente saiu sem grandes planos, mas voltou com aquela sensação de que alguma coisa muito bonita tinha começado ali.",
      momentDate: "2021-08-14",
      sortOrder: 0,
      images: [
        { ...image("/demo/lugar-bonito.png"), sortOrder: 0 },
        { ...image("/demo/capa.jpg"), sortOrder: 1 }
      ]
    },
    {
      title: "Nossa primeira viagem de carro",
      description: "Playlist alta, janela aberta e uma estrada inteira para rir das nossas piadas internas. Foi simples, mas ficou gigante na memória.",
      momentDate: "2022-01-22",
      sortOrder: 1,
      images: [
        { ...image("/demo/viagem-carro.png"), sortOrder: 0 },
        { ...image("/demo/praia.png"), sortOrder: 1 }
      ]
    },
    {
      title: "A tarde em que o mar parecia só nosso",
      description: "Entre vento, areia e fotos tortas, eu tive certeza de que os melhores lugares são aqueles onde você está comigo.",
      momentDate: "2023-03-18",
      sortOrder: 2,
      images: [
        { ...image("/demo/praia.png"), sortOrder: 0 },
        { ...image("/demo/lugar-bonito.png"), sortOrder: 1 }
      ]
    }
  ]
};
