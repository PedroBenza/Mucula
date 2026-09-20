# C3 — Smoke E2E (circuito completo em produção)

**App:** https://mucula.vercel.app  
**Modo:** `DATA_MODE=api`  
**Regra:** comprador e vendedor **não** falam um com o outro; preço só via **Minguito**.

Pré-requisitos:
- [ ] SQL `007_reject_and_expire.sql` aplicado no Supabase
- [ ] Dois users (A vendedor, B comprador), sessões distintas
- [ ] Deploy com C1+C2 no `main`

---

## Percurso feliz

| # | Actor | Acção | Resultado esperado |
|---|--------|--------|-------------------|
| 1 | A | Publicar produto/serviço com preço | Listing no Feed; status disponível |
| 2 | B | Abrir detalhe → **Negociar com o Minguito** | Vai a `/services?listingId=…`; negociação `interest` criada |
| 3 | B | No Minguito, conversar e indicar valor em Kz (ex. 40000) | Minguito responde; **não** há botão de enviar preço no detalhe para o vendedor |
| 4 | B | Fluxo | Estado de espera / “Minguito enviou…” se proposta formalizada |
| 5 | A | Fluxo → oportunidade com valor | Vê proposta; **Confirmar acordo** ou **Recusar** |
| 6 | A | Confirmar acordo | `matched`; listing `reservado`; abre Combinámos |
| 7 | A | Combinámos → **Marcar como vendido** | Listing `vendido`; acordo concluído |
| 8 | B | Fluxo / detalhe | Vê acordo confirmado; sem contacto de A |

## Percurso recusa

| # | Actor | Acção | Resultado |
|---|--------|--------|-----------|
| R1 | Após passo 4 | A **Recusar proposta** | Negociação `closed` / rejected |
| R2 | B | Fluxo | Deixa de estar “à espera de confirmação” |

## Anti-casos (não devem existir)

- [ ] Campo no detalhe “Enviar proposta” directo ao vendedor
- [ ] Telefone / WhatsApp / chat A↔B na app
- [ ] Comprador a confirmar o próprio acordo
- [ ] Aceitar proposta abaixo do chão sem excepção explícita (muro)

## Registo

Data: ________  Tester: ________  Pass/Fail: ________  
Notas: ________
