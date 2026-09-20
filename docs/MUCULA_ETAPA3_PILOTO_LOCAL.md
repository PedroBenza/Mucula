# Etapa 3 — Economia piloto + liquidez local (modo local)

**Estatuto:** implementação no cliente web. **Sem gateway de pagamento.**  
**Autoridade:** Constituição + Etapa 4 Economia (números de calibração).

## O que ficou no produto (mensurável)

1. **Tetos free visíveis**
   - 15 anúncios activos / 5 novos por dia / 8 procuras activas
   - Mostrados em **Fluxos** e no **hub Criar** (`getPilotSnapshot`)

2. **Destaque (preçário piloto)**
   - 1500 / 3500 / 7000 Kz (24h / 3d / 7d)
   - Continuam a registar só intenção local (`listing_feature_start`) — **sem cobrança**

3. **Telemetria de missão legível**
   - `demand_match_shown`, `negotiation_matched`, `interest_open`, etc.
   - Contadores no painel de Fluxos

4. **Seed de bairro piloto (fictício)**
   - Densidade em **Rangel** e **Maianga** (listings + procuras seed)
   - Utilizador demo com `neighborhood: Rangel`
   - Matching exact/near demonstrável sem backend

## O que NÃO foi feito (de propósito)

- Pagamento real / gateway
- Expansão geográfica real
- Aquisição de vendedores reais
- Supabase como fonte de verdade
- Alteração à máquina de estados de negociação

## Cold start real (ops — fora do código)

Para um bairro real, a equipa precisa de:

1. Lista mínima de ofertas reais no bairro (seed operacional)
2. Canal de aquisição concentrado (não nacional)
3. Métricas: % procuras com ≥1 oferta relevante, tempo até 1ª resposta, matches
4. Critério de “bairro saudável” antes do próximo território

## API / escalabilidade

- `js/local/pilot-economy.js` é a fachada de leitura dos tetos
- Quando existir backend, os mesmos campos podem vir de `/dashboard/mine` sem mudar a UI de Fluxos
- Eventos em `mc_local_events` mapeiam para a tabela de events da Constituição

## Seed

- `SEED_VERSION = 8` (listings): só **adiciona** fixtures em falta por `_id`
- `mc_local_demand_seed_v2`: só **adiciona** procuras seed em falta por `id`


## Blindagem pós-auditoria (Etapa 3)

| Problema | Correção |
|----------|----------|
| Seed consumia teto “hoje” (createdAt recente) | Fixtures do demo user com `createdAt` ≥ 3 dias |
| Oportunidades misturavam near fraco primeiro | `findOpportunitiesForSeller` prefere **exact**; ordena exact → near |
| Missão parecia “global de produto” | Label: “eventos neste aparelho” |
| Demo sem bairro piloto no perfil | Seed v9 alinha `neighborhood: Rangel` |
| SEED | versão **9** — merge por id, sem apagar anúncios do user |
