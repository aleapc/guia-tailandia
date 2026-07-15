<script lang="ts">
  import { browser } from '$app/environment';
  import TopBar from '$lib/components/TopBar.svelte';

  function loadNum(key: string, def: number): number {
    if (!browser) return def;
    const v = Number(localStorage.getItem(key));
    return v > 0 ? v : def;
  }
  // Taxas aproximadas (edite à vontade — ficam salvas).
  let thbPerUsd = $state(loadNum('gtl-rate-thb', 33));
  let brlPerUsd = $state(loadNum('gtl-rate-brl', 5.4));
  $effect(() => {
    if (browser) {
      localStorage.setItem('gtl-rate-thb', String(thbPerUsd));
      localStorage.setItem('gtl-rate-brl', String(brlPerUsd));
    }
  });

  const fmtTHB = (v: number) => Math.round(v).toLocaleString('en-US');
  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtUSD = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Aceita "1.000,00" (pt-BR), "1,000.00" (en-US), "1000", "10,5" etc.
  function parse(v: string): number {
    let s = String(v).trim().replace(/[^\d.,]/g, '');
    if (!s) return 0;
    const hasComma = s.includes(',');
    const hasDot = s.includes('.');
    if (hasComma && hasDot) {
      s = s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
    } else if (hasComma) {
      s = s.replace(',', '.');
    } else if (hasDot) {
      const parts = s.split('.');
      const thousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3);
      if (thousands) s = parts.join('');
    }
    const n = Number(s);
    return isFinite(n) ? n : 0;
  }

  let usd = $state(10); // fonte da verdade (em US$)
  let thbText = $state('');
  let brlText = $state('');
  let usdText = $state('');
  let editing = $state<'thb' | 'brl' | 'usd' | null>(null);

  $effect(() => {
    const c = fmtTHB(usd * thbPerUsd);
    const b = fmtBRL(usd * brlPerUsd);
    const u = fmtUSD(usd);
    if (editing !== 'thb') thbText = c;
    if (editing !== 'brl') brlText = b;
    if (editing !== 'usd') usdText = u;
  });

  function onInput(field: 'thb' | 'brl' | 'usd', raw: string) {
    editing = field;
    const v = parse(raw);
    if (field === 'thb') usd = v / thbPerUsd;
    else if (field === 'brl') usd = v / brlPerUsd;
    else usd = v;
    if (field === 'thb') thbText = raw;
    else if (field === 'brl') brlText = raw;
    else usdText = raw;
  }

  const field = 'w-full rounded-lg border border-deep/15 bg-white px-3 py-2 text-right text-lg font-semibold outline-none focus:border-teal';

  // Frases: português → tailandês (grafia) + pronúncia aproximada.
  const phrases: { group: string; items: [string, string, string][] }[] = [
    {
      group: 'Básico',
      items: [
        ['Olá / Oi', 'สวัสดี', 'sà-wàt-dii (+ kráp/kâ)'],
        ['Obrigado(a)', 'ขอบคุณ', 'khòp-khun (+ kráp/kâ)'],
        ['Sim / Não', 'ใช่ / ไม่', 'châi / mâi'],
        ['Desculpe / Com licença', 'ขอโทษ', 'khǒo-thôot'],
        ['Você fala inglês?', 'พูดภาษาอังกฤษได้ไหม', 'phûut paa-sǎa ang-grìt dâai mǎi'],
        ['Não entendi', 'ไม่เข้าใจ', 'mâi kâo-jai']
      ]
    },
    {
      group: 'No restaurante',
      items: [
        ['A conta, por favor', 'เช็คบิล', 'chék bin'],
        ['Sem pimenta', 'ไม่เผ็ด', 'mâi phèt'],
        ['Pouca pimenta', 'เผ็ดนิดหน่อย', 'phèt nít nòi'],
        ['Vegetariano (sem carne)', 'กินเจ', 'gin jay'],
        ['Delicioso!', 'อร่อย', 'a-ròi'],
        ['Água / gelada', 'น้ำ / น้ำเย็น', 'náam / náam yen']
      ]
    },
    {
      group: 'Na rua / transporte',
      items: [
        ['Onde fica…?', '…อยู่ที่ไหน', '…yùu thîi nǎi'],
        ['Banheiro', 'ห้องน้ำ', 'hông náam'],
        ['Ligue o taxímetro', 'เปิดมิเตอร์', 'pòet mí-dtôe'],
        ['Pare aqui', 'จอดตรงนี้', 'jòt dtrong níi'],
        ['Aeroporto', 'สนามบิน', 'sà-nǎam bin']
      ]
    },
    {
      group: 'Compras',
      items: [
        ['Quanto custa?', 'เท่าไหร่', 'thâo-rài'],
        ['Muito caro', 'แพงไป', 'phaeng bpai'],
        ['Tem desconto?', 'ลดได้ไหม', 'lót dâai mǎi'],
        ['Só estou olhando', 'ดูเฉยๆ', 'duu chǒei-chǒei']
      ]
    },
    {
      group: 'Emergência',
      items: [
        ['Ajuda!', 'ช่วยด้วย', 'chûai dûai'],
        ['Chame a polícia', 'เรียกตำรวจ', 'rîak dtam-rùat'],
        ['Hospital / médico', 'โรงพยาบาล', 'rohng-pha-yaa-baan'],
        ['Estou perdido(a)', 'หลงทาง', 'lǒng thaang']
      ]
    }
  ];
</script>

<TopBar title="Bolso do viajante" />

<main class="space-y-6 p-4 pb-14">
  <!-- Conversor -->
  <section>
    <h2 class="mb-2 text-lg font-bold">💱 Conversor</h2>
    <div class="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <label class="flex items-center gap-2">
        <span class="w-16 text-sm font-semibold text-deep/70">🇹🇭 THB</span>
        <input class={field} inputmode="decimal" value={thbText} oninput={(e) => onInput('thb', (e.target as HTMLInputElement).value)} onfocus={() => (editing = 'thb')} onblur={() => (editing = null)} />
      </label>
      <label class="flex items-center gap-2">
        <span class="w-16 text-sm font-semibold text-deep/70">🇧🇷 BRL</span>
        <input class={field} inputmode="decimal" value={brlText} oninput={(e) => onInput('brl', (e.target as HTMLInputElement).value)} onfocus={() => (editing = 'brl')} onblur={() => (editing = null)} />
      </label>
      <label class="flex items-center gap-2">
        <span class="w-16 text-sm font-semibold text-deep/70">🇺🇸 USD</span>
        <input class={field} inputmode="decimal" value={usdText} oninput={(e) => onInput('usd', (e.target as HTMLInputElement).value)} onfocus={() => (editing = 'usd')} onblur={() => (editing = null)} />
      </label>
      <div class="mt-2 grid grid-cols-2 gap-2 border-t border-deep/10 pt-2 text-xs text-deep/60">
        <label class="flex items-center gap-1">US$1 = <input class="w-20 rounded border border-deep/15 px-2 py-1 text-right" inputmode="decimal" value={thbPerUsd} oninput={(e) => (thbPerUsd = parse((e.target as HTMLInputElement).value) || thbPerUsd)} /> ฿</label>
        <label class="flex items-center gap-1">US$1 = R$<input class="w-16 rounded border border-deep/15 px-2 py-1 text-right" inputmode="decimal" value={brlPerUsd} oninput={(e) => (brlPerUsd = parse((e.target as HTMLInputElement).value) || brlPerUsd)} /></label>
      </div>
      <p class="text-[11px] text-deep/45">Taxas aproximadas e editáveis — confira a do dia antes de gastar. (1 THB ≈ R$0,17)</p>
    </div>
  </section>

  <!-- Dicas -->
  <section>
    <h2 class="mb-2 text-lg font-bold">💡 Dinheiro & dicas</h2>
    <ul class="divide-y divide-deep/5 rounded-2xl bg-white px-4 shadow-sm">
      <li class="flex items-start gap-3 py-3">
        <span class="mt-0.5 text-lg leading-none">💵</span>
        <p class="text-sm leading-relaxed text-deep/85">A moeda é o <strong>Baht</strong> (฿ / THB). Gorjeta não é obrigatória: arredonde a conta ou deixe <strong>~20-50 THB</strong>; em restaurantes bons, ~10%.</p>
      </li>
      <li class="flex items-start gap-3 py-3">
        <span class="mt-0.5 text-lg leading-none">🏧</span>
        <p class="text-sm leading-relaxed text-deep/85">ATMs cobram <strong>taxa fixa alta (220-350 THB)</strong> por saque. Saque bastante de uma vez (20.000-30.000 THB) pra diluir a taxa.</p>
      </li>
      <li class="flex items-start gap-3 py-3">
        <span class="mt-0.5 text-lg leading-none">💱</span>
        <p class="text-sm leading-relaxed text-deep/85">Melhor câmbio: casas <strong>SuperRich</strong> (verde/laranja) e <strong>Vasu</strong> — batem banco e aeroporto. Leve dólares limpos pra trocar.</p>
      </li>
      <li class="flex items-start gap-3 py-3">
        <span class="mt-0.5 text-lg leading-none">💳</span>
        <p class="text-sm leading-relaxed text-deep/85">Cartão em hotéis, malls e redes — mas <strong>street food, tuk-tuk, mercados e templos são só dinheiro</strong>. Ande com notas pequenas.</p>
      </li>
      <li class="flex items-start gap-3 py-3">
        <span class="mt-0.5 text-lg leading-none">🍺</span>
        <p class="text-sm leading-relaxed text-deep/85">Álcool em loja/mercado só é vendido das <strong>11h-14h</strong> e das <strong>17h-24h</strong> (fora disso, só em bares/restaurantes).</p>
      </li>
    </ul>
  </section>

  <!-- Frases -->
  <section>
    <h2 class="mb-2 text-lg font-bold">🗣️ Frases úteis (tailandês)</h2>
    <p class="mb-2 text-xs text-deep/55">Homens terminam frases com <b>kráp</b>, mulheres com <b>kâ</b> — soa mais educado.</p>
    <div class="space-y-3">
      {#each phrases as g (g.group)}
        <div class="rounded-2xl bg-white p-3 shadow-sm">
          <p class="mb-1 text-xs font-bold uppercase tracking-wide text-teal">{g.group}</p>
          <ul class="divide-y divide-deep/5">
            {#each g.items as [pt, th, roman] (roman)}
              <li class="flex items-baseline justify-between gap-3 py-1.5">
                <span class="shrink-0 text-sm text-deep/60">{pt}</span>
                <span class="text-right">
                  <span class="block text-sm font-semibold">{th}</span>
                  <span class="block text-[11px] text-deep/50">{roman}</span>
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </section>
</main>
