# ETAPA 2 — MERCADO E DINÂMICA

## Oferta ↔ Procura ↔ Matching ↔ Negociação ↔ Acordo

**Estatuto:** estudo de implementação e viabilidade. **Não há código nesta etapa.**  
**Fonte de verdade de produto:** `MUCULA_CONSTITUICAO_PRODUTO.md`  
**Fonte de verdade do cliente actual:** `mucula-web/` (modo local)  
**Regra:** resolver inconsistências da Etapa 6 **ao longo** das etapas — não nesta.

Pergunta desta etapa: *como o mercado se move, que objectos existem, o que depende do quê, o que é viável no cliente actual sem regressão?*

---

## 1. Objectivo da Etapa 2

Fechar a **mecânica comercial** dos dois movimentos:

1. **Oferta encontra procura** — listing publicado → descoberta → interesse → negociação → acordo.  
2. **Procura chama oferta** — necessidade publicada → matching → respostas controladas → comparação → Minguito → acordo.

Definir:

- objectos de domínio;
- estados;
- regras determinísticas vs camada Minguito;
- dependências e ordem de construção futura;
- o que **não** tocar agora para não regressar.

---

## 2. Inventário factual do que o web já tem (âncora)

| Objecto / fluxo | Existe? | Notas |
|-----------------|---------|--------|
| Listing (produto/serviço) | Sim | `local/store.js`, create hub/produto/serviço |
| Feed + filtro categoria + search texto | Sim | `feed.js` |
| Detalhe + CTA Minguito | Sim | `detail.js` → `#/services?listingId=` |
| Minguito chat | Sim | local simulado; histórico em memória |
| Saves (heart) | Sim | `mc_local_saves` — **não** é interesse comercial |
| Aviso/promo | Sim (local) | não é campanha paga |
| **Demand / Procura** | **Não** | |
| **Negotiation + estados** | **Não** | |
| **P_min / comissão** | **Não** | só `price` + `negotiable` |
| **Respostas de vendedor a procura** | **Não** | |
| **Chat user–user** | **Não** | |
| **Supabase / Grok** | **Não** | fases posteriores da constituição |

Isto limita o desenho da Etapa 2: a mecânica tem de **assentar** em listing + sessão + feed, não exigir backend ainda.

---

## 3. Objectos de domínio (mínimo viável, sem redundância)

Quatro objectos. Mais do que isto nesta fase é complexidade sem liquidez.

### 3.1 Listing (já existe — evoluir, não duplicar)

Responsabilidade: **oferta**.  
Campos já úteis: `_id`, `title`, `description`, `price`, `priceUnit`, `type`, `category`, `condition`, `location.neighborhood`, `imageUrl(s)`, `authorId`, `status`, `negotiable`, campos de serviço.

Campos **futuros** (não implementar agora): `priceMinSeller`, `platformFeePolicy`, `lat/lng`.  
Não criar um segundo tipo “anúncio comercial” paralelo ao listing.

### 3.2 Demand (falta — objecto novo)

Responsabilidade: **procura estruturada**.

Campos mínimos:

| Campo | Obrigatório | Função |
|--------|-------------|--------|
| `id` | Sim | Identidade |
| `authorId` | Sim | Dono da procura |
| `title` / `query` | Sim | “Máquina de solda” |
| `category` | Sim | Matching com `CATEGORIES` já existentes |
| `neighborhood` | Sim | Unidade bairro |
| `budgetMax` | Recomendado | Filtro de preço |
| `conditionPref` | Não | novo / usado / qualquer |
| `urgency` | Não | prioridade de notificação futura |
| `status` | Sim | `active` \| `paused` \| `satisfied` \| `expired` |
| `createdAt` | Sim | Recência |

Uma procura **não** é um listing invertido. Não reutilizar `createListing` para isto.

### 3.3 Negotiation (falta — objecto novo)

Responsabilidade: **ciclo comercial entre duas partes** (e o sistema).

Uma negociação referencia:

- `listingId` **ou** `demandId` (pelo menos um);
- `buyerId`;
- `sellerId` (conhecido no movimento 1; no movimento 2 preenche-se quando um vendedor responde);
- `state`;
- `proposedPrice` (opcional, gravado pelo **sistema**);
- timestamps.

Não gravar “a verdade do preço” só no texto do Minguito.

### 3.4 DemandOffer / Response (falta — objecto fino)

Responsabilidade: **resposta de um vendedor a uma procura**.

Campos mínimos: `demandId`, `sellerId`, `listingId` (opcional: “tenho este anúncio”), `message` curta, `createdAt`, `status` (`pending` \| `accepted` \| `rejected` \| `withdrawn`).

Isto evita spam estrutural: a resposta é um objecto com regras, não um chat livre infinito.

**Não** criar na Etapa 2 (desenho): Message user–user, Promotion paga, Review, Report — dependem de match estável.

---

## 4. Máquina de estados (única)

```
interest
   → negotiating
        → agreed_buyer
             → pending_seller
                  → matched
                       → closed   (concluded | cancelled)
```

Regras:

- Heart **não** cria `interest`. Heart = bookmark.  
- Abrir Minguito num listing **pode** criar `interest` (decisão de produto na implementação futura).  
- Responder a uma procura **cria** `interest`/`negotiating` com `sellerId` preenchido.  
- `matched` é o único estado que, mais tarde, autoriza chat directo / ponto de encontro.  
- Transições de preço só se `proposedPrice >= P_min` quando P_min existir; até lá, `negotiable` do listing é o único sinal (fraco).

---

## 5. Os dois movimentos — passo a passo

### Movimento A — Oferta encontra procura

```
Vendedor: create listing (já existe)
Comprador: feed / search / detalhe (já existe)
Comprador: interesse (FALTA estado)
Minguito: contexto do listing (parcial: query listingId)
Sistema: grava negociação (FALTA)
Vendedor: notificado (FALTA)
Ambos: matched (FALTA)
```

Viabilidade no cliente actual: **alta** para A até `interest` + contexto Minguito. Baixa para notificação real sem backend.

### Movimento B — Procura chama oferta

```
Comprador: cria demand
Sistema: matching determinístico contra listings activos
UI: mostra N ofertas relevantes
CTA: Encontrar com o Minguito (com demandId)
Vendedores opt-in / donos dos listings matched: vêem oportunidade
Vendedor: DemandOffer
Comprador: compara
Minguito: compara dentro dos dados matched (não inventa)
Acordo → mesma máquina de estados
```

Viabilidade no cliente actual: **média**. Matching pode ser função pura JS sobre `localGetListings()` + demands em `localStorage`. Notificar vendedores “em push” **não** é viável sem servidor; no local: caixa “Oportunidades” no perfil ou em Fluxos.

---

## 6. Matching — regras determinísticas (produto)

Uma oferta é **relevante** para uma procura se:

1. listing `status` activo / `disponivel`;  
2. `listing.category === demand.category` (v1: igualdade; mapeamentos pai/filho = fase posterior);  
3. se `budgetMax` existe: `listing.price <= budgetMax * 1.15` (factor = **OPORTUNIDADE A VALIDAR**);  
4. bairro: igual **ou** (futuro) adjacente — v1 local: igualdade de `neighborhood` normalizada; se bairro da procura vazio, não filtrar território.

Ordenação v1: bairro igual primeiro, depois proximidade de preço, depois recência.

Limite de apresentação inicial: 5–8 itens (constituição).

**Zero resultados:** estado honesto (“não há oferta relevante neste bairro/categoria”) + opção futura de notificar vendedores da categoria. Não inventar listings.

Isto é **sistema**, não Minguito.

---

## 7. Minguito nesta dinâmica (limites)

| Pode (quando implementado) | Não pode |
|----------------------------|----------|
| Pedir ao sistema a lista already-matched | Afirmar stock que não veio da query |
| Comparar 2–3 listings devolvidos | Inventar desconto |
| Explicar próximo estado | Gravar acordo só em prosa |
| Encaminhar para detalhe / interesse | Substituir DemandOffer |

Dependência: matching e negotiation **existem** antes de Grok. Ordem invertida = diluição (Etapa 6).

---

## 8. P_min e comissão — posição nesta etapa

**Desenho:** reserva campos no listing (`price` já existe; `priceFloor` futuro).  
**Implementação nesta etapa:** não.  
**Motivo:** sem política de números no piloto, um piso inventado é alucinação económica.

Até haver política: `negotiable` + preço de montra. Minguito (quando grounded) só cita o preço do listing.

---

## 9. Estudo de viabilidade

### 9.1 O que é viável **só no cliente local** (próximas etapas de código)

| Capacidade | Viável local? | Risco de regressão |
|------------|---------------|-------------------|
| CRUD Demand | Sim | Baixo se rotas novas `/demand` |
| Matching puro JS | Sim | Baixo |
| Negotiation em localStorage | Sim | Médio se misturar com saves |
| DemandOffer local | Sim | Baixo |
| Lista “oportunidades” no perfil/fluxos | Sim | Baixo |
| Minguito a receber `demandId` + resultados matched | Sim | Médio (não partir chat actual) |
| Push ao vendedor | Não | — |
| Chat user–user realtime | Não de forma sólida | — |
| Grok grounding | Não (precisa server) | — |
| RLS / verdade multi-dispositivo | Não | — |

### 9.2 O que exige Supabase (não Etapa 2)

Auth partilhada, demands/listings multi-user, notificações, messages, media remota, Grok via Edge Function.

### 9.3 Viabilidade comercial (bairro)

Sem objecto Procura, **não há como medir** `demand_coverage_rate`.  
Etapa 2 fecha o **desenho** dessa métrica; a medição só existe depois do objecto existir.

---

## 10. Dependências e interdependências

```
CATEGORIES (existe)
    ↓
Listing.category  ←→  Demand.category
    ↓
Matching determinístico
    ↓
Negotiation (listingId e/ou demandId)
    ↓
Minguito (contexto + tools de leitura)
    ↓
matched
    ↓
[futuro] messages / encontro / notify
```

**Grafo de dependência para implementação futura (ordem obrigatória):**

1. Persistência Demand (store local) + rotas UI mínimas.  
2. Função `matchDemandToListings(demand, listings)` pura e testável.  
3. Negotiation store + transições.  
4. Ligar detalhe listing → cria negotiation `interest`.  
5. Ligar “Encontrar com Minguito” → mesma store + resultados matched injectados.  
6. DemandOffer + inbox vendedor (perfil ou fluxos).  
7. Só depois: campos P_min, Grok, Supabase.

**Dependências que NÃO se devem criar:**

- Demand não depende de promo/aviso.  
- Negotiation não depende de heart.  
- Matching não depende de Grok.  
- Fluxos/KPIs não devem ser a fonte da verdade — só leitura agregada **depois** dos objectos existirem.

---

## 11. Interdependência com inconsistências da Etapa 6

Estas ficam **backlog**; Etapa 2 apenas diz *onde* se encaixam.

| Inconsistência Etapa 6 | Relação com Etapa 2 | Quando resolver |
|------------------------|---------------------|-----------------|
| Seed local imutável | Matching sobre dados stale mente cobertura | Ao implementar Demand/match (higiene store) |
| Perfil vazio vs feed cheio | `authorId` vs user demo | Ao ligar DemandOffer / “os teus” |
| Strip 45 assets no feed | Polui descoberta | UX feed (não é domínio mercado) |
| KPIs mortos | Precisam de negotiation/demand | Depois dos objectos |
| Minguito simulado | Precisa matching + estados | Depois de 1–3 |
| Sem P_min | Regra futura na negotiation | Economia (Etapa 4 constituição) |
| Sem chat user–user | Só pós-`matched` | Depois de estados |
| Sem Supabase | Persistência multi-user | Fase 2 técnica da constituição |
| Aviso ≠ anúncio pago | Monetização | Fora da dinâmica nuclear |

**Regressão a evitar:** ao adicionar Demand, não alterar o contrato de `createListing` nem o shape de feed item (`mapFeedItemToListing`) sem adapter.

---

## 12. Superfícies de UI futuras (mapa, não ecrãs finais)

| Superfície | Movimento | Depende de |
|------------|-----------|------------|
| `/demand/new` (criar procura) | B | Demand store, CATEGORIES |
| `/demand/:id` (ver procura + matches) | B | Matching |
| Inbox “Oportunidades” (vendedor) | B | DemandOffer + listings do user |
| Detalhe listing → interesse | A | Negotiation |
| Minguito `?listingId=` / `?demandId=` | A e B | Já há listingId; falta demandId |
| Fluxos | Leitura | Agregação posterior |

Não acrescentar tab nova na Etapa de código seguinte se o hub Criar puder ganhar “Estou à procura” — **menos superfície, menos regressão**.

**DECISÃO de desenho (Etapa 2):** o terceiro botão do hub Create passa a poder ser **Procura** (objecto de mercado). O “Aviso” actual é legado de announcement desligado no RN — **não** é Procura. Não fundir os dois.

---

## 13. Contratos internos (para o código futuro não divergir)

### `matchDemandToListings(demand, listings) → Listing[]`

Puro. Sem I/O. Sem Minguito.

### `createDemand(input, authorId) → Demand`

Não cria listing.

### `openNegotiation({ listingId?, demandId?, buyerId, sellerId? }) → Negotiation`

Idempotente por par (buyer, listing) ou (buyer, demand, seller).

### `transitionNegotiation(id, toState, actorId)`

Rejeita saltos ilegais.

Estes nomes são **contratos de produto**, não ficheiros ainda.

---

## 14. Riscos desta dinâmica

| Risco | Mitigação de desenho |
|-------|----------------------|
| Procura vira classificado invertido sem matching | Matching obrigatório no fluxo “Encontrar com Minguito” |
| Vendedores spamam procuras | DemandOffer + limites (desenhar: max N respostas / procura / dia) |
| Minguito inventa matches | Só recebe array já filtrado |
| Dois funis (heart vs interest) | Separar semanticamente |
| Big-bang com Supabase | Local primeiro, mesmos objectos |

---

## 15. Critério de conclusão da Etapa 2 (agora)

A Etapa 2 está **fechada como estudo** quando a equipa consegue responder sem ambiguidade:

1. Quais são os 4 objectos e o que **não** são?  
2. Qual a máquina de estados única?  
3. Como a procura chama a oferta sem ser “busca com outro nome”?  
4. O que é determinístico vs Minguito?  
5. Qual a ordem de implementação para não regressar o feed/create actual?  
6. Quais inconsistências da Etapa 6 **não** se resolvem aqui?

Respostas: secções 3–4, 5–7, 10–11.

---

## 16. Próximo passo autorizado (não executado aqui)

**Implementação Etapa 2.1 (código), só com ordem explícita:**

1. Store Demand + match puro + rota criar/ver procura no hub.  
2. Sem Grok, sem Supabase, sem chat user–user, sem P_min inventado, sem mexer no seed agressivamente além do necessário ao match.

Qualquer passo 2.1 deve preservar: feed, create produto/serviço, detalhe, guest wall, modo local.

---

## 17. Declaração

Etapa 2 = **mapa da dinâmica de mercado**.  
Inconsistências da web = **backlog ordenado**, não sprint desta etapa.  
Código = **etapa seguinte**, com os contratos da secção 13.
