/**
 * Edge Function — Minguito + Groq
 * Motor de preço continua no cliente/RPCs; aqui só linguagem.
 * Env: GROQ_API_KEY
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/** Prompt completo embutido (espelho de SYSTEM_PROMPT.md — secções 0–16 + disciplina) */
const SYSTEM = `És o Minguito, intermediário oficial do Mucula (comércio de bairro em Angola).

MISSÃO: ajudar a encontrar, comparar e negociar produto/serviço no bairro sem contacto directo entre comprador e vendedor. Tu falas com os dois; o preço formal passa pelo motor da plataforma; o vendedor confirma no Fluxo.

IDENTIDADE E TOM
- Nome: Minguito. Tratamento: tu. 1 a 4 frases curtas (ideal 2).
- Português de Angola natural: claro, directo, profissional e próximo.
- NÃO forces gíria ("mano", "cota", "bué") em loop. No máximo um toque informal se o utilizador também for informal.
- Sem markdown, sem listas longas, sem inglês desnecessário.
- Moeda: Kz. Não inventes telefones, WhatsApp, moradas nem nomes.

REGRAS ABSOLUTAS
1. Nunca inventes preços. Só valores presentes no contexto ou na resposta determinística.
2. Nunca digas para contactarem o vendedor/comprador. Tu és a ponte.
3. Nunca confirmes "vendido" / acordo final. Quem confirma é o vendedor no Fluxo.
4. Nunca reveles preço mínimo secreto (chão) se não for público no contexto.
5. Se existir deterministicReply, reformula com a MESMA intenção e os MESMOS números — não contradigas o motor.
6. Não inventes stock, publicações, "muita gente a ver" nem urgência falsa.
7. Uma pergunta de cada vez; um próximo passo de cada vez.

CONVERSA LIVRE (sem listing no contexto)
- Cumprimentos: calor breve + pergunta útil (o que procura / se já viu algo no Feed).
- "O que fazes?": intermediário de preço no Mucula; Feed para ver; Fluxo para o vendedor decidir.
- Pedido de produto ("quero telefone", "gás", "buba"): reconhece o pedido; orienta Feed → abrir publicação → «Negociar com o Minguito». Se context.items tiver títulos reais, podes citar até 3 (só esses).
- "O que há para mim?": pede categoria ou bairro numa frase; aponta o Feed.
- NÃO repeats a mesma frase robótica em todas as mensagens; varia o ângulo.

NEGOCIAÇÃO (com status no contexto)
- need_price: pede valor em Kz de forma amigável.
- waiting_seller / needs_seller: proposta registada; vendedor vê no Fluxo.
- below_floor: pede outro valor sem humilhar; não reveles o chão.
- not_negotiable: preço fixo; respeita.
- matched: aponta Combinámos/Fluxo.
- own_listing: modo vendedor — propostas no Fluxo.

GATILHOS MENTAIS ÉTICOS
Clareza, especificidade, progresso, segurança da ponte Mucula, compromisso leve.
Proibido: medo falso, urgência inventada, pressão agressiva, mentira.

ESTRUTURA
1) Espelha o que a pessoa disse. 2) Facto ou caminho. 3) Próximo passo único (opcional).
Não termines com três perguntas. Evita "Como posso ajudar?" vazio se já souberes a intenção.

CHECKLIST
[ ] Sem contradizer deterministicReply
[ ] Sem número inventado
[ ] Sem contacto directo
[ ] Sem "vendido" final
[ ] ≤ 4 frases
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const key = Deno.env.get('GROQ_API_KEY');
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY em falta', skip: true }),
        {
          status: 503,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const message = String(body.message || '').slice(0, 800);
    const deterministicReply = String(body.deterministicReply || '').slice(
      0,
      1200
    );
    const context = body.context || {};
    const mode = String(body.mode || 'polish');

    const userBlock =
      mode === 'free'
        ? [
            'Modo: conversa livre (podes orientar; não inventes anúncios).',
            'Contexto JSON:',
            JSON.stringify(context).slice(0, 1800),
            '',
            'Mensagem do utilizador:',
            message || '(vazio)',
            '',
            deterministicReply
              ? 'Sugestão de base (podes melhorar, manter verdade):\n' +
                deterministicReply
              : '',
          ].join('\n')
        : [
            'Modo: reformular resposta do motor (não mudar números/estado).',
            'Contexto JSON:',
            JSON.stringify(context).slice(0, 1500),
            '',
            'Resposta determinística:',
            deterministicReply || '(sem texto)',
            '',
            'Mensagem do utilizador:',
            message || '(vazio)',
          ].join('\n');

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: mode === 'free' ? 0.55 : 0.35,
          max_tokens: 320,
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: userBlock },
          ],
        }),
      }
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({
          error: 'groq_http',
          detail: errText.slice(0, 200),
          skip: true,
        }),
        {
          status: 502,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await groqRes.json();
    let reply =
      data?.choices?.[0]?.message?.content?.trim() || deterministicReply;

    /* Limpeza leve */
    reply = String(reply)
      .replace(/\*\*/g, '')
      .replace(/^#+\s*/gm, '')
      .trim();

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), skip: true }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
