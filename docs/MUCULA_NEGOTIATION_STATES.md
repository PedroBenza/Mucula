# Máquina de estados de Negociação — CONGELADA (Etapa 1)

**Estatuto:** documento de congelamento. Alterações só com actualização explícita deste ficheiro + testes.

**Fonte de código:** `js/local/negotiations.js` + `js/domain/human-state.js`

## Regra constitucional

- `matched` só por confirmação do **vendedor** (`sellerId`).
- Comprador **não** fecha combinado sozinho.
- Proibido auto-negociação (buyer === seller).

## Transições permitidas (ALLOWED)

| Estado actual     | Pode ir para                         |
|-------------------|--------------------------------------|
| `interest`        | `negotiating`, `closed`              |
| `negotiating`     | `agreed_buyer`, `closed`             |
| `agreed_buyer`    | `pending_seller`, `closed`           |
| `pending_seller`  | `matched`, `closed`                  |
| `matched`         | `closed`                             |
| `closed`          | (terminal)                           |

## Labels humanas (`human-state.js`)

| Estado sistema     | Label para o utilizador        |
|--------------------|--------------------------------|
| `interest`         | Interessado                    |
| `negotiating`      | Em conversa                    |
| `agreed_buyer`     | À espera do vendedor           |
| `pending_seller`   | À espera da tua confirmação    |
| `matched`          | Combinado                      |
| `closed`           | Encerrado                      |

## Eventos de telemetria relacionados

- `interest_open`
- `negotiation_matched`

## O que NÃO fazer

- Adicionar estados sem actualizar este documento e os testes.
- Permitir que o comprador faça transição para `matched`.
- Remover ou renomear keys de localStorage (`mc_local_negotiations`).

**Escritas de domínio (fora de `transitionNegotiation`):**
- `setProposedPrice` pode colocar `pending_seller` após avaliar oferta (motor de preço).
- `confirmAsSeller` grava `matched` + listing `reservado`.
- `completeDealAsSeller` grava listing `vendido` (R6) sem mudar estado da negociação para além de `completedAt`.

**Versão de congelamento:** Etapa 1+2 — higiene + R6 ciclo reservado→vendido.
