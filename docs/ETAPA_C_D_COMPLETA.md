# Etapas C + D — Tempo, números, sessões

## C — H1 / H2 / H3 / R15 / H5

| Item | Tratamento |
|------|------------|
| H1 Expiração | Já: TTL 48h + `sweepExpiredNegotiations` no Fluxo/Minguito (mantido) |
| H2 Favoritos | `saves.js` v2: chave `userId::listingId`, idempotente |
| H3 Views | `listing-views.js`: 1 `listing_view` por user+listing+dia civil |
| R15 Comissão | `platform-fee.js` no publish + **Combinámos (vendedor)**: comissão + “Ficas com” |
| H5 Arquivar | Detalhe (dono): **Arquivar publicação** → status `pausado` (fora do mercado) |

## D — Minguito multi-assunto

| Item | Estado |
|------|--------|
| Sessão por listing/demand + user | `minguito-sessions.js` (H4) — sem userId não grava |
| Protocolo lê snapshot | `negotiations` listingPrice/floor/ceiling na abertura |
| R12 sem contacto | Mantido no Combinámos e protocol |

## E — Contrato API

Ver `ETAPA_E_CONTRATO_API.md`.
