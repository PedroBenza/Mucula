# Desktop — camada de experiência

Não é uma segunda Mucula. Reutiliza rotas, estado, API, copy e features existentes.

## Responsabilidade

| Pasta/ficheiro | Função |
|----------------|--------|
| `js/desktop/shell.js` | Activa breakpoint Desktop, sidebar, `data-route` no shell |
| `css/desktop/shell.css` | Layout Desktop (só `@media` / `.mc-is-desktop`) |
| `css/desktop/surfaces.css` | Ajustes de leitura: feed, detalhe, Fluxo, Publicar, Minguito |

Mobile continua a ser a referência. Desktop só entra a partir de **1024px**.
