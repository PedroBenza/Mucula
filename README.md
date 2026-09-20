# Mucula Web

Cliente HTML/CSS/JS modular. Port do produto Mucula (referência RN) com mecânica de mercado local (procura, negociação, limites, piloto).

## Arranque

Servir por HTTP (não `file://`):

```bash
npx serve .
```

Demo: `demo@mucula.local` / `demo1234`

API (opcional): `localStorage.setItem('mc_data_mode','api')` e `mc_api_url`.

## Fases de implementação neste cliente

| Fase | Conteúdo |
|------|----------|
| **1** | Higiene de assets + máquina de negociação congelada |
| **2** | Paridade create (3/4 passos), ranking, wide/priceHidden, detalhe |
| **3** | Economia piloto visível, seed Rangel/Maianga, telemetria de missão |

Docs: `docs/MUCULA_MANUAL_CONTINUIDADE.md`, `docs/MUCULA_ETAPA3_PILOTO_LOCAL.md`, `docs/MUCULA_NEGOTIATION_STATES.md`.

## Paths factuais (modo API)

- POST `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`
- GET `/users/me`, PATCH `/users/me/avatar`
- GET `/listings/feed`, GET `/listings/:id`, POST `/listings`, GET `/listings/mine`
- GET `/dashboard/mine`
- POST `/minguito/message`
