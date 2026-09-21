# Groq no Minguito (fase G)

## Princípio
- **Motor** (`minguito-mediate.js` + RPCs) decide preço, rounds, `setProposedPrice`.
- **Groq** só reformula o texto (`reply`). Se falhar, fica o texto determinístico.

## Deploy Edge Function
```bash
# No projecto Supabase (CLI)
supabase functions deploy minguito-chat --project-ref domkswueipwpyicebotc
supabase secrets set GROQ_API_KEY=gsk_... --project-ref domkswueipwpyicebotc
```

Dashboard → Edge Functions → `minguito-chat` → secret `GROQ_API_KEY`.

## Aceite
1. Sem secret: Minguito responde igual (texto motor).
2. Com secret: respostas mais naturais; **números de preço iguais** ao motor.
3. Nunca aparece contacto directo vendedor↔comprador.
