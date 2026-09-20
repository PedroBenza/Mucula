# Guia de verificação na interface (Mucula Web)

## Preparação

```bash
npx serve .
```

Abrir a URL HTTP (não `file://`).  
Demo: `demo@mucula.local` / `demo1234`

---

## O que deve notar de diferente

1. **Sem login**, Minguito/Fluxo/Publicar pedem conta — **não** fingem ser o user demo.
2. **Feed** não mostra publicações `reservado`, `vendido` ou `pausado`.
3. Após **Aceitar acordo** (vendedor no Fluxo), a publicação **some do Feed** (reservado).
4. No ecrã **Combinámos**, o **vendedor** vê comissão + “Ficas com” e o botão **Marcar como vendido**.
5. O **comprador** no Combinámos **não** vê comissão nem “marcar vendido”.
6. **Destaque** chama-se “Tornar anúncio (destaque)” — publicação ≠ anúncio pago.
7. **Favorito (coração)** é por conta (outro login no mesmo browser não herda os teus).
8. Abrir o mesmo detalhe **várias vezes no mesmo dia** não dispara vistas infinitas (1×/dia/conta).
9. Dono pode **Arquivar publicação** (sai do mercado como pausado).

---

## Roteiro de prova (ordem)

### A — Sessão e isolamento
1. Sem login → Feed ok; tocar Minguito → pede conta.
2. Login demo → Fluxo mostra dados do demo.
3. Logout → favoritos do demo deixam de aparecer como “teus”.

### B — Mercado (R9)
1. Nota um item no Feed; anota o título.
2. Como outro fluxo: combinar acordo sobre esse item (ou usar um teu + segundo browser/perfil se possível).
3. Após match, refresh Feed → esse título **não** deve estar.

### C — Papéis e acordo (R4/R5/R6)
1. Comprador: detalhe → negociar com Minguito → propor preço **acima** do mínimo.
2. Vendedor (mesma conta dona do listing no demo: só listings do `local-user-1`): Fluxo → **Aceitar acordo**.
3. Combinámos: ver preço; vendedor vê **Ficas com**; **Marcar como vendido**.
4. Estado da publicação: **Vendido**. Feed continua sem o item.

### D — Chão (R3)
1. Propor preço **muito baixo** (abaixo do mínimo do listing negociável).
2. Fluxo do vendedor: texto “abaixo do mínimo”; **sem** botão Aceitar (só Recusar).

### E — Combinámos alheio (R11)
1. Com URL `/#/combinamos/<id>` de um acordo que não é teu (ou sem login) → “Este acordo não é teu”.

### F — Favoritos e vistas (H2/H3)
1. Login → coração num card → refresh → continua guardado.
2. Abrir detalhe 3 vezes seguidas → métricas de vistas no Fluxo não sobem 3× no mesmo dia (só 1 evento/dia).

### G — Arquivar (H5)
1. Dono: detalhe de publicação disponível → **Arquivar publicação** → volta ao Feed sem esse item.

### H — Linguagem (R14)
1. Detalhe do dono: botão de destaque fala em **anúncio**, não em “mais uma publicação”.

---

## Teste automático rápido

```bash
node tests/negotiation-allowed-freeze.test.js
```

Esperado: `PASS negotiation-allowed-freeze.test.js`

---

## Se algo falhar

- Confirma que substituíste **todos** os ficheiros do zip na árvore (incluindo `js/domain/`, `js/core/user-id.js`).
- Hard refresh (cache SW se houver).
- `localStorage` antigo: em DevTools → Application → Clear site data, e volta a entrar com demo.
