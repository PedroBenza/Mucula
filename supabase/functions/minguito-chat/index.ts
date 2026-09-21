/**
 * Edge Function — Minguito fala com Groq.
 * Preço / matched / floor NUNCA são decididos aqui.
 * Body: { message, deterministicReply, context }
 * Env: GROQ_API_KEY
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const SYSTEM = `És o Minguito, intermediário de negócios do Mucula (Angola).
Falas português de Angola, claro, curto e humano — sem gíria forçada.
REGRAS OBRIGATÓRIAS:
1. Nunca inventes preços. Só podes repetir valores que venham no contexto (ask, offer, floor só se te disserem explicitamente).
2. Nunca digas ao utilizador para contactar o vendedor ou o comprador. Tu és o intermediário.
3. Nunca confirmes acordo final nem digas "vendido". Quem confirma é o vendedor no Fluxo.
4. Nunca reveles o preço mínimo secreto (chão / floor) se o contexto não o listar como público.
5. Resposta: 1 a 3 frases curtas. Sem markdown, sem listas longas.
6. Se o contexto trouxer "deterministicReply", reformula essa ideia com a mesma intenção — não contradigas o motor.
7. Se não houver contexto de publicação, convida a abrir uma publicação no Feed e negociar contigo.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const key = Deno.env.get('GROQ_API_KEY');
    if (!key) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY em falta', skip: true }),
        { status: 503, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const message = String(body.message || '').slice(0, 800);
    const deterministicReply = String(body.deterministicReply || '').slice(0, 1200);
    const context = body.context || {};

    const userBlock = [
      'Contexto motor (JSON):',
      JSON.stringify(context).slice(0, 1500),
      '',
      'Resposta determinística a reformular (mantém o sentido):',
      deterministicReply || '(sem texto)',
      '',
      'Última mensagem do utilizador:',
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
          model: 'llama-3.1-8b-instant',
          temperature: 0.4,
          max_tokens: 220,
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
        JSON.stringify({ error: 'groq_http', detail: errText.slice(0, 200), skip: true }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const data = await groqRes.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() || deterministicReply;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e), skip: true }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
