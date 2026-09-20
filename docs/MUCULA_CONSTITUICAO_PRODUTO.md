# CONSTITUIÇÃO ESTRATÉGICA DO PRODUTO — MUCULA

**Estatuto:** Este documento é a constituição estratégica do produto. Orienta produto, experiência, lógica de mercado, monetização, expansão e implementação técnica.

**Regra de melhoria:** Pode-se fortalecer a visão se a alternativa for mais sólida, simples, alcançável ou mensurável. **Não se pode diluí-la.**

**Regra de realidade:** Não copiar mecanicamente modelos estrangeiros. Confrontar cada premissa com a realidade de Angola e, inicialmente, Luanda (mobile-first, comércio informal, confiança entre desconhecidos, WhatsApp/redes, proximidade).

**Pergunta central:** Como tornar mais fácil, confiável e eficiente o encontro entre quem tem e quem precisa, começando por um bairro, e transformar liquidez local num negócio sustentável?

**Classificação de afirmações:** FACTO | HIPÓTESE | OPORTUNIDADE A VALIDAR | DECISÃO.

---

## 0. SUMÁRIO EXECUTIVO

O Mucula é infraestrutura de comércio local: aproxima oferta e procura com descoberta, contexto, negociação assistida e confiança progressiva.

Unidade de expansão: **bairro**, não país. Critério de expansão: **liquidez comercial real**, não só registos.

Minguito é **agente de contexto comercial** sobre o mercado — não o produto em si. O sistema (regras determinísticas) é a fonte da verdade comercial.

Dois movimentos do mesmo mercado: **Oferta encontra Procura** e **Procura chama Oferta**.

Monetização: valor acrescentado (destaque, ferramentas, serviços, eventualmente transação/logística). Acesso básico ao mercado permanece com baixa fricção.

Não construir agora: carteira própria, crédito, seguros, logística própria, marketplace financeiro, IA autónoma com poder comercial, expansão nacional prematura.

Stack de implementação (quando houver execução): cliente web modular existente + **Supabase** (dados, auth, realtime) + **Grok** (camada de linguagem do Minguito, subordinada a regras).

---

## 1. DEFINIÇÃO DO PRODUTO
### 1.1 O que é

DECISÃO: Mucula é uma plataforma de comércio local que organiza oferta, procura, descoberta, localização, contexto, negociação, confiança e correspondência entre comprador e vendedor — progressivamente até ao acordo.

Não é apenas «um app onde se colocam anúncios». É «um lugar onde aquilo que alguém tem encontra alguém que precisa».
### 1.2 Problema central

FACTO (comportamental, observação de mercado informal): oferta e procura existem mas estão **fragmentadas** (WhatsApp, Facebook, grupos, contactos, lojas).

HIPÓTESE: a fragmentação aumenta tempo até acordo, assimetria de informação e risco de confiança.

DECISÃO: o problema que o Mucula resolve é a **fragmentação da oferta e da procura local**, não a mera digitalização de uma montra.
### 1.3 Tese

«Mucula liga quem tem e quem precisa» — com percurso único: descoberta → interesse → negociação → match → negócio → confiança → liquidez → próximo território.
### 1.4 Unidade económica

DECISÃO: a unidade de valor não é só o anúncio. É a **correspondência comercial** (oferta + procura + contexto + confiança + acordo).

Indicador-mestre de missão: comércio que a plataforma **faz acontecer**, não volume bruto de listings.
### 1.5 Perfis

| Perfil | Necessidade primária | Fricção a evitar |
| --- | --- | --- |
| Comprador / quem precisa | Encontrar e chegar a acordo | Scroll infinito sem resultado |
| Vendedor ocasional | Publicar rápido e ser encontrado | Burocracia de onboarding |
| Vendedor frequente | Gerir oferta e leads | Mesma UX do ocasional sem ferramentas |
| Visitante (guest) | Explorar | Bloqueio total antes de valor |

---

## 2. CONSTITUIÇÃO DE PRINCÍPIOS (OBRIGATÓRIOS)

1. O Mucula aproxima oferta e procura — o objectivo não é acumular anúncios.
2. Descobrir deve ser simples: o utilizador deve poder dizer «preciso disto» e ser ajudado.
3. Publicar deve ser simples: entrada no mercado sem burocracia excessiva.
4. O bairro é vantagem competitiva: relevância, confiança e, mais tarde, logística — sem exposição irresponsável de localização exacta.
5. Confiança é parte do produto: histórico, reputação, confirmação, avaliações, rastreabilidade — progressivos, não barreiras iniciais.
6. Monetizar valor, não bloquear o mercado: pagar quando há valor adicional claro.
7. Minguito não é o produto; é camada de inteligência sobre o mercado.
8. O sistema é a fonte da verdade comercial; a IA não inventa preço, stock, acordo nem pagamento.
9. Expansão por evidência de liquidez local, não por mapa colorido.
10. Ficar no Mucula deve ser mais útil do que sair (defesa ao bypass por valor, não só por bloqueio de contacto).

---

## 3. DOIS MOVIMENTOS DO MESMO MERCADO
### 3.1 Oferta encontra procura

Vendedor publica → comprador descobre → Minguito ajuda (filtrar/comparar/negociar) → acordo → match.
### 3.2 Procura chama oferta (PRESERVAR)

Comprador publica necessidade estruturada → Mucula faz matching com ofertas e/ou notifica vendedores relevantes → vendedores respondem sob regras anti-spam → comprador compara → Minguito ajuda → acordo.

Isto não é «busca com outro nome». É mecanismo **PROCURA → OFERTA**.
### 3.3 Objecto «Procura» (mínimo viável)

| Campo | Obrigatório | Notas |
| --- | --- | --- |
| O que procura (texto + categoria) | Sim | Estruturar com ajuda do Minguito |
| Bairro / zona | Sim | Unidade geográfica |
| Orçamento máx. | Recomendado | Define intervalo de matching |
| Estado (novo/usado/qualquer) | Opcional | Filtro |
| Urgência | Opcional | Priorização de notificação |
| Estado da procura | Sim | activa | pausada | satisfeita | expirada |
### 3.4 Anti-spam e qualidade na resposta a procuras

- Limite de respostas por vendedor por procura e por dia.
- Só vendedores com oferta na categoria/zona (ou opt-in «recebo oportunidades»).
- Ranking de respostas por relevância (categoria, bairro, preço, reputação), não só por ordem de chegada.
- Comprador controla quem vê contacto até match.
- Medir: taxa de resposta útil, não só volume de respostas.
### 3.5 Incentivos ao vendedor responder

- Lead qualificado (orçamento e urgência visíveis de forma controlada).
- Sinal de procura real no bairro (escassez local).
- Futuro: prioridade a quem responde rápido e com qualidade (reputação de resposta).

---

## 4. MINGUITO — AGENTE DE CONTEXTO COMERCIAL
### 4.1 Papel

Minguito reduz fricção entre «preciso», «encontrei» e «acordei». Actua em: descobrir, filtrar, comparar, negociar dentro de regras, estruturar acordo, encaminhar para o vendedor/chat.
### 4.2 Separação de poderes

| Camada | Pode | Não pode |
| --- | --- | --- |
| Minguito (Grok + prompts + tools) | Interpretar, orientar, comparar, propor dentro de intervalo | Inventar preço, stock, desconto fora de regra, acordo final, pagamento, entrega |
| Sistema (Supabase + regras) | Preço, estado, identidades, histórico, disponibilidade, P_min | Ser substituído por texto livre da IA |
### 4.3 Pontos de entrada

- A partir de um listing («negociar / perguntar ao Minguito» com contexto do anúncio).
- A partir de uma procura («Encontrar com o Minguito»).
- Pergunta livre no separador Minguito (descoberta assistida), sempre com ligação a dados reais do catálogo quando afirmar existência de oferta.
### 4.4 Integração Grok (DECISÃO de arquitectura de produto)

DECISÃO: a geração de linguagem do Minguito usa **Grok** (API xAI) como modelo de diálogo.

DECISÃO: cada resposta comercial material (listagens citadas, preços, estados) deve ser **fundamentada** em leituras do sistema (queries Supabase / ferramentas), não em memória alucinada.

DECISÃO: ferramentas permitidas ao agente: search_listings, get_listing, search_demands, get_negotiation_rules, propose_price_within_bounds — nunca write_price sem validação server-side.

---

## 5. DESCOBERTA (MERCADO, NÃO REDE SOCIAL)

O feed serve o mercado. Camadas legítimas:

- Perto de ti — oferta no bairro / proximidade.
- Para ti — sinais legítimos de interesse (HIPÓTESE de ranking até haver dados).
- Acabou de chegar — recência.
- Procurados — necessidades activas (face pública controlada).
- Oportunidades — preço/condição/proximidade relevantes.
- Serviços perto de ti — forte dependência de proximidade.
- Destaques / patrocinado — rotulados com transparência.

---

## 6. LOCALIZAÇÃO

| Nível | Uso | Exposição |
| --- | --- | --- |
| Bairro | Descoberta pública, matching | Público |
| GPS / coordenadas | Create opcional, ordenação «perto» | Não no feed público em precisão total |
| Ponto de encontro | Após match / confiança | Só participantes |

DECISÃO: GPS nunca obrigatório para publicar. Bairro é a unidade pública.

---

## 7. CONFIANÇA PROGRESSIVA

1. Conta criada (guest → registado).
2. Telefone confirmado.
3. Histórico de actividade / negócios.
4. Avaliações entre partes.
5. Verificações adicionais (comerciante) quando o volume o justificar.

Benefícios crescem com confiança; o início permanece acessível.

---

## 8. PREÇO, COMISSÃO E REGRAS DETERMINÍSTICAS

DECISÃO: regras críticas de preço e disponibilidade vivem no sistema.

HIPÓTESE de modelo v1: preço de montra + piso de negociação derivado de mínimo do vendedor e política de plataforma.

Minguito só propõe dentro de [P_min, P_montra] (ou política explícita).

Comissão sobre transação protegida = **opcional** e faseada — não bloqueia o mercado P2P básico (alinhado a bypass realista).

---

## 9. ESTADOS DE NEGÓCIO (ESQUELETO ÚNICO)

| Estado | Significado |
| --- | --- |
| interest | Interesse explícito num listing ou resposta a uma procura |
| negotiating | Propostas em curso (assistidas ou directas) |
| agreed_buyer | Comprador alinhado dentro das regras |
| pending_seller | Vendedor notificado; falta confirmação |
| matched | Ambas as partes alinhadas; chat/encontro liberados segundo política |
| closed | Concluído ou cancelado com motivo |

Uma negociação referencia no máximo: listing e/ou procura, buyer, seller, preço proposto, estado, timestamps.

---

## 10. MONETIZAÇÃO

Regra: **monetizar valor acrescentado, não o acesso básico.**

| Camada | Utilizador | Receita |
| --- | --- | --- |
| Descobrir | Gratuito | — |
| Publicar | Gratuito dentro de limites | — |
| Negociar / contactar controlado | Gratuito / rate limit | — |
| Destacar / impulsionar | Opcional | Receita de visibilidade |
| Ferramentas profissionais | Opcional | Subscrição (fase posterior) |
| Transação protegida | Opcional | Comissão/taxa (quando houver capacidade) |
| Logística / hub | Opcional | Margem (só com volume) |

Visibilidade paga: transparência de rótulo patrocinado; equilíbrio com orgânico; limites para não destruir relevância.

---

## 11. BYPASS

DECISÃO: não assumir que se impede contacto fora da app. Estratégia principal: valor residual dentro do Mucula (histórico, reputação, clareza de acordo, conveniência, futuras protecções).

---

## 12. LIQUIDEZ E BAIRRO SAUDÁVEL
### 12.1 Métricas de liquidez (núcleo)

- Oferta activa (listings).
- Procura activa.
- Interessados / respostas.
- Tempo até primeira resposta.
- Negociações iniciadas.
- Acordos / matches.
- % de procuras com ≥1 oferta relevante (métrica de missão).
- Recorrência de utilizadores que voltam a publicar ou procurar.
### 12.2 Bairro saudável

DECISÃO: thresholds **empíricos** após bairro piloto — não inventar números agora. Expansão ao bairro seguinte só com evidência de liquidez + resposta + algum fluxo de acordo.
### 12.3 Ciclo e pontos de quebra

Mais vendedores → oferta → utilidade → compradores → procura → negócios → confiança → vendedores. Quebras típicas: oferta sem procura no bairro; procura sem resposta; negociação sem fecho; perda de confiança por fraude.

---

## 13. MÉTRICAS (CINCO GRUPOS)

| Grupo | Exemplos |
| --- | --- |
| Aquisição | Novos compradores/vendedores, origem |
| Liquidez | Activos, procuras, tempo de resposta |
| Conversão | View → interesse → negociação → acordo |
| Confiança | Verificações, reviews, denúncias, conflitos |
| Economia | GMV, receita, retenção, frequência (quando houver dados) |

---

## 14. RESTRIÇÕES — NÃO CONSTRUIR AGORA

- Carteira própria, crédito, seguros.
- Logística própria / hub operacional pesado.
- Marketplace financeiro.
- IA com autoridade comercial autónoma.
- Grande ad-stack.
- Expansão nacional prematura.
- Dezenas de categorias hiper-especializadas.
- Gamificação pesada.

Hub físico = consequência de volume, não fundamento.

---

## 15. REALIDADE ANGOLANA (CONTEXTO)

FACTO (fontes públicas de mercado digital, ordem de grandeza 2025): internet e mobile em escala nacional; comércio digital ainda condicionado por confiança, pagamento e entrega; peso do comércio social; pagamentos digitais em crescimento (ex.: sistemas de transferência instantânea).

HIPÓTESE: o utilizador Mucula já negocia por WhatsApp; o produto deve comprimir essa jornada, não fingir que ela não existe.

DECISÃO: mobile-first; bairro; baixa fricção; confiança progressiva; monetização não punitiva.

---

## 16. ARQUITECTURA ESTRATÉGICA (LÓGICA, NÃO CÓDIGO)

```
                    MUCULA
                       │
         ┌─────────────┴─────────────┐
         │                           │
      QUEM TEM                   QUEM PRECISA
         │                           │
      Ofertas                      Procuras
         │                           │
         └─────────────┬─────────────┘
                       │
                  DESCOBERTA
                       │
                   MINGUITO
                       │
                  NEGOCIAÇÃO
                       │
                    MATCH
                       │
              NEGÓCIO / SERVIÇO
                       │
         ┌─────────────┴─────────────┐
         │                           │
     CONFIANÇA                   VALOR EXTRA
   reputação/histórico         destaque/ferramentas
                               (futuro: transação/hub)
```

Expansão: BAIRRO → LIQUIDEZ → CONFIANÇA → NEGÓCIOS → RECEITA → PRÓXIMO BAIRRO.

---

## 17. FASES DE IMPLEMENTAÇÃO (PRODUTO + TECH)

Regra de execução: cada entrega responde a (1) que problema comercial resolve? (2) como medimos se funcionou?
### Fase 0 — Constituição e alinhamento

- Este documento.
- Congelar restrições.
- Escolher bairro piloto (DECISÃO operacional humana).
### Fase 1 — Mercado mínimo sólido no cliente actual (local)

- Manter feed, create produto/serviço, detalhe, perfil, fluxos.
- Introduzir objecto Procura (UI + armazenamento local) e CTA «Encontrar com o Minguito».
- CTA no detalhe do listing para negociação contextual.
- Estados de negociação mínimos em localStorage.
- Não exigir Supabase ainda para provar UX.
### Fase 2 — Backend Supabase (fonte de verdade)

- Auth (email/telefone conforme viável).
- Tabelas: profiles, listings, demands (procuras), negotiations, messages, reports.
- RLS: utilizador só escreve o seu; leitura pública de listings activos; negociações só participantes.
- Realtime para mensagens e actualização de estado de negociação.
- Storage para media de listings.
- Migrar modo local → sync quando sessão autenticada.
### Fase 3 — Minguito + Grok em produção

- Edge Function / backend que recebe mensagem + negotiation_id / demand_id.
- Server monta contexto (listing/demand/regras) e chama Grok.
- Validação server-side de qualquer proposta de preço.
- Logs de auditoria (sem gravar dados desnecessários).
### Fase 4 — Liquidez piloto

- Onboarding vendedores e procuras no bairro piloto.
- Medir % procuras com oferta relevante, tempo de resposta, matches.
- Ajustar matching e anti-spam.
### Fase 5 — Monetização leve

- Destaque / impulso de listing com rótulo transparente.
- Limites gratuitos de publicação se necessário para abuso.
- Ainda sem comissão obrigatória em todo P2P.
### Fase 6 — Confiança e profissionais

- Telefone verificado, avaliações pós-match.
- Ferramentas leves para vendedor frequente (métricas, gestão).
### Fase 7 — Expansão de bairro e futuros

- Critérios empíricos de bairro saudável.
- Hub/logística e transação protegida só com evidência (OPORTUNIDADE A VALIDAR).

---

## 18. SUPABASE — MAPA DE DOMÍNIO (PRODUTO)

DECISÃO: Supabase como backend principal de dados, auth e realtime na fase de servidor.

| Entidade | Responsabilidade |
| --- | --- |
| profiles | Identidade, bairro, confiança |
| listings | Oferta (produto/serviço), preço, media, estado |
| demands | Procura estruturada |
| negotiations | Estados e vínculos oferta/procura |
| negotiation_events | Auditoria de propostas (sistema) |
| messages | Chat pós-política de match |
| promotions | Campanhas de visibilidade pagas |
| reports | Denúncias |

HIPÓTESE: Edge Functions para Minguito (Grok) e webhooks de notificação.

---

## 19. GROK — POLÍTICA DE USO NO MINGUITO

- Grok gera linguagem e raciocínio de ajuda comercial.
- Toda afirmação sobre existência de anúncio/preço deve vir de tool/query.
- Recusar inventar vendedores ou stocks.
- Tom alinhado à identidade Minguito já presente no produto (contexto angolano, directo, útil).
- Fallback se API indisponível: respostas baseadas só em regras + listagens cached, com mensagem de limitação.

---

## 20. CONTRADIÇÕES IDENTIFICADAS E RESOLUÇÃO

| Tensão | Resolução na constituição |
| --- | --- |
| Comissão em toda venda vs bypass WhatsApp | Comissão só em valor acrescentado/transação protegida; básico gratuito |
| Minguito negocia vs IA não é verdade | Negocia dentro de P_min; sistema grava acordo |
| Procura chama oferta vs spam | Rate limits, matching por categoria/zona, qualidade |
| Confiança vs fricção de registo | Progressiva; guest vê; acções de negócio pedem conta |
| Anúncios pagos vs feed útil | Rótulo + quotas de mistura orgânico/patrocinado |
| Hub físico ambicioso vs operação | Congelado até volume |

---

## 21. MELHORIAS EM RELAÇÃO AOS DOCUMENTOS DE ORIGEM

1. Unificação explícita dos dois textos numa única constituição executável.
2. Separação FACTO / HIPÓTESE / OPORTUNIDADE / DECISÃO.
3. Procura como objecto de domínio de primeira classe (não só feature de busca).
4. Minguito + Grok subordinados a regras e tools (anti-alucinação comercial).
5. Supabase como mapa de domínio alinhado à liquidez e negociação.
6. Fases de implementação auditáveis sem big-bang.
7. Métrica de missão: % de procuras com oferta relevante.
8. Rejeição explícita de complexidade pré-liquidez.

---

## 22. ETAPAS DE TRABALHO FUTURO (SEM IMPLEMENTAR AGORA)

1. Etapa 1 — Constituição (este documento) — FECHAR.
2. Etapa 2 — Mecânica detalhada Oferta ↔ Procura ↔ Matching ↔ Negociação ↔ Acordo.
3. Etapa 3 — Jornadas de experiência (comprar, vender, procurar, negociar, fechar).
4. Etapa 4 — Economia detalhada (preçários de destaque, limites free).
5. Etapa 5 — Métricas, eventos, bairro saudável, PMF local.
6. Etapa 6 — Mapa VISÃO vs PRODUTO ACTUAL (JÁ EXISTE / EVOLUIR / FALTA / NÃO CONSTRUIR).

---

## 23. GLOSSÁRIO

| Termo | Definição |
| --- | --- |
| Oferta / Listing | Anúncio de produto ou serviço |
| Procura / Demand | Necessidade estruturada publicada |
| Match | Alinhamento suficiente para contacto/encontro segundo política |
| Liquidez | Capacidade do território gerar fluxos oferta-procura-acordo |
| P_min | Piso determinístico de negociação |
| Minguito | Agente de contexto comercial |
| Bairro piloto | Primeiro território de prova de liquidez |

---

## 24. ADOÇÃO

A partir da aceitação deste documento, decisões de produto e de implementação devem poder apontar a uma secção aqui.

Alterações à constituição exigem registo do que muda e porquê (melhoria permitida; diluição proibida).

**Estado:** CONSTITUIÇÃO v1 — consolidada a partir dos dois textos de origem + reforço operacional (Supabase, Grok, fases).

---

## ANEXO A — CATÁLOGO DE EVENTOS DE PRODUTO (PARA MÉTRICAS)

| Evento | Descrição | Grupo |
| --- | --- | --- |
| auth_sign_up | Registo concluído | Aquisição |
| auth_login | Login | Aquisição |
| listing_view | Abriu detalhe de anúncio | Conversão |
| listing_create | Publicou oferta | Liquidez |
| listing_promote | Comprou destaque | Economia |
| demand_create | Publicou procura | Liquidez |
| demand_match_shown | Viu pelo menos uma oferta relevante | Missão |
| interest_start | Iniciou interesse/negociação | Conversão |
| negotiation_message | Mensagem na negociação | Conversão |
| negotiation_propose | Proposta de preço registada pelo sistema | Conversão |
| negotiation_matched | Estado matched | Conversão |
| message_user_user | Chat directo | Conversação |
| review_submit | Avaliação | Confiança |
| report_submit | Denúncia | Confiança |
| minguito_open | Abriu Minguito | Engajamento |
| minguito_tool_search | Minguito consultou catálogo | Qualidade IA |

---

## ANEXO B — POLÍTICA DE MATCHING PROCURA→OFERTA (ESBOÇO OPERACIONAL)

1. Filtrar listings activos pela mesma categoria (ou pai) da procura.
2. Filtrar por bairro igual ou adjacente (tabela de adjacência do piloto).
3. Filtrar por preço <= orçamento * factor (ex. 1.15) se orçamento existir — factor a validar.
4. Ordenar por: match de bairro, proximidade de preço, recência, reputação do vendedor.
5. Limitar N resultados na primeira resposta Minguito (ex. 5–8) para decisão humana.
6. Se zero resultados: informar lacuna de oferta e opção de notificar vendedores opt-in da categoria (OPORTUNIDADE A VALIDAR).

---

## ANEXO C — MATRIZ RACI SIMPLIFICADA

| Decisão | Produto | Engenharia | Operações bairro |
| --- | --- | --- | --- |
| Princípios constituição | A | C | I |
| Bairro piloto | A | I | R |
| Schema Supabase | C | A | I |
| Política Grok/Minguito | A | R | I |
| Preçário destaques | A | C | C |
| Moderação denúncias | A | C | R |

R = Responsible, A = Accountable, C = Consulted, I = Informed.

---

## ANEXO D — CRITÉRIOS DE ACEITAÇÃO POR FASE (AUDITÁVEIS)
### Fase 1

- Utilizador cria procura com campos mínimos.
- CTA Encontrar com Minguito devolve opções só a partir de dados reais locais.
- Listing detalhe inicia negociação com estado interest.
### Fase 2

- Listing e demand persistem em Supabase com RLS testado.
- Utilizador A não lê negociação de B.
- Media de listing no Storage.
### Fase 3

- Minguito cita apenas listings devolvidos por tool.
- Proposta fora de P_min rejeitada pelo servidor.
- Fallback sem Grok documentado.
### Fase 4

- Dashboard interno com % procuras com oferta relevante no piloto.
- Tempo mediano até primeira resposta registado.
### Fase 5

- Destaque visível e rotulado.
- Receita de destaque registada.

---

## ANEXO E — RISCOS E MITIGAÇÕES (TABELA MESTRE)

| Risco | Severidade | Mitigação |
| --- | --- | --- |
| Alucinação comercial da IA | Alto | Tools + validação server-side + logs |
| Spam em procuras | Alto | Rate limit + matching + reputação |
| Cold start bairro | Alto | Concentrar aquisição; seed de ofertas reais |
| Bypass total | Médio | Valor in-app; não depender só de bloqueio |
| Fraude de anúncios | Alto | Report + moderação + confiança progressiva |
| Desequilíbrio ads vs orgânico | Médio | Quotas e rótulos |
| Complexidade prematura | Alto | Lista de não construir agora |
| Dupla verdade local/servidor | Médio | Supabase como verdade após Fase 2 |
| Privacidade GPS | Médio | Bairro público; preciso só pós-match |
| Dependência WhatsApp | Médio | Comprimir jornada; aceitar coexistência |

---

## ANEXO F — RELAÇÃO COM O PRODUTO WEB ACTUAL (PREVIEW ETAPA 6)

| Área | Classificação preliminar |
| --- | --- |
| Feed, categorias, hero, search | JÁ EXISTE — evoluir ranking/procura |
| Create produto/serviço, upload local | JÁ EXISTE — evoluir preço/piso/comissões quando houver política |
| Minguito chat local | PRECISA EVOLUIR — contexto listing/demand + Grok + tools |
| Procura como objecto | FALTA |
| Negociação com estados | FALTA / parcial |
| Chat user-user | FALTA |
| Destaques pagos | FALTA (hook promo no feed existe) |
| Supabase | FALTA (planeado Fase 2) |
| Carteira/hub/crédito | NÃO DEVE SER CONSTRUÍDO AGORA |

---

## ANEXO G — CHECKLIST DE NÃO DILUIÇÃO

- Qualquer feature nova aponta para oferta, procura, matching, confiança ou liquidez local?
- Aumenta fricção do básico sem valor claro? Se sim, rejeitar ou adiar.
- Minguito continua subordinado ao sistema?
- Expansão exige métrica de bairro ou só ambição geográfica?
- Monetização é opcional e legível?

---

## ANEXO H — DEFINIÇÕES OPERACIONAIS DE «OFERTA RELEVANTE»

DECISÃO provisória para medição: uma oferta é relevante para uma procura se partilha categoria (ou mapeamento explícito), está activa, e (se orçamento existir) preço ≤ orçamento × 1,15, e bairro igual ou adjacente.

OPORTUNIDADE A VALIDAR: o factor 1,15 e a tabela de adjacência no piloto.

---

## ANEXO I — RUNBOOK FASE 2 (SUPABASE) — ORDEM DE TRABALHO
1. Criar projecto Supabase e ambientes (dev/prod).
2. Auth providers mínimos (email; telefone se viável no país).
3. Tabela profiles com bairro e flags de confiança.
4. Tabela listings com RLS de leitura pública selectiva e write do owner.
5. Tabela demands com RLS owner + leitura controlada para matching.
6. Tabela negotiations + negotiation_events.
7. Tabela messages com RLS participantes.
8. Storage buckets e políticas de upload de imagens de listing.
9. Edge Function healthcheck.
10. Seed controlado só de dados de teste no dev.
11. Testes de RLS (utilizador cruzado não lê).
12. Ligar cliente web: modo api + sessão Supabase.
13. Plano de migração a partir de dados localStorage (export/import manual no piloto).
14. Monitorização básica de erros auth e RLS.

---

## ANEXO J — RUNBOOK FASE 3 (GROK + MINGUITO)
1. Definir system prompt Minguito (mercado local, não inventar dados).
2. Implementar tools de leitura apenas.
3. Implementar endpoint server-side que injeta contexto da negociação/procura.
4. Validar propostas de preço contra P_min no servidor.
5. Testes: pergunta sem listing → não inventa stock.
6. Testes: proposta abaixo de P_min → rejeitada.
7. Testes: API Grok down → fallback.
8. Limitar tokens e custo por utilizador/dia (proteção abuso).
9. Registo de métricas minguito_open e tool_search.
10. Revisão humana de amostra de conversas no piloto.

---

## ANEXO K — PERGUNTAS DE VALIDAÇÃO NO BAIRRO PILOTO

1. Os vendedores voltam a publicar na semana seguinte?
2. As procuras recebem pelo menos uma resposta útil em X horas?
3. Os compradores encontram algo relevante sem sair para WhatsApp grupos na primeira tentativa?
4. O Minguito reduz passos até ao contacto ou só conversa sem resultado?
5. Há denúncias ou padrões de fraude?
6. O destaque pago é compreendido e usado sem destruir o feed?

---

## 25. ENCERRAMENTO DA ETAPA 1

Esta constituição consolida os dois documentos de origem, preserva **Procura chama Oferta**, o **Minguito como agente de contexto**, a **monetização por valor**, a **expansão por bairros**, as **restrições de não construir agora**, e define o caminho **Supabase + Grok** sem transformar a IA em fonte de verdade comercial.

Etapa 1: **completa para adopção**. Não avança automaticamente para implementação de código sem decisão explícita de passar à Etapa 2 ou à tradução para o produto existente.

## ANEXO L — DEFINIÇÕES DETALHADAS DE MÉTRICAS


| ID | Definição | Cadência | Grupo |


| --- | --- | --- | --- |


| listings_active | Count listings com estado activo no território | Diário | Liquidez |


| demands_active | Count procuras activas não expiradas | Diário | Liquidez |


| demand_coverage_rate | Procuras com ≥1 oferta relevante / procuras activas | Diário | Missão |


| time_to_first_response_h | Mediana horas até primeira resposta útil a procura ou interesse | Semanal | Liquidez |


| negotiation_start_rate | Interesses / views de detalhe | Semanal | Conversão |


| match_rate | Matches / negociações iniciadas | Semanal | Conversão |


| seller_response_rate | Vendedores que respondem / notificados | Semanal | Liquidez |


| repeat_publisher_7d | Vendedores que publicam de novo em 7 dias | Semanal | Retenção |


| repeat_seeker_7d | Compradores com nova procura ou interesse em 7 dias | Semanal | Retenção |


| report_rate | Denúncias / listings activos | Semanal | Confiança |


| promote_attach_rate | Listings com destaque / listings criados | Mensal | Economia |


| minguito_grounding_rate | Respostas com tool_search / respostas Minguito | Semanal | Qualidade IA |


## ANEXO M — POLÍTICA DE DADOS E MINIMIZAÇÃO


- Recolher só o necessário para matching, confiança e segurança.
- Telefone: para verificação e contacto pós-match; não expor no feed.
- GPS preciso: opt-in; não publicar coordenadas exactas no anúncio público.
- Conversas Minguito: reter o necessário para suporte e melhoria; não vender dados.
- Logs de tools: para auditoria de grounding; prazo de retenção a definir no piloto.
- Direito a apagar conta e anúncios: processo manual no piloto, automatizado depois.


## ANEXO N — TABELA DE DECISÕES BLOQUEADAS ATÉ FASE


| Decisão | Bloqueada até |


| --- | --- |


| Comissão obrigatória em todo P2P | Existir transação protegida e valor percebido |


| Hub físico operacional | Volume de matches e pedido real de intermediação logística |


| Subscrição profissional completa | Base de vendedores frequentes no piloto |


| Crédito / carteira | Nunca na fase actual — restrição constitucional |


| Expansão multi-cidade | Bairro piloto líquido + segundo bairro validado |


| IA com escrita livre de preço no DB | Nunca — só via regras |


## ANEXO O — CENÁRIOS DE TESTE DE PRODUTO (ACEITAÇÃO HUMANA)


1. Comprador em Cazenga publica procura de máquina de solda até 150k; vê opções só se existirem listings reais compatíveis.


2. Vendedor publica botija de gás no bairro; aparece em Perto de ti para utilizador do mesmo bairro.


3. Minguito afirma «há 3 opções»; utilizador confirma que as 3 existem no feed/detalhe.


4. Proposta abaixo do piso é recusada com mensagem clara.


5. Guest vê feed; ao negociar encontra guest wall; após login retoma contexto.


6. Destaque pago mostra rótulo patrocinado.


7. Utilizador denuncia anúncio; report fica registado.


## ANEXO P — ALINHAMENTO CLIENTE ACTUAL (MUCULA WEB)


Referência ao estado do cliente HTML/JS modular e modo local já entregue:


- Preservar identidade visual e fluxos de feed/create/perfil/fluxos.
- Evoluir Minguito de chat simulado para agente com tools quando Supabase+Grok estiverem activos.
- Não apagar modo local até API estável — constitui rede de segurança de demo.
- CONTINUIDADE.md técnico permanece documento de engenharia; esta constituição manda no produto.


## ANEXO Q — GLOSSÁRIO ESTENDIDO


**Correspondência comercial:** Encontro útil oferta-procura com caminho a acordo


**Grounding:** Resposta da IA baseada em dados obtidos por tools/sistema


**P_min:** Piso determinístico de preço para propostas


**Bairro adjacente:** Vizinho geográfico na tabela do piloto


**Opt-in de oportunidades:** Vendedor aceita ser notificado de procuras


**Liquidez:** Densidade de fluxos comerciais reais no território


**Valor acrescentado:** Serviço pago que o utilizador percebe como vantagem


**Fonte da verdade:** Sistema/DB, não o texto gerado pelo modelo


## ANEXO R — DECLARAÇÃO DE ADOPÇÃO


Ao adoptar este ficheiro como constituição, a equipa compromete-se a: (1) não diluir a tese local de liquidez; (2) preservar Procura chama Oferta; (3) manter Minguito como camada, não como produto substituto; (4) monetizar valor; (5) expandir por evidência; (6) implementar Supabase e Grok dentro das fases e restrições aqui escritas.


**Versão:** 1.0  
**Etapa:** 1 — Constituição do produto — ENCERRADA PARA ADOPÇÃO  
**Próximo passo autorizado sem código:** Etapa 2 (mecânica de mercado) ou Etapa 6 (mapa visão vs produto actual), por decisão explícita.


## ANEXO S — TESTES AOS SEIS PRINCÍPIOS (PERGUNTAS SIM/NÃO)


1. Esta alteração aumenta encontros úteis oferta-procura ou só vanity metrics?


2. Um utilizador novo consegue descobrir sem treino?


3. Publicar continua possível em poucos minutos?


4. O bairro continua a ser vantagem e a privacidade de localização está respeitada?


5. A confiança aumenta sem criar barreira de entrada injustificada?


6. A monetização proposta é opcional e legível como valor extra?
