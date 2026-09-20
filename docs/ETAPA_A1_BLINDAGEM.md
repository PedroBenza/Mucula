# Etapa A1 — Blindagem (revisão confrontada + reforço)

## Inconsistências da 1.ª entrega (confrontadas)

| Falha | Impacto | Correcção |
|-------|---------|-----------|
| `isListingOnMarket` só no Feed; matching/Minguito/oportunidades usavam `localGetListings()` cru | R9 furado: procura podia “encontrar” listing **reservado** | `filterOnMarket` / `isListingOnMarket` em matching, Minguito, demand-offers |
| `js/core/user-id.js` existia mas quase não era usado | Duplicação, risco de novo fallback | `resolveUserId` / `sameUserId` adoptados nos fluxos tocados |
| Comparações `===` de ids sem normalizar | Papel buyer/seller falha se tipo number vs string | `sameUserId()` em asserts, protocol, continuity, combinamos, detail |
| `api/listings` importava `negotiations` só pelo filtro | Acoplamento desnecessário | Fonte única `js/domain/listing-market.js` |
| Hub mostrava quotas “cheias” sem sessão | Parecia que guest tinha limite real | Quota só com `uid`; senão copy a pedir conta |
| Detalhe: `openNegotiation` com `buyerId` null | Erro genérico / estado sujo | Guarda `if (!uid)` antes de abrir |
| `demand-offers` indexava `my[i].id` mas listings usam `_id` | Oportunidades do vendedor vazias | Index `_id \|\| id` |

## Arquitectura legível (escalável)

```
js/domain/listing-market.js   → R9 disponibilidade pública
js/core/user-id.js            → R11 identidade de sessão
js/local/negotiations.js      → motor preço/estados (re-export market)
js/api/listings.js            → Feed filtra mercado
js/domain/match-demand.js     → matching só on-market
js/local/demand-offers.js     → oportunidades só on-market
js/api/minguito.js            → papel + matching filtrado
```

## Regras ainda cobertas

R1 (narrativa ≠ motor), R3 (chão muro no Fluxo + confirmAsSeller), R4, R5, R9, R11, H4, H6.

## Fora desta blindagem (Etapa 2)

- ALLOWED ↔ teste freeze
- R6 vendido/entrega
- R14 linguagem anúncio
- UI “excepção de chão” com `allowBelowFloorException`
