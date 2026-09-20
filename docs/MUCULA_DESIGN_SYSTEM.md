# Mucula — Design System oficial

**Estatuto:** identidade visual e comportamental do produto.  
**Código:** `css/tokens.css` + `css/components.css` + `css/design-system/`.  
**Linguagem de produto:** `js/constants/copy.js` + `docs/MUCULA_IDENTIDADE_LINGUISTICA.md`.

---

## 0. Auditoria (estado anterior)

| Padrão | Problema | Direcção DS |
|--------|----------|-------------|
| Botões `primary` + `ghost` em quase tudo | Toda acção parece CTA | Hierarquia: primary / secondary text / tertiary / icon |
| `.mc-card` com borda em listas | Interface “caixa a caixa” | Lista por espaço + tipografia; card só quando agrupa contexto |
| Modal sheet genérico | Cartão flutuante genérico | Overlay discreto, sheet sem peso ornamental |
| Espaçamentos 4/8/14/20 + valores soltos | Ritmo irregular | Escala `space-1` … `space-8` |
| Tipografia sem escala nomeada | Tudo parece “importante” | display / title / body / label / meta / price |
| Ícones + emoji em ticker | Mistura | SVG de UI; emoji só 🔥 no ticker (produto) |
| Sombras leves no search | Elevação sem sistema | Elevation 0–2, uso raro |
| Mobile + Desktop | Duas composições, uma identidade | Mesmos tokens; layout muda, DNA não |

---

## 1. Visão

A Mucula transmite profissionalismo, confiança e proximidade **sem decoração**.

Premium = **hierarquia + espaço + tipografia + alinhamento + proporção + consistência + comportamento**.

A interface deve parecer **cuidadosamente desenhada**, não decorada.

---

## 2. Princípios

1. **Clareza antes de ornamentação** — se não serve a descobrir → publicar → negociar → acompanhar → fechar, não existe.
2. **Acção contextual** — botão pesado só quando a prioridade ou a segurança o exigem.
3. **Espaço é componente** — separação legível sem caixas em excesso.
4. **Uma voz** — visual e linguagem (`copy.js`) alinhados.
5. **Uma identidade, várias composições** — Mobile / Tablet / Desktop partilham tokens.
6. **Menos elementos, melhores elementos.**

---

## 3. Hierarquia de acções

| Nível | Quando | Tratamento |
|-------|--------|------------|
| **Primary** | Uma acção principal por contexto (Publicar, Entrar, Confirmar acordo) | Fundo accent, texto claro, min-height toque |
| **Secondary** | Alternativa clara (Cancelar com peso) | Texto + peso; borda só se ambiguidade |
| **Tertiary** | Navegação auxiliar, “Voltar”, links de apoio | Texto, hover peso/underline subtil |
| **Icon** | Acções densas (fechar, favorito) | SVG `currentColor`, sem bolha por defeito |

**Não:** pills em massa, sombra em botões, gradientes, fundo em toda a acção secundária.

---

## 4. Tipografia

| Token | Uso |
|-------|-----|
| `--mc-text-display` | Raro (marca / momentos) |
| `--mc-text-title` | Cabeçalhos de aba / ecrã |
| `--mc-text-subtitle` | Secções |
| `--mc-text-body` | Corpo |
| `--mc-text-label` | Labels de campo |
| `--mc-text-meta` | Bairro, estado, apoio |
| `--mc-text-price` | Preço (peso alto, tracking leve) |

Hierarquia deve ser legível **antes** de ler o conteúdo.

---

## 5. Cor (semântica)

| Token | Função |
|-------|--------|
| `--mc-bg` | Fundo app |
| `--mc-surface` | Superfície subtil |
| `--mc-card` | Superfície elevada mínima |
| `--mc-text` / `--mc-text-soft` / `--mc-text-muted` | Texto 1º / 2º / 3º |
| `--mc-border` | Divisão **quando necessária** |
| `--mc-accent` | Marca / primary action (`#D97706`) |
| `--mc-success` / `--mc-warning` / `--mc-error` / `--mc-info` | Estados |

Cor não é decoração: é significado.

---

## 6. Espaçamento

Escala: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`  
(`--mc-space-1` … `--mc-space-8`)

- Micro: 1–2  
- Interno de controlo: 2–3  
- Entre elementos: 3–4  
- Entre grupos: 5–6  
- Secções: 6–7  

---

## 7. Radius e elevação

- Radius: sm 6 / md 10 / lg 14 (mais contido que “app toy”)  
- Elevation: 0 (default), 1 (sheet), 2 (raro) — sem sombra em cartões de feed por defeito  

---

## 8. Ícones (SVG)

- Stroke consistente (~1.75)  
- ViewBox 24  
- `currentColor`  
- Tamanhos: 16 / 20 / 24  
- Sem emoji como ícone de UI  
- Sem círculo de fundo por defeito  

---

## 9. Contentores

**Card** só se agrupa contexto ou separa tarefas.  
Listas de Fluxo e metadados preferem **espaço + tipo**.  
Empty / loading / error: estados tipográficos, não “caixas vazias decoradas”.

---

## 10. Overlay e modal

- Overlay: escurecimento moderado, sem blur pesado  
- Sheet: superfície limpa, padding generoso, **uma** primary action  
- Preferir inline / painel / jornada antes de modal  

---

## 11. Estados

default · hover · focus-visible · active · selected · disabled · loading · success · error · empty  

Focus: anel 2px accent, offset 2px.  
Estado não depende só de cor.

---

## 12. Motion

- Duração: 120–200ms UI, ≤280ms transição de ecrã  
- Easing: standard (`cubic-bezier(0.2, 0.8, 0.2, 1)`)  
- Sem bounce, sem loop ornamental  
- Respeitar `prefers-reduced-motion`  

---

## 13. Acessibilidade

- Contraste texto/fundo AA  
- Alvo de toque ≥ 44px nas acções primary  
- Teclado no Desktop (foco visível)  
- `aria-*` em dialogs e nav  

---

## 14. Responsive

Mesmos tokens.  
Desktop: mais margem e colunas (`css/desktop/`), não outra marca.

---

## 15. O que não somos

- Template SaaS de cartões  
- Dashboard de métricas  
- Cópia visual de outros produtos (incl. BeautyPro)  
- “Premium” por gradiente ou sombra  

---

## 16. Como evoluir

1. Nova UI → tokens primeiro.  
2. Componente só se for padrão repetido.  
3. Perguntar: *já se percebia sem esta caixa / este botão?*  
4. Não alterar jornadas de produto por estética.


## Etapa 1 (implementada) — padrão único de acções

| Tipo | Classe | Uso |
|------|--------|-----|
| Primary | `.mc-btn.mc-btn-primary` | Uma CTA por contexto (Publicar, Entrar, Confirmar acordo, Enviar…) |
| Acção leve | `.mc-action` | Secundárias: Sair, actualizar, abrir link, etc. |
| Voltar | `.mc-action.mc-action--back` | Navegação atrás em todos os ecrãs |
| Escolha em lista | `.mc-action-row` | Alternativas em Publicar (serviço, procura, aviso) |
| Destaque textual | `.mc-action--accent` | Continuar a negociar, ver acordo (não primary) |

**Eliminado:** `mc-btn-ghost` como padrão de UI.


## Etapa 2 (implementada) — contentores e listas

| Situação | Tratamento |
|----------|------------|
| Lista (Fluxo, respostas, anúncios meus) | `.mc-list-item` — espaço + divisor, sem card |
| Empty state | `.mc-empty` — sem caixa |
| Resumo de acordo (Combinámos) | `.mc-card` — unidade única de contexto |
| Feed / anúncios no mercado | Cartões de listing mantidos (unidade visual de oferta) |
| Painel limites | Sem caixa pesada; divisor inferior |

**Voltar:** SVG + texto via `backButtonHtml()` → `.mc-action.mc-action--back`.


## Etapa 3 (implementada) — tipografia, espaço, estados, motion, a11y

- Tipografia de ecrã (create, header, lead, feed) alinhada a `--mc-text-*` / weights.
- Espaçamentos de componentes migrados para `--mc-space-*` onde havia px soltos.
- Elevação: search sem sombra ornamental (`elev-0`); modal mantém `elev-2`.
- Estados: `states.css` — `:focus-visible` global, nav, desktop, input disabled, step-dot.
- Motion: durações/easing dos tokens; `prefers-reduced-motion` em loading e step-dot.
- Responsive: Desktop shell usa os mesmos tokens de space/type.
- A11y: anel de foco único (`--mc-focus-ring`); sem outline cego sem alternativa.
