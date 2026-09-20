# Manual de continuidade — Mucula Web

**Actualizado:** pós Etapas 1–3 (higiene, paridade create/ranking, economia piloto).

## O que é

Cliente HTML/CSS/JS modular. Modo **local** por defeito. Preparado para Supabase e Grok sem mudar a tese.

## Demo

`demo@mucula.local` / `demo1234` · bairro piloto **Rangel**

## Circuito (fecha)

1. Comprador no anúncio de **outro** → Negociar (`interest_open`).
2. Avançar conversa → `negotiating` (só comprador).
3. Vendedor (Fluxos ou detalhe) → Confirmar combinado → `negotiation_matched` → Combinámos.
4. Procura → match exact/near → Minguito (`demand_match_shown`).
5. Oportunidade em **Fluxos** → Responder → oferta + negociação com dono da procura.
6. Proibido: auto-negociação; comprador a marcar combinado sozinho.

Estados congelados: `docs/MUCULA_NEGOTIATION_STATES.md`.

## Fluxos vs Perfil

- **Fluxos:** continuidade, oportunidades (exact primeiro), anúncios, painel piloto (tetos + missão).
- **Perfil:** identidade + sair.

## Economia piloto (Etapa 3)

- 15 anúncios activos · 5 novos/dia · 8 procuras activas  
- Destaque: 1500 / 3500 / 7000 Kz (24h / 3d / 7d) · registo local **sem gateway**  
- Telemetria: `mc_local_events` (visível em Fluxos como “eventos neste aparelho”)  
- Seed: listings Rangel/Maianga + 3 procuras externas para oportunidades

## Testes

```bash
node tests/match-demand.test.js
node tests/demands-store.test.js
node tests/negotiations.test.js
node tests/circuit-stage1.test.js
node tests/demand-offers.test.js
node tests/minguito-demand.test.js
node tests/stage2-limits-feature.test.js
node tests/negotiation-allowed-freeze.test.js
node tests/ranking-listings.test.js
node tests/pilot-economy.test.js
```

## Para Supabase (mapeamento)

Objectos a tabelar: profiles, listings, demands, negotiations, demand_offers, events.  
Mesmos estados e papéis. Destaque: campo `featured_until` + pagamento no gateway.
