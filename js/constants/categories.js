import { assetUrl } from './assets-manifest.js';

var C = function (rel) {
  return assetUrl('images/categories/' + rel);
};
var I = function (rel) {
  return assetUrl('images/' + rel);
};

export const CATEGORIES = [
  {
    key: 'all', label: 'Tudo', emoji: '🏪', priceHidden: false,
    image: C('all.png'),
    variants: [C('all2.png'), C('all3.png'), C('all4.png')],
  },
  {
    key: 'gas', label: 'Gás', emoji: '🔥', priceHidden: false,
    image: C('gas3.png'),
    variants: [C('gas.png'), C('gas2.png')],
  },
  {
    key: 'telemoveis', label: 'Telemóveis', emoji: '📱', priceHidden: true,
    image: C('telemoveis.png'),
    variants: [
      C('telemoveis-1.jpeg'),
      C('telemoveis-2.jpeg'),
      C('telemoveis-3.jpeg'),
      C('telemoveis-alt.jpeg'),
    ],
  },
  {
    key: 'electronicos', label: 'Electrónicos', emoji: '💻', priceHidden: true,
    image: C('electronicos.png'),
    image2x: C('electronicos@2x.png'),
    image3x: C('electronicos@3x.png'),
    variants: [C('electronicos@2x.png'), C('electronicos@3x.png')],
  },
  {
    key: 'roupas', label: 'Drips', emoji: '👗', priceHidden: true,
    image: C('drips2.png'),
    variants: [C('roupas-alt.jpg')],
  },
  {
    key: 'imoveis', label: 'Cubicos', emoji: '🏠', priceHidden: true,
    image: C('cubico.png'),
    variants: [C('imoveis.png')],
  },
  {
    key: 'veiculos', label: 'Veículos', emoji: '🚗', priceHidden: true,
    image: C('veiculo.png'),
    variants: [C('veiculo-alt.jpeg')],
  },
  {
    key: 'alimentacao', label: 'Piteus', emoji: '🌽', priceHidden: false,
    image: C('alimentos.png'),
    variants: [C('alimentacao-alt.png')],
  },
  {
    key: 'servicos', label: 'Serviços', emoji: '🔧', priceHidden: false,
    image: C('servicos.png'),
    variants: [],
  },
  {
    key: 'calcados', label: 'Calçado', emoji: '👟', priceHidden: true,
    image: C('calcados.jpg'),
    variants: [],
  },
  {
    key: 'electrodomesticos', label: 'Electrod.', emoji: '🫙', priceHidden: false,
    image: C('electrodomesticos.jpeg'),
    variants: [],
  },
  {
    key: 'materiais_construcao', label: 'Construção', emoji: '🧱', priceHidden: false,
    image: I('icon.png'),
    variants: [],
  },
];

export const WIDE_CATEGORIES = new Set(['imoveis', 'servicos', 'veiculos']);

export const CATEGORY_ACCENT = {
  default: { primary: '#D97706', secondary: '#EA580C' },
  all: { primary: '#D97706', secondary: '#EA580C' },
  gas: { primary: '#D97706', secondary: '#EA580C' },
  roupas: { primary: '#7C3AED', secondary: '#6D28D9' },
  calcados: { primary: '#9333EA', secondary: '#7C3AED' },
  telemoveis: { primary: '#4F46E5', secondary: '#4338CA' },
  electronicos: { primary: '#4F46E5', secondary: '#4338CA' },
  veiculos: { primary: '#EA580C', secondary: '#D97706' },
  imoveis: { primary: '#059669', secondary: '#047857' },
  alimentacao: { primary: '#16A34A', secondary: '#15803D' },
  servicos: { primary: '#0284C7', secondary: '#0369A1' },
  electrodomesticos: { primary: '#7C3AED', secondary: '#6D28D9' },
  materiais_construcao: { primary: '#B45309', secondary: '#92400E' },
};

export function accentFor(key) {
  return CATEGORY_ACCENT[key] || CATEGORY_ACCENT.default;
}
