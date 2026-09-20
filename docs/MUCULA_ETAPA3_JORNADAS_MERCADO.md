# ETAPA 3 REFORÇADA — JORNADAS DE MERCADO DO MUCULA

**Autoridade:** Constituição do Mucula (acima desta etapa).  
**Ponto de partida:** Etapa 3 anterior (mapa e gaps) — **não** documento fechado; esta versão aprofunda e decide.  
**Estatuto:** experiência de mercado. **Sem código, sem preços, sem arquitectura técnica, sem Etapa 4.**

### Perguntas centrais

1. Em cada momento, o utilizador entende o que aconteceu, o que está a acontecer e qual é o próximo passo?  
2. O Mucula está a aproximar quem tem de quem precisa, ou apenas a fazer navegar anúncios?

### Tese de experiência (não altera a tese de produto)

> O Mucula não existe para fazer pessoas navegarem por anúncios. Existe para tornar mais fácil o encontro entre quem tem e quem precisa — e para não perder a memória desse encontro depois que ele acontece.

---

## 1. Princípios de experiência

| # | Princípio | Classificação |
|---|-----------|---------------|
| P1 | Um próximo passo óbvio em cada momento de jornada (nunca só “explorar”). | **NECESSÁRIA** |
| P2 | Estado legível em linguagem humana; o estado técnico fica no sistema. | **NECESSÁRIA** |
| P3 | Correspondência do sistema ≠ resposta de pessoa ≠ acordo. | **CONSTITUCIONAL** (derivada) |
| P4 | Espera é parte do produto: estado + contexto + acção útil ou ausência honesta de acção. | **NECESSÁRIA** |
| P5 | Vazio sem mentira: nunca inventar oferta, reputação ou disponibilidade. | **CONSTITUCIONAL** |
| P6 | Minguito entra por contexto (anúncio, procura, comparação, negociação), não como destino principal. | **CONSTITUCIONAL** |
| P7 | Feed = mercado agora; “À tua espera” = relações comerciais em curso. | **NECESSÁRIA** (hipótese de estrutura forte — ver §10) |
| P8 | Retenção por motivo comercial real, nunca por jogo. | **CONSTITUCIONAL** |
| P9 | Guest descobre; negócio autentica; **contexto retoma**. | **CONSTITUCIONAL** |
| P10 | WhatsApp pode existir; o Mucula deve guardar memória útil do fio. | **CONSTITUCIONAL** / **NECESSÁRIA** |
| P11 | Menor complexidade que resolva o problema. | **CONSTITUCIONAL** (anti-diluição) |
| P12 | Monetização não interrompe descobrir / publicar / procurar / negociar básico. | **CONSTITUCIONAL** |

**Crítica interna:** a sequência INTENÇÃO → … → RETORNO é um **mapa mental**, não um funil obrigatório. A experiência deve permitir saltos, desistência e dualidade comprar+vender sem “modos”.

---

## 2. Modelo de intenções (atravessam as mesmas superfícies)

Não são oito produtos. São **intenções** que reutilizam Feed, Detalhe, Criar/Procura, Minguito, Perfil e o centro de continuidade.

| ID | Intenção (voz do utilizador) | Objecto principal | Classificação |
|----|------------------------------|-------------------|---------------|
| J1 | Quero comprar — algo que já existe | Listing + descoberta | **CONSTITUCIONAL** |
| J2 | Estou à procura — ainda não encontrei | Demand | **CONSTITUCIONAL** |
| J3 | Quero vender — tenho algo | Listing | **CONSTITUCIONAL** |
| J4 | Encontrei algo — saber mais / interesse | Listing → interest | **CONSTITUCIONAL** |
| J5 | Encontrei alguém interessado / uma procura | Interest / DemandOffer | **CONSTITUCIONAL** / **NECESSÁRIA** |
| J6 | Quero negociar | Negotiation | **CONSTITUCIONAL** |
| J7 | Quero fechar — deixar claro o combinado | Acordo leve (“Combinámos”) | **NECESSÁRIA** |
| J8 | Quero voltar — o que mudou nas minhas relações | Continuidade comercial | **NECESSÁRIA** |

**Redundância evitada:** J4 e J1 partilham descoberta; J4 é o *momento* de aprofundar. J5 cobre lado vendedor (interesse no anúncio **ou** oportunidade de procura) sem inventar “modo vendedor”.

**Procura deixa de ser anexo:** “Estou à procura” é entrada de **objecto de mercado**, não terceira opção decorativa de “publicar anúncio”. O hub pode fisicamente alojar o atalho, mas a **linguagem e o destino** são de procura (necessidade estruturada + “Encontrar com o Minguito”), não de CRUD de listing.  
**Classificação:** corrigir a percepção de anexo = **NECESSÁRIA**; objecto Procura = **CONSTITUCIONAL**.

---

## 3. Vocabulário obrigatório (não misturar)

| Conceito | Significado para o utilizador | Não é |
|----------|-------------------------------|--------|
| **Correspondência** (match de sistema) | “O Mucula encontrou anúncio(s) compatível(is) com o que pediste.” | Aceitação do vendedor |
| **Interesse** | “Eu mostrei que quero avançar neste anúncio / nesta procura.” | Acordo |
| **Resposta** | “A outra parte decidiu participar (ex.: vendedor respondeu à procura).” | Match automático |
| **Negociação** | “Estamos a discutir condições.” | Chat sem objecto |
| **Acordo (leve)** | “Ficou claro o que combinámos, segundo o que o sistema regista.” | Pagamento / checkout |
| **Combinado** (match comercial) | “Há alinhamento suficiente para contacto / encontro.” | Entrega feita |

**Classificação:** distinção = **CONSTITUCIONAL** na lógica; rótulos humanos = **NECESSÁRIA**.

---

## 4. Estados: técnico → humano

| Estado sistema (referência) | Linguagem humana sugerida | Quando o utilizador a vê |
|----------------------------|---------------------------|---------------------------|
| `interest` | **Interessado** | Após demonstrar interesse num anúncio |
| `negotiating` | **Em conversa** | Há troca de condições / Minguito activo com proposta |
| `agreed_buyer` | **À espera do vendedor** | Comprador alinhado; falta a outra parte |
| `pending_seller` | **À espera da tua confirmação** (lado vendedor) | Espelho do anterior |
| `matched` | **Combinado** | Alinhamento suficiente para próximo passo |
| `closed` | **Encerrado** | Concluído ou cancelado (com motivo simples se útil) |

Procura (objecto):

| Status procura | Linguagem |
|----------------|-----------|
| `active` | **À procura de opções** |
| `paused` | **Em pausa** |
| `satisfied` | **Resolvida** |
| `expired` | **Expirada** (com renovar) |

DemandOffer:

| Status | Linguagem |
|--------|-----------|
| `pending` | **Resposta recebida** / **Aguardas resposta** |
| `accepted` / `rejected` | **Aceite** / **Recusada** (quando existir acção) |

**Princípio:** no máximo **uma frase de estado + um CTA**. Evitar painel de cinco badges.  
**Classificação:** mapa de linguagem = **NECESSÁRIA**. Exactez dos termos pode ajustar-se no piloto (**OPORTUNIDADE** de copy).

---

## 5. Jornada de quem compra (J1 + J4)

**INTENÇÃO:** encontrar algo que já está no mercado.  
**ENTRADA:** Feed (categoria, search, perto de ti). Guest permitido.  
**ACÇÃO:** abrir anúncio → ler → guardar e/ou demonstrar interesse / Minguito.  
**RESPOSTA DO SISTEMA:** detalhe real; ao interessar → estado **Interessado**.  
**PRÓXIMO PASSO:** Em conversa / esperar vendedor / sair / guardar.  
**SUCESSO:** pelo menos uma opção relevante aberta **ou** interesse registado com estado visível.  
**VAZIO/FALHA:** categoria sem oferta; anúncio indisponível; vendedor sem resposta → **À espera do vendedor** + opções (voltar ao feed, manter interesse, cancelar interesse).  
**RETENÇÃO:** item em “À tua espera”.  
**FIM:** Combinado / Encerrado / desistência.

**Teste das 10 perguntas:** o valor pré-WhatsApp é comparação e clareza de interesse; a memória pós-WhatsApp é o estado e, se houver, “Combinámos”.  
**Classificação:** núcleo **CONSTITUCIONAL**; estado visível e espera do vendedor **NECESSÁRIA**.

---

## 6. Jornada de quem procura (J2) e “Encontrar com o Minguito”

**INTENÇÃO:** estruturar a necessidade quando a descoberta falhou ou é ineficiente.  
**ENTRADA:** acção clara de mercado (“Estou à procura”), não disfarçada de “mais um tipo de anúncio”.  
**ACÇÃO:** preencher o mínimo (o quê, categoria, bairro, orçamento opcional, estado, urgência opcional) → CTA **Encontrar com o Minguito**.  
**Significado do CTA:** “Eu disse o que preciso → o Mucula procura **comigo** com dados reais” — não “search box com outro nome”.

### Resultados

**A — Correspondências**  
Sistema/Minguito apresentam opções **reais** → utilizador compara → escolhe anúncio → interesse/negociação. Minguito pode falar proximidade, preço, estado **só se estiverem nos dados**.

**B — Correspondências parciais** (**NECESSÁRIA** a distinguir na experiência)  
Não esconder tudo o que não é “perfeito”. Três faixas conceptuais:

| Faixa | Ideia | Exemplo de verdade |
|-------|--------|---------------------|
| Exacta | Cumpre filtros centrais | Categoria + bairro + orçamento |
| Próxima | Falha uma preferência suave | Mesma categoria, outro bairro **ou** pouco acima do orçamento |
| Fora de preferência forte | Só se o utilizador pedir para alargar | Explicitamente “alargar zona / orçamento” |

*Nota crítica:* o matching actual da Etapa 2 é binário (entra/não entra). A **experiência** de “parcial” pode: (1) alargar regras com rótulo honesto, ou (2) oferecer acções “alargar” sem mostrar falsos matches. Preferir **não mentir**. Implementação de faixas = **OPORTUNIDADE** até haver regra de produto fechada; a **necessidade** é não deixar o utilizador só com “zero” sem saída.

**C — Sem correspondência**  
Não “nenhum resultado” seco.  
**À procura de opções** + manter + alterar orçamento/zona/estado + cancelar. Sem inventar stock. Polling/reabrir = espera por oferta (**NECESSÁRIA** em local; push = fase servidor).

**SUCESSO (primeiro sucesso procurador):** procura válida gravada **ou** ≥1 correspondência real.  
**RETENÇÃO:** procura activa em “À tua espera”; depois, **nova correspondência** ou **resposta de vendedor**.

---

## 7. Jornada “Procura chama Oferta” (dois movimentos distintos)

### Movimento A — Matching automático (**CONSTITUCIONAL**)

Procura activa → sistema encontra listings compatíveis → comprador vê **correspondências**.  
Isto **não** significa que um vendedor aceitou.

### Movimento B — Resposta de vendedor (**CONSTITUCIONAL** / experiência comprador **NECESSÁRIA**)

Vendedor recebe **oportunidade** → vê contexto permitido (o que se procura, zona, orçamento se apropriado, urgência, restrições) **sem** dados pessoais desnecessários → decide responder → **Resposta** chega ao comprador → comprador compara respostas → Minguito pode ajudar **sobre essas respostas e anúncios reais** → negociação → acordo.

**Regra de clareza:** na UI do comprador, separar mentalmente:

- “Anúncios que encaixam” (movimento A)  
- “Vendedores que responderam” (movimento B)

Tratar os dois como a mesma lista = **erro de experiência**.

---

## 8. Jornada do vendedor (J3) e diante de uma procura (J5)

### Publicar oferta

Publicar (produto ou serviço: **mesma jornada**, campos e contexto diferentes — **CONSTITUCIONAL** na simplicidade; não dois sistemas).  
Anúncio activo → pode receber **interesse** (alguém no listing) e/ou **oportunidade** (procura compatível).

### Diante de procura

Oportunidade → contexto permitido → Responder (qualidade: mensagem curta + anúncio ligado quando existir) → aguardar comprador → negociar → combinado → fecho leve.

**Limites de spam / relevância:** já previstos na constituição (categoria/zona, limites) — experiência deve reflectir “não podes responder a tudo sem critério” de forma simples quando existirem limites (**CONSTITUCIONAL** na política; copy **NECESSÁRIA**).

**SUCESSO vendedor:** anúncio publicado.  
**SUCESSO vendedor activo:** oportunidade relevante recebida **ou** interesse num anúncio.  
**RETENÇÃO:** “Alguém procura o que tu tens” / “Tens interesse no teu anúncio”.

---

## 9. Jornada de negociação (J6) e fecho (J7)

**Entrada prioritária:** a partir de anúncio ou procura/resposta — não a partir de chat vazio.  
**Minguito:** ajuda a negociar **com contexto**; propostas materiais confirmadas pelo sistema.  
**Estados humanos** (§4) visíveis.  
**Se a outra parte não responde:** espera nomeada + cancelar / voltar a procurar / manter.

### “Combinámos” (fecho leve) — **NECESSÁRIA**

Não é checkout, carrinho nem pagamento obrigatório.

Mostrar **só campos que existem de verdade**, por exemplo:

- O quê (título do anúncio / da procura)  
- Preço (se acordado no sistema)  
- Estado do bem (se conhecido)  
- Zona / bairro (se conhecido)  
- Próximo passo em linguagem simples (ex.: combinar encontro / contactar)

Acções pós-combinado (mínimo, **sem** pós-venda pesado): contactar se a política permitir; marcar concluído; cancelar acordo; manter anúncio se for serviço.  
**Classificação:** memória do acordo **NECESSÁRIA**; canal exacto de contacto **OPORTUNIDADE** / fase confiança.

---

## 10. “À tua espera” — continuidade comercial, não caixa de notificações

### Hipótese de separação (avaliada)

| Superfície | Função |
|------------|--------|
| **Feed** | Mercado **agora** (oferta e descoberta) |
| **À tua espera** | Relações comerciais **em curso** (memória operacional) |

**É forte?** Sim, se cada item responder: *o que é / estado / o que mudou / o que posso fazer agora*.  
Se virar feed de alertas vazios, **falha**.

**Alternativa superior só se:** fundir tudo no Feed com secção pinada no topo — mais simples hierarquicamente, mas mistura “agora” com “em curso” e enfraquece a metáfora. **Não eliminar** “À tua espera” sem piloto; manter como **NECESSÁRIA** conceptual; colocação exacta (Fluxos vs entrada própria) = **OPORTUNIDADE** de IA/layout.

### Conteúdo admitido

- Procuras (à procura / com respostas)  
- Interesses  
- Oportunidades (lado vendedor)  
- Em conversa / À espera do vendedor  
- Combinado  

**Excluir:** promoções genéricas, dicas vazias, “voltaste há 3 dias”.

---

## 11. Espera e vazios (matriz)

| Situação | Experiência | Classificação |
|----------|-------------|---------------|
| Nenhuma oferta | Procura activa + acções de ajuste | **CONSTITUCIONAL** / **NECESSÁRIA** |
| Oferta parcial | Rótulo honesto ou acção “alargar” | **NECESSÁRIA** / detalhe **OPORTUNIDADE** |
| Vendedor não responde | À espera do vendedor + sair/cancelar | **NECESSÁRIA** |
| Comprador não avança | À espera do comprador (vendedor) | **NECESSÁRIA** |
| Anúncio desaparece | Explicar indisponível; interest encerra ou actualiza | **NECESSÁRIA** |
| Preço muda | Mostrar valor actual do sistema | **NECESSÁRIA** |
| Procura expira | Renovar / encerrar | **NECESSÁRIA** |
| Utilizador cancela | Encerrar sem apagar histórico mínimo útil | **NECESSÁRIA** |
| Acordo cancelado | Estado Encerrado claro | **NECESSÁRIA** |
| Sem rede | Não fingir sync | **NECESSÁRIA** |
| Guest negoceia | Guest wall + **retoma** | **CONSTITUCIONAL** |
| Resposta sem listing ligado | Comprador vê texto; incentivar anúncio quando existir | **OPORTUNIDADE** |
| Dois matches iguais | Uma ficha de negociação (idempotência) | **NECESSÁRIA** |
| Utilizador é autor do anúncio | Não “interessar” em si mesmo | **NECESSÁRIA** |

---

## 12. Retoma pós-login — **CONSTITUCIONAL**

Guest descobre → acção de negócio → parede → login/registo → **regresso ao mesmo anúncio, procura ou fio de interesse**, não ao feed genérico por defeito.

---

## 13. Minguito — papel na jornada

| Entrada | Pensamento do utilizador | Classificação |
|---------|--------------------------|---------------|
| Negociar (anúncio) | Ajuda-me com **isto** | **CONSTITUCIONAL** |
| Encontrar (procura) | Procura **comigo** | **CONSTITUCIONAL** |
| Comparar | Ajuda-me a escolher entre **estes** | **NECESSÁRIA** |
| Negociação em curso | Ajuda-me a avançar **neste** estado | **NECESSÁRIA** |
| Aba geral vazia | Secundária | **CONSTITUCIONAL** (não protagonista) |

**Não esconder o mercado:** “3 opções” → 3 destinos reais. “Mais barata” → dados reais. “Aceita negociar” → estado real.

---

## 14. Confiança **dentro** da jornada (não página isolada)

Sinais só quando úteis e **verdadeiros:** conta, histórico quando existir, avaliações quando existirem, bairro.  
Ausência de histórico ≠ castigo.  
**CONSTITUCIONAL** progressiva; UI mínima **NECESSÁRIA**.

---

## 15. Retenção por motivo comercial

Pergunta certa: *existe relação comercial que justifique voltar?*

Motivos legítimos: nova correspondência na procura; resposta de vendedor; interesse no meu anúncio; negociação em curso; combinado a confirmar.

Proibido nesta etapa: streaks, pontos, ranking social, badges artificiais, feed infinito como retenção.

---

## 16. Primeiro sucesso (eventos, não vanity)

| Papel no momento | Primeiro sucesso |
|------------------|------------------|
| Comprador | Abriu ≥1 opção relevante no contexto da busca |
| Procurador | Gravou procura válida **ou** viu ≥1 correspondência real |
| Vendedor | Publicou oferta activa |
| Vendedor perante mercado | Recebeu ≥1 oportunidade relevante **ou** interesse |
| Negociação | Interesse/negociação **com contexto** (listing ou procura) |

**Classificação:** **NECESSÁRIA** para desenho; medição formal → Etapa 5.

---

## 17. Monetização e destaques (só fronteira)

Nesta etapa: descobrir, publicar (limites), procurar, negociar = sem paywall de continuidade.  
Destaque/patrocinado: preparado como rótulo futuro; **não** redefine jornadas aqui. **CONSTITUCIONAL**; detalhe → Etapa 4.

---

## 18. Matriz de decisões (síntese)

| Decisão | Resultado | Classificação |
|---------|-----------|---------------|
| Procura é objecto de mercado, não anexo mental de “Criar” | Sim | **CONSTITUCIONAL** + **NECESSÁRIA** |
| Match sistema ≠ resposta vendedor | Sempre separados na experiência | **CONSTITUCIONAL** |
| “À tua espera” como continuidade | Sim; não como notificações genéricas | **NECESSÁRIA** |
| Fecho = “Combinámos” leve | Sim; sem checkout | **NECESSÁRIA** |
| Estados humanos poucos e claros | Sim | **NECESSÁRIA** |
| Faixas de match parcial | Conceito sim; regra fina a validar | **OPORTUNIDADE** |
| Modo comprador/vendedor permanente | Não | **FORA DE ESCOPO** |
| Chat pesado pré-combinado | Não | **FORA DE ESCOPO** |
| Gamificação | Não | **FORA DE ESCOPO** |
| Redesign / código nesta etapa | Não | **FORA DE ESCOPO** |

---

## 19. Críticas e simplificações (liberdade de análise)

1. **Oito intenções** são úteis para desenho; na cabeça do utilizador bastam *comprar / procurar / vender / acompanhar*. As oito não devem gerar oito sítios.  
2. **Correspondência parcial** sem regra de matching alargada é só copy — ou alargamos com rótulo, ou só oferecemos “alargar filtros”. Evitar meio-termo confuso.  
3. **“Em conversa” vs Minguito:** se o único canal for Minguito local, o estado ainda deve existir; senão o utilizador vive limbo.  
4. **Oportunidade no perfil apenas** é fraca para J5; a continuidade (“À tua espera”) é o sítio certo para o vendedor **e** o comprador.  
5. **Não há evidência de piloto** sobre copy exacta dos estados — por isso linguagem é **NECESSÁRIA** na estrutura, **OPORTUNIDADE** no wording final.

---

## 20. Critérios de sucesso da experiência (fecho da etapa de desenho)

A experiência está alinhada à constituição quando:

1. Uma pessoa explica em uma frase o estado de cada item em “À tua espera”.  
2. Distingue anúncio que “encaixa” de “vendedor respondeu”.  
3. Em vazio de oferta, não se sente enganada e sabe ajustar ou esperar.  
4. Minguito nunca é a única prova de existência de um produto.  
5. Após login, não perde o anúncio/procura que motivou a conta.  
6. Existe memória pós-acordo (“Combinámos”) sem checkout.  
7. Há motivo comercial para voltar, sem gamificação.  
8. A pergunta “aproximar quem tem e quem precisa?” responde-se **sim** em pelo menos um caminho completo (A ou B) até estado Combinado ou Encerrado com clareza.

---

## 21. O que ainda precisaria de definição (poucos pontos)

Antes de chamar a **implementação** de jornadas “fechada”, faltam decisões finas (não bloqueiam o **desenho** desta etapa):

1. **Regra exacta de “correspondência próxima”** (números/zonas) — hoje conceptual.  
2. **Onde vive “À tua espera”** na navegação actual (Fluxos vs entrada dedicada).  
3. **Política de contacto** no estado Combinado (o que a app mostra vs WhatsApp).  
4. **Prazos de espera** (quando “À espera do vendedor” sugere cancelar) — **HIPÓTESE** até dados reais.

Nada disto reabre a tese constitucional.

---

## Decisão final

**ETAPA 3 — JORNADAS DE MERCADO: FECHADA**

**Justificação:** intenções, distinção match/interesse/resposta/acordo, jornadas dos dois lados, procura como objecto, espera e vazios, continuidade comercial, Minguito por contexto, fecho leve, retoma guest e retenção por motivo comercial estão **definidos** ao nível de experiência e classificados.  

**Não fechado apenas o detalhe operacional fino** dos quatro pontos da §21 — isso é refinamento de piloto / implementação, não ausência de visão de jornada.

*Próximo passo de produto (quando for pedido): Etapa 4 — Economia, ou implementação ordenada das jornadas sem alterar esta autoridade de experiência.*
