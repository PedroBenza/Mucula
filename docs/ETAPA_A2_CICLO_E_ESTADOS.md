# Etapa A2 — Ciclo de vida + estados (entregue)

**Pré-requisito:** A1 blindada (R9/R11/user-id/listing-market).  
**Foco:** ALLOWED congelado, R6 acordo≠vendido, R14 linguagem publicação vs anúncio.

## 1. ALLOWED = uma fonte de verdade

Tabela alinhada a `docs/MUCULA_NEGOTIATION_STATES.md` e `tests/negotiation-allowed-freeze.test.js`:

| De | Para |
|----|------|
| interest | negotiating, closed |
| negotiating | agreed_buyer, closed |
| agreed_buyer | pending_seller, closed |
| pending_seller | matched, closed |
| matched | closed |

**Importante (anti-inconsistência A1):** `setProposedPrice` e `confirmAsSeller` são escritas de domínio e **não** passam por `transitionNegotiation` para todos os casos. O teste de freeze cobre só `ALLOWED` / `transitionNegotiation`. Comentário no código deixa isto explícito.

**Teste:** `negotiation-allowed-freeze.test.js` → **PASS**.

## 2. R6 — Acordo ≠ vendido

| Evento | Status listing | Mercado (Feed) |
|--------|----------------|----------------|
| Publicar | disponivel | Sim |
| Vendedor confirma acordo | **reservado** | Não |
| Vendedor marca entregue | **vendido** | Não |

- `confirmAsSeller` → `reservado` (já A1/motor)
- `completeDealAsSeller(negId, sellerId)` → `vendido` + `completedAt` na negociação
- UI: ecrã Combinámos, botão **Marcar como vendido** (só seller, se matched e ainda não vendido)

## 3. R14 — Publicação vs anúncio

- Copy: `publication`, `adBoost`, `pubVsAdNote` em `copy.js`
- Destaque no detalhe: “Tornar anúncio (destaque)” + texto que publicação → anúncio no Feed
- Erros de feature: “publicação” quando ainda não é destaque pago

## 4. Precauções (lições A1)

- Reutilizar `sameUserId` / `listing-market` — não reinventar filtros
- Não criar helper sem adoptá-lo
- Não alargar ALLOWED “por conveniência” sem actualizar teste + doc
- Matching/Feed continuam a usar `filterOnMarket` (reservado e vendido fora)

## 5. Aceite manual

1. Congelar estados: `node tests/negotiation-allowed-freeze.test.js` → PASS  
2. Match → listing **reservado** some do Feed  
3. Combinámos (vendedor) → **Marcar como vendido** → status **Vendido**  
4. Comprador no mesmo ecrã **não** vê o botão de vendido  
5. Destaque: copy fala em anúncio/destaque, não em “tudo é anúncio”
