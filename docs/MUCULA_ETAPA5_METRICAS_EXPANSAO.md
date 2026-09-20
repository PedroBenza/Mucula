# ETAPA 5 — MÉTRICAS E EXPANSÃO

**Autoridade:** Constituição + Etapa 4 (economia) + calibração piloto.  
**Estatuto:** o que medir, o que é bairro saudável, quando expandir. **Sem código nesta entrega.**

### Pergunta central

> Estamos a criar liquidez real num território — ou só contas e anúncios?

---

## 1. Princípio

Não optimizar downloads. Optimizar **encontros úteis** e **regresso por motivo comercial**.

A métrica de missão (constituição):

> **% de procuras activas com pelo menos uma oferta relevante (exact ou near).**

---

## 2. Eventos a registar (produto)

| Evento | Significado |
|--------|-------------|
| `listing_create` | Oferta publicada |
| `listing_feature_start` | Destaque activado |
| `demand_create` | Procura publicada |
| `demand_match_shown` | Utilizador viu ≥1 correspondência |
| `demand_offer_create` | Vendedor respondeu a procura |
| `interest_open` | Interesse / negociação aberta |
| `negotiation_matched` | Estado Combinado |
| `negotiation_closed` | Encerrado |
| `auth_sign_up` / `auth_login` | Aquisição / retorno |

Sem eventos de vanity (scroll depth como KPI principal, etc.).

---

## 3. Painéis por grupo

### Aquisição
- Novos compradores (contas que criaram procura ou interesse) / semana  
- Novos vendedores (contas que publicaram listing) / semana  

### Liquidez
- Listings activos no bairro  
- Procuras activas no bairro  
- **demand_coverage_rate** = procuras com ≥1 match exact|near / procuras activas  
- Tempo mediano até primeira resposta a procura (quando houver ofertas)  

### Conversão
- View anúncio → interest_open  
- interest_open → negotiation_matched  
- demand_create → demand_match_shown  

### Confiança
- Denúncias / listings activos  
- Cancelamentos de combinado / matched  

### Economia (após destaques)
- Attach rate: listings com destaque / listings criados na semana  
- Receita de destaque (Kz) no piloto  
- Reclamações “só vejo pagos”  

---

## 4. Bairro saudável (critério de expansão)

**Não expandir** só porque há muitos registos.

Um bairro piloto só desbloqueia o **próximo** quando, numa janela de **4 semanas consecutivas**, se verifica **tudo** isto:

| Indicador | Limiar piloto |
|-----------|----------------|
| Listings activos | ≥ **40** |
| Procuras activas (média semanal) | ≥ **15** |
| demand_coverage_rate (média) | ≥ **35%** |
| Negociações abertas (interest+) na janela | ≥ **20** |
| Combinados (matched) na janela | ≥ **5** |
| Vendedores distintos com ≥1 listing activo | ≥ **15** |

Se coverage &lt; 20% com muitas procuras: **não** expandir — falta oferta ou matching/bairro mal calibrado.

Números = **regra de piloto**; rever só com dados reais, não por ambição.

---

## 5. Modelo de expansão

```
Bairro piloto atinge limiares §4
    ↓
Operação: onboarding de oferta no bairro vizinho
    ↓
Repetir medição 4 semanas
    ↓
Só então micro-região / próximo território
```

**Proibido:** lançar “Mucula Angola” ou 10 bairros em paralelo antes do primeiro estar saudável.

---

## 6. Product-market fit local (sinais)

Sinais positivos:
- Vendedores voltam a publicar na semana seguinte  
- Procuras recebem resposta ou match sem o utilizador abandonar na hora  
- Destaque comprado **sem** queda de coverage orgânico  
- «À tua espera» com itens reais (não lista sempre vazia)

Sinais de alarme:
- Muitos listings, zero matched  
- Procuras altas, coverage ~0  
- Queixas de feed só pago  
- Tudo a fechar só no WhatsApp sem qualquer estado no Mucula  

---

## 7. Relação com a calibração económica

| Se… | Então… |
|-----|--------|
| Coverage alta, poucos destaques | Mercado orgânico saudável; não forçar venda de impulso |
| Coverage baixa | Priorizar oferta e bairro, não preço de destaque |
| Muitos free no tecto 15 | Avaliar se o tecto está certo; não subir preço primeiro |
| Queixas de 2 destaques/lote | Baixar para 1 por lote |

---

## 8. O que não medir como sucesso

- Downloads isolados  
- Mensagens Minguito sem match  
- Scroll no feed  
- Número de bairros “abertos” no mapa  

---

## 9. Critério de fecho Etapa 5

Fechada quando estão definidos: eventos, métrica de missão, limiares de bairro saudável, ordem de expansão, sinais de PMF local.

**ETAPA 5 — MÉTRICAS E EXPANSÃO: FECHADA**

**Próximo (constituição):** uso contínuo da Etapa 6 (visão vs produto) para priorizar implementação; tecnicamente: telemetria local dos eventos + destaque com preços da calibração quando houver cobrança operacional.
