# Etapa E — Contrato local ↔ API futura (só documentação)

Sem rede nesta etapa. Quando existir backend, mapear 1:1 sem mudar a UI.

| Função local | Endpoint futuro | Notas |
|--------------|-----------------|-------|
| `localLogin` / `localRegister` | POST `/auth/login`, `/auth/register` | Tokens; fim de `mc_local_session_user` |
| `fetchMe` | GET `/users/me` | |
| `localGetListings` + `filterOnMarket` | GET `/listings/feed` | Servidor filtra status |
| `localGetListing` | GET `/listings/:id` | |
| `localCreateListing` | POST `/listings` | |
| `localMyListings` | GET `/listings/mine` | |
| `localSetListingStatus` | PATCH `/listings/:id` | reservado / vendido / pausado |
| `localActivateFeature` | POST `/listings/:id/feature` | pagamento real |
| `openNegotiation` / `setProposedPrice` / `confirmAsSeller` / `completeDealAsSeller` | POST `/negotiations` + transições | RLS por buyerId/sellerId |
| `talkToMinguito` | POST `/minguito/message` | Grok + tools; regras no servidor |
| `createDemand` / match | POST `/demands`, GET match | |
| `track` / events | POST `/events` | |
| `calcPlatformFee` | GET `/fees/quote?price=` | mesma fórmula 5% |
| saves v2 | POST/DELETE `/saves` | par user+listing |
| views 1×/dia | POST `/listings/:id/view` | dedupe no servidor |

**Não quebrar:** snapshot de preço na abertura da negociação; `matched` só vendedor; chão secreto ao comprador; procura como produto de 1ª linha.
