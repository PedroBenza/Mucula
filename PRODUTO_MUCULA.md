# PRODUTO MUCULA — roadmap e estado

**Tipo:** documento de produto + engenharia (vivo).  
**Objectivo:** listar o que falta **antes** e **depois** de Supabase e da integração Grok, sem omitir o que torna o Mucula ainda instável ou amador.  
**Actualização:** 2026-09-19 — pós blindagem local (etapas A1–A2–C–D–E no cliente web).

---

## 0. Visão estável (não diluir)

| Princípio | Conteúdo |
|-----------|----------|
| Circuito | Oferta ↔ procura ↔ Minguito ↔ Fluxo ↔ acordo mediado |
| Papéis | Comprador / vendedor claros na UI e no agente |
| Dados | Uma verdade (hoje local; amanhã servidor) |
| Produto | Sério o suficiente para beta controlado → liquidez de bairro + monetização leve |
| Stack | Cliente web + **Supabase** (dados/auth/realtime) + **Grok** (linguagem do Minguito, **subordinada** a tools) |

### Fases oficiais (Constituição) — mapa

| Fase | Conteúdo | Estado (2026-09-19) |
|------|----------|---------------------|
| **1** | Cliente sólido: papéis, bancada, motor de preço, mercado, identidade, endurecimento local | **FECHADA no essencial** (ver §1) |
| **2** | **Supabase** — fonte de verdade, auth, RLS, mesmas entidades | **Próxima** — só depois dos critérios de entrada (§4) |
| **3** | Minguito + **Grok** em produção (tools, anti-alucinação) | **Depois** da Fase 2 mínima estável |
| **4–7** | Economia real, confiança, métricas, expansão | Só com evidência; sem big-bang |

**Regra de ouro:** 1 → solidificar local · 2 → servidor · 3 → linguagem. **Não** misturar Grok/Supabase na Fase 1 excepto **contratos** (nomes de campos, IDs, papéis).

---

## 1. Estado actual — o que já está feito (Fase 1)

Trabalho local entregue e validado na UI (zip `mucula-completo-etapas`):

| Bloco | Resultado |
|-------|-----------|
| Papéis | `sameUserId`, asserts buyer/seller, auto-negociação bloqueada, Combinámos só para partes |
| Motor de preço | Snapshot na abertura; teto/chão; só `confirmAsSeller` grava `matched`; chão muro no Fluxo |
| Mercado (R9) | `listing-market`: Feed/matching/oportunidades só on-market |
| Ciclo (R6) | `disponivel` → `reservado` (acordo) → `vendido` (entrega); arquivar → `pausado` |
| Sessão | Sem fallback cego `local-user-1`; helper `js/core/user-id.js` |
| Minguito | Protocolo local por papel; sessões por listing/demand+user; narrativa ≠ motor |
| Tempo | TTL 48h + sweep no Fluxo/Minguito |
| Números | Favoritos por conta; vistas 1×/dia; comissão 5% no publish + Combinámos (vendedor) |
| Estados | `ALLOWED` congelado + teste `negotiation-allowed-freeze.test.js` PASS |
| Contrato API | `docs/ETAPA_E_CONTRATO_API.md` (mapa local ↔ endpoints futuros) |

### Critérios Fase 1 — checklist actualizado

- [x] Comprador e vendedor no papel certo (UI + motor)
- [x] Negociação com IDs e estados legíveis no Fluxo
- [x] Sem CTA de contacto directo no acordo
- [x] Dados de negócio não dependem de fallback cego `local-user-1`
- [x] Circuito: interesse → proposta → Fluxo → Aceitar → Combinámos → (opcional) Vendido
- [x] Teste de freeze ALLOWED a passar
- [ ] Copy 100% centralizada (ainda há strings soltas — higiene, não bloqueia Supabase)
- [ ] Paridade visual total / PWA “produção” (não bloqueia schema)

**Conclusão:** a Fase 1 está **pronta para planear Fase 2**. Não reabrir o motor de preço nem o isolamento local “por polish”.

---

## 2. Visão segura até Supabase e Grok

```
Fase 1 (local) ──ok──► Fase 2 (Supabase) ──mínimo estável──► Fase 3 (Grok+tools)
                              │
                              ├── Auth + schema + RLS primeiro
                              ├── Adaptadores no cliente (fim da dupla verdade)
                              └── Realtime / Storage depois
```

### Ordem segura (não inverter)

1. **Congelar contratos** (já em `ETAPA_E_CONTRATO_API.md` + campos do motor).  
2. **Schema + RLS** no Supabase (mesmo modelo mental: listing, demand, negotiation, offer).  
3. **Auth** real; mortalidade de `local-user-1` em produção.  
4. **Cliente em modo API** (`DATA_MODE=api`) com **os mesmos** fluxos UI — zero feature nova.  
5. **Beta fechado** num bairro com contas reais.  
6. **Só então** Edge Function + Grok com tools que **chamam** o mesmo motor de regras (não inventam preço).

### O que é proibido neste caminho

| Proibido | Porquê |
|----------|--------|
| Grok a gravar `matched` / preço sem passar pelo motor | R1 — texto não fecha negócio |
| Schema diferente do modelo local “porque é mais fácil” | Dupla verdade e regressão |
| RLS frouxo “só para testar” em produção | Fuga de contacto / dados |
| Feature nova de produto no meio da migração | Mistura de causas de bugs |
| Expandir multi-bairro antes de liquidez no piloto | Constituição |

---

## 3. Critérios de entrada e saída por fase

### Entrar na Fase 2 (Supabase) — gate

- [x] Fase 1 essencial fechada (tabela §1)
- [ ] Schema draft revisado (tabelas = entidades locais)
- [ ] Políticas RLS escritas no papel (buyer/seller/owner)
- [ ] `DATA_MODE` já existe e caminhos local vs API separados
- [ ] Ambiente Supabase de **staging** (nunca produção como playground)

### Sair da Fase 2 mínima (pronto para beta com servidor)

- [ ] Login/registo reais; sessão estável
- [ ] CRUD listings/demands/negotiations no servidor
- [ ] RLS: user A não lê negociação de user B
- [ ] Cliente **não** grava negócio só em `localStorage` quando `DATA_MODE=api`
- [ ] Upload de imagem (Storage) ou decisão explícita de adiar
- [ ] Smoke test: acordo completo ponta a ponta em staging

### Entrar na Fase 3 (Grok) — gate

- [ ] Fase 2 mínima estável em staging (lista acima)
- [ ] Tools desenhadas 1:1 com funções locais (`propose_price_within_bounds`, etc.)
- [ ] Fallback determinístico se Grok falhar (já há esboço local)
- [ ] Prompt por papel (buyer vs seller) documentado
- [ ] Chão **nunca** enviado ao comprador no prompt

### Sair da Fase 3 mínima

- [ ] Grok só **narra** e **sugere**; server valida e grava
- [ ] Teste de abuso: “fecha a 1 Kz” → rejeitado
- [ ] Telemetria de tool calls e falhas

---

## 4. O que falta ANTES do Supabase (higiene residual — não reabre motor)

Prioridade **baixa/média** — polish, não bloqueio:

1. Varredura final de strings → `copy.js` (R14/identidade).
2. Painel “propostas activas” no detalhe do vendedor (atalho ao Fluxo).
3. Explicar no UI bairro piloto e limites free (já há quotas).
4. Checklist anti-ecrã-branco em deploy (SW, imports, `navigate` com query).
5. Seed vs demo: banner “dados de demonstração” se seed activo.
6. PWA: HTTPS + manifest + SW estáveis.

*Não bloquear Fase 2 com:* pagamento real, Grok, expansão multi-bairro, redesign total.

---

## 5. O que falta COM / DEPOIS do Supabase (Fase 2)

| Bloco | Trabalho | Ordem |
|-------|----------|-------|
| Schema | `users`, `listings`, `demands`, `negotiations`, `offers`, `events` — campos alinhados ao local | 1 |
| Auth | Contas reais, sessão, refresh; fim de `local-user-1` em prod | 1 |
| RLS | Comprador só a sua negociação; vendedor só confirma a sua; listing público só on-market | 1 |
| Adaptadores | `js/api/*` deixa de stubar; mesmo contrato que `ETAPA_E` | 2 |
| Realtime | Interesses/propostas → Fluxo | 3 |
| Storage | Upload imagens (não só data URL) | 3 |
| Fim dupla verdade | Com `DATA_MODE=api`, localStorage não é canónico de negócio | 2 |
| Migração | Script seed demo → staging (opcional) | 4 |

**Primeiro PR de Fase 2 recomendado:** schema + RLS + auth + `listings` feed/mine/create. Negociações no segundo PR.

---

## 6. O que falta COM a integração Grok (Fase 3)

| Bloco | Trabalho |
|-------|----------|
| Edge / server | Contexto: listing, demand, papel, snapshot teto/chão, regras |
| Tools | `search_listings`, `get_listing`, `search_demands`, `get_negotiation_rules`, `propose_price_within_bounds` |
| Proibições | Inventar stock; gravar preço sem validação server; fechar abaixo do chão sozinho |
| Papel | Prompt e tools diferentes para **buyer** vs **seller** |
| Tom | Identidade linguística Mucula (clara, angolana, não corporativa) |
| Fallback | Se Grok falhar → protocolo determinístico (local já existe) |

**Grok não substitui:** máquina de estados, comissão, quotas, RLS, `confirmAsSeller`.

---

## 7. Depois de Supabase + Grok (Fases 4–7)

| Fase | Foco | Gate |
|------|------|------|
| **4 Economia** | Gateway real de destaque; comissão cobrada no acordo | Pagamento testado em staging |
| **5 Confiança** | Telefone / reputação leve | Só se abuso aparecer no beta |
| **6 Métricas** | Funil: view → interesse → match → vendido | Dashboard interno |
| **7 Expansão** | Novo bairro com o mesmo circuito | Liquidez no piloto |

**Fora de âmbito até a Constituição mudar:** carteira, crédito, logística própria, IA com poder comercial autónomo.

---

## 8. Lista unificada «memória de trabalho»

| # | Item | Estado |
|---|------|--------|
| 1 | Minguito intermediário + zero contacto directo | Feito (local) |
| 2 | Chão + Fluxo se abaixo | Feito |
| 3 | Modo vendedor no Minguito | Feito (protocolo + API local) |
| 4 | Isolamento real por conta | Feito local; **servidor = Fase 2** |
| 5 | Cold start de bairro | Aberto (produto) |
| 6 | Estados complexos — UI disciplinada | Feito no essencial |
| 7 | Dupla verdade local vs servidor | **Cortar na Fase 2** |
| 8 | Assets / nomenclatura | Residual |
| 9 | Paridade visual RN | Residual |
| 10 | Monetização conceptual até gateway | Fase 4 |
| 11 | Comissão no circuito | Feito (create + Combinámos) |
| 12 | Destaque com preço claro | Feito (local; pagamento Fase 4) |
| 13 | `copy.js` único | Parcial |
| 14 | Design System | Residual |
| 15 | Desktop como camada | Residual |
| 16 | PWA completo | Residual |
| 17 | Anti-regressão `minguito-protocol` | Manter |
| 18 | `navigate` com query | Manter |
| 19 | Cabeçalho Fluxo | Manter |
| 20 | Beta users reais | **Após Fase 2 mínima** |

---

## 9. Critério de «produto sério» (mínimo)

- [x] Comprador e vendedor ouvem o Minguito no papel certo  
- [x] Negociação com IDs correctos e estados legíveis no Fluxo  
- [x] Não há CTAs que reabram contacto directo no acordo  
- [ ] Linguagem 100% consistente em todas as abas (higiene)  
- [x] Publicar produz oferta utilizável (foto, texto, preço, banda no local)  
- [x] Sem fallback cego `local-user-1` em fluxos autenticados  
- [ ] Supabase + RLS (Fase 2)  
- [ ] Grok com tools e chão de preço no servidor (Fase 3)  

---

## 10. Como usar este documento

1. **Agora:** não reabrir Fase 1; preparar schema + RLS (§5, primeiro PR).  
2. **Antes de cada sprint:** gates da fase actual (§3).  
3. **Não diluir a Constituição** (§0).  
4. **Código de referência local:** `docs/ETAPA_*`, `docs/ETAPA_E_CONTRATO_API.md`, `docs/GUIA_VERIFICACAO_UI.md`.  
5. **Actualizar este ficheiro** quando um gate mudar de estado.

---

## Anexo — varredura histórica (pré-blindagem)

As secções de varredura aba a aba do registo 2026-09-18 mantêm-se como memória de UI residual (Feed, detalhe, publish). Muitos itens de isolamento e motor foram fechados em §1; o que resta é polimento e Fase 2+.

