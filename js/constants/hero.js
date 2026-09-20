import { assetUrl } from './assets-manifest.js';

var A = function (f) { return assetUrl('images/' + f); };
var C = function (f) { return assetUrl('images/categories/' + f); };

export const HERO_CONTENT = {
  all: {
    headline: 'Compra e venda na Banda',
    sub: 'Da Engevia ao Pacaça tudo em um só lugar',
    image: A('minguito3.png'),
    variants: [A('minguito.png'), A('minguito4.png'), A('splash-icon.png')],
    accent: '#1D9E75',
  },
  gas: {
    headline: 'Gás na porta de casa',
    sub: 'Recargas e botijas perto de ti',
    image: C('gas3.png'),
    variants: [C('gas.png'), C('gas2.png')],
    accent: '#f97316',
  },
  telemoveis: {
    headline: 'Tecnologia ao teu alcance',
    sub: 'Telemóveis novos e usados',
    image: C('telemoveis.png'),
    variants: [C('telemoveis-1.jpeg'), C('telemoveis-2.jpeg'), C('telemoveis-3.jpeg'), C('telemoveis-alt.jpeg')],
    accent: '#818cf8',
  },
  electronicos: {
    headline: 'Electrónicos',
    sub: 'Tecnologia perto de ti',
    image: C('electronicos@3x.png'),
    variants: [C('electronicos.png'), C('electronicos@2x.png')],
    accent: '#818cf8',
  },
  roupas: {
    headline: 'Drips a bom preço',
    sub: 'Roupa nova e usada',
    image: C('drips2.png'),
    variants: [C('roupas-alt.jpg')],
    accent: '#ec4899',
  },
  imoveis: {
    headline: 'Encontra o teu cubíco',
    sub: 'Arrendamentos e vendas',
    image: C('cubico.png'),
    variants: [C('imoveis.png')],
    accent: '#1D9E75',
  },
  veiculos: {
    headline: 'O teu próximo carro',
    sub: 'Carros, motas e mais',
    image: C('veiculo.png'),
    variants: [],
    accent: '#f59e0b',
  },
  alimentacao: {
    headline: 'Piteus',
    sub: 'Comida perto de ti',
    image: C('alimentos.png'),
    variants: [C('alimentacao-alt.png')],
    accent: '#16A34A',
  },
  calcados: {
    headline: 'Sapatos para todo o gosto',
    sub: 'Do clássico ao streetwear',
    image: C('calcados.jpg'),
    variants: [],
    accent: '#ef4444',
  },
  electrodomesticos: {
    headline: 'Electrodomésticos',
    sub: 'Para a casa, perto de ti',
    image: C('electrodomesticos.jpeg'),
    variants: [],
    accent: '#7C3AED',
  },
  materiais_construcao: {
    headline: 'Construção',
    sub: 'Materiais e ferramentas',
    image: A('icon.png'),
    variants: [],
    accent: '#B45309',
  },
  servicos: {
    headline: 'Serviços na banda',
    sub: 'Profissionais perto de ti',
    image: C('servicos.png'),
    variants: [],
    accent: '#0284C7',
  },
};

export function heroFor(key) {
  return HERO_CONTENT[key] || HERO_CONTENT.all;
}
