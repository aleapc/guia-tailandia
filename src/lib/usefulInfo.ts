// Informações úteis / emergência — Tailândia.
// Emergência geral 191; Polícia Turística (fala inglês) 1155; ambulância 1669.
// Dados verificados 2025/2026; confirme telefones/endereços in loco.

export interface EmergencyNumber {
  label: string;
  number: string;
  emoji: string;
}

export interface UsefulPlace {
  name: string;
  detail?: string;
  phone?: string;
  address?: string;
  mapQuery?: string;
  note?: string;
}

export interface UsefulGroup {
  title: string;
  emoji: string;
  places: UsefulPlace[];
}

export interface InfoLink {
  label: string;
  url: string;
}

export interface InfoBlock {
  title: string;
  body: string;
  links?: InfoLink[];
}

export const emergencyNumbers: EmergencyNumber[] = [
  { label: 'Emergência / Polícia', number: '191', emoji: '🚓' },
  { label: 'Polícia Turística (inglês)', number: '1155', emoji: '🧳' },
  { label: 'Ambulância / resgate', number: '1669', emoji: '🚑' }
];

export const emergencyNote =
  'Na Tailândia o número geral é o 191. A Polícia Turística (1155) atende em inglês e ajuda com golpes, perdas e dúvidas de turista. Ambulância/resgate: 1669.';

export const usefulGroups: UsefulGroup[] = [
  {
    title: 'Saúde & hospitais',
    emoji: '🏥',
    places: [
      {
        name: 'Bumrungrad International Hospital',
        detail: 'Bangkok — um dos melhores hospitais privados da Ásia, atende estrangeiros/seguro',
        mapQuery: 'Bumrungrad International Hospital Bangkok'
      },
      {
        name: 'Bangkok Hospital Phuket',
        detail: 'Phuket — pronto-socorro privado com atendimento em inglês',
        mapQuery: 'Bangkok Hospital Phuket'
      },
      {
        name: 'Farmácias Boots / Watsons',
        detail: 'Redes em malls e ruas; remédios baratos sem receita e atendentes que falam inglês',
        mapQuery: 'Boots pharmacy Bangkok'
      }
    ]
  },
  {
    title: 'Apoio ao brasileiro',
    emoji: '🇧🇷',
    places: [
      {
        name: 'Embaixada do Brasil em Bangkok',
        detail: 'Assistência consular a brasileiros na Tailândia',
        mapQuery: 'Embassy of Brazil Bangkok',
        note: 'Plantão consular de emergência do Itamaraty (Brasília): +55 61 98260 0610.'
      }
    ]
  }
];

// Blocos de informação prática (visto, moeda, transporte, etiqueta, saúde, costumes...).
export const infoBlocks: InfoBlock[] = [
  {
    title: '🛂 Visto e imigração (brasileiros)',
    body: 'Brasileiros NÃO precisam de visto: pelo acordo bilateral Brasil-Tailândia, o passaporte dá direito a 90 dias de permanência. A viagem de 17 dias está tranquila. O passaporte precisa ter validade de pelo menos 6 meses na entrada. É obrigatório preencher online o TDAC (Thailand Digital Arrival Card) entre 24 e 72 horas antes de pousar — guarde o comprovante no celular.',
    links: [
      { label: 'TDAC — cartão de chegada oficial', url: 'https://tdac.immigration.go.th' },
      { label: 'Requisitos de entrada', url: 'https://www.thaiembassy.com/travel-to-thailand/thailand-entry-requirements' }
    ]
  },
  {
    title: '💵 Moeda, câmbio e saques',
    body: 'A moeda é o Baht (THB). US$1 ≈ 32-33 THB; 1 THB ≈ R$0,17 (R$100 ≈ 570 THB). Use cartão de viagem sem IOF (Wise, Nomad, C6). O melhor câmbio é nas casas SuperRich (verde/laranja) e Vasu — batem banco e aeroporto. ATMs cobram taxa fixa alta (220-350 THB por saque), então saque o máximo de uma vez (20.000-30.000 THB). Comida de rua, mercados, tuk-tuk e templos são só dinheiro.',
    links: [{ label: 'Guia de câmbio e ATMs', url: 'https://www.expatden.com/thailand/thailand-currency-exchange/' }]
  },
  {
    title: '📱 Internet e eSIM',
    body: 'Operadoras: AIS (maior cobertura/ilhas), dtac e TrueMove. Mais prático: comprar um eSIM online ANTES de viajar (Airalo, Holafly, Saily) — ativa sozinho ao pousar, sem fila, ~US$5-15 por 15GB. Chip físico no aeroporto de Bangkok (Suvarnabhumi saídas 7 e 9; Don Mueang saídas 3-5): AIS ilimitado 30 dias ~1.199 THB; em loja/7-Eleven na cidade sai mais barato.',
    links: [{ label: 'Comparativo de chips e eSIM', url: 'https://www.psimonmyway.com/thailand-sim-card-thai/' }]
  },
  {
    title: '🚕 Transporte nas cidades',
    body: 'Baixe o app Grab (o Uber da Ásia): preço fechado antes de embarcar, sem golpe. Funciona em Bangkok, Chiang Mai, Phuket e Krabi. Em Bangkok, BTS Skytrain e MRT (metrô) fogem do trânsito (~16-60 THB). Táxi só com taxímetro ligado. Tuk-tuk: combine o preço ANTES (80-150 THB trechos curtos). Em Chiang Mai, o songthaew (caminhonete vermelha) custa ~30 THB por pessoa.',
    links: [{ label: 'Como usar o Grab', url: 'https://easy-go-thailand.com/grab-thailand' }]
  },
  {
    title: '✈️ Transporte entre cidades e ilhas',
    body: 'Bangkok → Chiang Mai: voo de ~1h15 (AirAsia, Nok, Thai Lion) de Don Mueang (DMK), ~1.000-2.500 THB comprando com antecedência. Atenção ao limite de bagagem das low-cost (7kg de mão). No sul, o triângulo Krabi ↔ Phi Phi ↔ Phuket é feito por ferry/lancha: Phuket-Phi Phi de ferry ~2h (350-500 THB) ou lancha ~1h (~700 THB). Reserve ferries nos piers ou por app na alta temporada.',
    links: [{ label: 'Voos domésticos baratos', url: 'https://www.traveltomtom.net/destinations/asia/thailand/cheap-domestic-flights-in-thailand' }]
  },
  {
    title: '🙏 Etiqueta em templos',
    body: 'Cubra ombros e joelhos (homens e mulheres). Leve um lenço/sarongue na mochila. Tire os sapatos antes de entrar nos salões. Nunca aponte os pés para uma imagem de Buda nem para pessoas. Não suba nem toque nas estátuas para fotos. A monarquia é levada muito a sério: jamais desrespeite imagens do rei ou da família real (é crime). Fale baixo e demonstre respeito.',
    links: [{ label: 'Costumes e etiqueta', url: 'https://www.thaiembassy.com/thailand/thailand-customs' }]
  },
  {
    title: '🩺 Saúde e cuidados',
    body: 'NÃO beba água da torneira — só engarrafada (~10-20 THB). O gelo tubular (com furo no meio) é industrial e seguro. Vá com calma na pimenta nos primeiros dias. Hidrate-se muito no calor (água de coco ajuda). Farmácias (Boots, Watsons) são ótimas. Use repelente ao entardecer (há dengue). Contrate seguro viagem com boa cobertura médica ANTES de embarcar.',
    links: [{ label: 'Saúde para viajantes (CDC)', url: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/thailand' }]
  },
  {
    title: '🤝 Costumes e casal LGBTQ+',
    body: 'O cumprimento é o "wai" (mãos juntas com leve reverência). Nunca toque na cabeça de ninguém nem aponte com os pés. Gorjeta não é obrigatória, mas é bem-vinda (arredonde a conta ou ~20-50 THB; 10% em restaurantes bons). Regatear é normal em mercados e tuk-tuk, com bom humor. A Tailândia legalizou o casamento igualitário em janeiro de 2025 (1º país do Sudeste Asiático) e é um dos destinos mais acolhedores do mundo para casais gays.',
    links: [{ label: 'Casamento igualitário (2025)', url: 'https://www.npr.org/2025/01/23/g-s1-44322/thailand-same-sex-marriage-law' }]
  },
  {
    title: '🌤️ Clima em nov/dez e o que levar',
    body: 'Vocês pegam a melhor época: começo da estação fresca e seca. No norte (Chiang Mai/Rai), dias de 25-29°C e noites de 15-19°C — leve um casaco leve. Nas praias do Andaman (Krabi, Phi Phi, Phuket), dias de 30-32°C, mar calmo e sol, com dezembro no auge da alta temporada. Chuva mínima. Na mala: roupas leves, protetor solar, chapéu, repelente, um casaco leve para o norte e calçado fácil de tirar nos templos.',
    links: [{ label: 'Clima em novembro', url: 'https://www.roughguides.com/thailand/when-to-go/november/' }]
  },
  {
    title: '🛡️ Segurança e golpes comuns',
    body: 'A Tailândia é segura, mas há golpes. Ignore quem disser que "o templo está fechado hoje" e oferecer tuk-tuk barato de city tour (é rota por lojas de gemas com comissão). NUNCA deixe o passaporte como caução ao alugar moto/scooter — ofereça cópia e depósito; há esquema de cobrar "danos" inventados. Confira fotos do veículo antes. Prefira Grab para não ser enganado no preço. Emergência: 191. Polícia Turística: 1155. Ambulância: 1669.',
    links: [{ label: 'Golpes comuns a evitar', url: 'https://th.usembassy.gov/common-scams-to-avoid/' }]
  }
];

export const safetyTips = [
  'Água só engarrafada — nunca da torneira. O gelo tubular (furo no meio) de restaurantes é seguro.',
  'Passaporte NUNCA fica como caução de aluguel de moto/scooter: ofereça cópia + depósito em dinheiro.',
  '"Templo/palácio fechado hoje" + tuk-tuk barato = golpe da loja de gemas. Ignore e siga.',
  'Use Grab (app) para táxi com preço fechado; em táxi de rua, exija o taxímetro ligado.',
  'Calor e sol fortes: protetor FPS 50, chapéu, muita água e água de coco. Evite o sol entre 11h e 16h.'
];
