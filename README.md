# Guia Tailândia 🇹🇭

PWA de viagem **offline** para Cassiano & Felipe — roteiro de **19/11 → 05/12/2026** por Bangkok, Ayutthaya, Chiang Mai (Festival das Lanternas), Chiang Rai, Krabi, Phi Phi e Phuket.

Espelha os guias de [Puerto Varas](https://aleapc.github.io/guia-puerto-varas/) e [Uruguai](https://aleapc.github.io/guia-uruguai/): SvelteKit 2 + Svelte 5 + adapter-static + Tailwind + `@vite-pwa/sveltekit`.

## Rodar local
```bash
npm install
npm run dev      # http://localhost:5173
```

## Deploy (GitHub Pages)
```powershell
.\deploy.ps1     # build com BASE_PATH=/guia-tailandia e push para a branch gh-pages
```
Publica em `https://aleapc.github.io/guia-tailandia/`.

## O que tem
- **93 lugares curados** (templos, mercados, comida, praias, ilhas, festival das lanternas) com coordenadas, horários e dicas.
- **Roteiro dia-a-dia** (`/roteiro`) — os 17 dias, cada um amarrado aos lugares do guia.
- **"Nossa viagem"** (`/viagem`) — os viajantes **cadastram as próprias reservas** (voos, hospedagem, carro, seguro, documentos) direto no app. Fica **só no aparelho** (localStorage, offline) e dá pra **compartilhar com o parceiro** por um código no WhatsApp (prefixo `GTT1.`).
- Clima ao vivo (Open-Meteo), alertas por clima, conversor de moeda (THB), frases em tailandês, info prática (visto, eSIM, transporte, etiqueta, golpes), sincronização de favoritos/feitos entre os dois celulares.

## Estrutura
- `src/lib/content.ts` — trip + 13 categorias.
- `src/lib/contentExtra.ts` — 93 locais **auto-gerados** por `scripts/gen-thai.mjs` (fonte em JSON de pesquisa).
- `src/lib/itinerary.ts` — o roteiro fixo dos 17 dias.
- `src/lib/plan.ts` / `alerts.ts` — "sugestão de hoje" (dia do roteiro) e alertas por clima.
- `src/lib/tripData.svelte.ts` — store editável das reservas + share/import.
- `src/lib/usefulInfo.ts` — emergências (191 / 1155 / 1669) e blocos de info prática.

## Privacidade
O repositório é **público**, mas **nenhuma reserva vai pra internet**: voos, endereços e códigos ficam só no localStorage do aparelho (`gtl-*`, namespace próprio pra não colidir com os outros guias no mesmo domínio). O compartilhamento entre o casal é peer-to-peer via código no WhatsApp.
