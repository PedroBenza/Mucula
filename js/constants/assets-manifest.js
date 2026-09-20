/** Espelho assets/ — nomes limpos (Etapa 1 higiene). */
export const ASSET_FILES = [
  'images/android-icon-background.png',
  'images/android-icon-foreground.png',
  'images/android-icon-monochrome.png',
  'images/categories/alimentacao-alt.png',
  'images/categories/alimentos.png',
  'images/categories/all.png',
  'images/categories/all2.png',
  'images/categories/all3.png',
  'images/categories/all4.png',
  'images/categories/calcados.jpg',
  'images/categories/cubico.png',
  'images/categories/drips2.png',
  'images/categories/electrodomesticos.jpeg',
  'images/categories/electronicos.png',
  'images/categories/electronicos@2x.png',
  'images/categories/electronicos@3x.png',
  'images/categories/gas.png',
  'images/categories/gas2.png',
  'images/categories/gas3.png',
  'images/categories/imoveis.png',
  'images/categories/roupas-alt.jpg',
  'images/categories/servicos.png',
  'images/categories/telemoveis-1.jpeg',
  'images/categories/telemoveis-2.jpeg',
  'images/categories/telemoveis-3.jpeg',
  'images/categories/telemoveis-alt.jpeg',
  'images/categories/telemoveis.png',
  'images/categories/veiculo-alt.jpeg',
  'images/categories/veiculo.png',
  'images/electronicos.png',
  'images/electronicos2.png',
  'images/electronicos3.png',
  'images/electronicos@2x.png',
  'images/electronicos@3x.png',
  'images/favicon.png',
  'images/icon.png',
  'images/minguito.png',
  'images/minguito3.png',
  'images/minguito4.png',
  'images/partial-react-logo.png',
  'images/react-logo.png',
  'images/react-logo@2x.png',
  'images/react-logo@3x.png',
  'images/roupas.png',
  'images/splash-icon.png',
];

export function assetUrl(rel) {
  return './assets/' + String(rel).split('/').map(encodeURIComponent).join('/');
}

/** Todas as URLs prontas para <img src> */
export function allAssetUrls() {
  return ASSET_FILES.map(assetUrl);
}
