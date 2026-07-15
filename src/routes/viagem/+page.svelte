<script lang="ts">
  import { onMount } from 'svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import {
    tripPlan,
    loadTrip,
    saveTrip,
    replaceTrip,
    tripIsEmpty,
    encodeTrip,
    decodeTrip,
    tripWhatsappUrl,
    type TripPlan
  } from '$lib/tripData.svelte';

  type FieldDef = { k: string; label: string; ph?: string; type?: 'text' | 'textarea' | 'tel' };
  type SectionKey = 'flights' | 'lodgings' | 'cars' | 'insurances';
  type Section = {
    key: SectionKey;
    title: string;
    emoji: string;
    single: string;
    fields: FieldDef[];
    heading: (it: Record<string, string>) => string;
    telField?: string;
    mapField?: string;
    emailField?: string;
  };

  const SECTIONS: Section[] = [
    {
      key: 'flights', title: 'Voos', emoji: '✈️', single: 'voo',
      heading: (it) => it.journey || `${it.from || '?'} → ${it.to || '?'}`,
      fields: [
        { k: 'journey', label: 'Trecho', ph: 'Ida · GRU → BKK' },
        { k: 'date', label: 'Data', ph: '19/11/2026' },
        { k: 'airline', label: 'Companhia', ph: 'ex.: Qatar Airways' },
        { k: 'flightNo', label: 'Voo nº', ph: 'ex.: QR 774' },
        { k: 'from', label: 'Origem', ph: 'São Paulo (GRU)' },
        { k: 'to', label: 'Destino', ph: 'Bangkok (BKK)' },
        { k: 'depart', label: 'Partida', ph: 'ex.: 01h30' },
        { k: 'arrive', label: 'Chegada', ph: 'ex.: 18h05 (+1)' }
      ]
    },
    {
      key: 'lodgings', title: 'Hospedagem', emoji: '🏨', single: 'hospedagem',
      heading: (it) => it.name || 'Hospedagem',
      telField: 'phone', mapField: 'address',
      fields: [
        { k: 'name', label: 'Nome', ph: 'ex.: The Quarter Ari Hotel' },
        { k: 'kind', label: 'Tipo', ph: 'Hotel / Airbnb / hostel' },
        { k: 'address', label: 'Endereço', ph: 'rua, bairro, cidade' },
        { k: 'checkin', label: 'Check-in', ph: '19/11/2026' },
        { k: 'checkout', label: 'Check-out', ph: '23/11/2026' },
        { k: 'code', label: 'Código da reserva', ph: 'ex.: ABC123' },
        { k: 'host', label: 'Anfitrião/contato', ph: 'nome' },
        { k: 'phone', label: 'Telefone', ph: '+66 ...', type: 'tel' },
        { k: 'note', label: 'Observações', ph: 'café incluso, etc.', type: 'textarea' }
      ]
    },
    {
      key: 'cars', title: 'Aluguel de carro', emoji: '🚗', single: 'carro',
      heading: (it) => it.company || 'Locadora',
      telField: 'phone', mapField: 'pickup',
      fields: [
        { k: 'company', label: 'Locadora', ph: 'ex.: Avis' },
        { k: 'confirmation', label: 'Confirmação', ph: 'nº de confirmação' },
        { k: 'code', label: 'Reserva', ph: 'nº da reserva' },
        { k: 'pickup', label: 'Retirada (local)', ph: 'aeroporto / endereço' },
        { k: 'pickupAt', label: 'Retirada (data/hora)', ph: '27/11 10h' },
        { k: 'dropoff', label: 'Devolução (local)', ph: 'aeroporto / endereço' },
        { k: 'dropoffAt', label: 'Devolução (data/hora)', ph: '30/11 10h' },
        { k: 'phone', label: 'Telefone', ph: '+66 ...', type: 'tel' },
        { k: 'note', label: 'Observações', ph: 'seguro, franquia...', type: 'textarea' }
      ]
    },
    {
      key: 'insurances', title: 'Seguro viagem', emoji: '🛟', single: 'seguro',
      heading: (it) => it.insured || it.company || 'Seguro',
      telField: 'phone', emailField: 'email',
      fields: [
        { k: 'company', label: 'Seguradora', ph: 'ex.: Assist Card' },
        { k: 'insured', label: 'Segurado', ph: 'nome de quem está coberto' },
        { k: 'policy', label: 'Nº do bilhete/apólice', ph: 'ex.: 123456' },
        { k: 'plan', label: 'Plano', ph: 'ex.: Ásia 60' },
        { k: 'validity', label: 'Validade', ph: '19/11 a 05/12/2026' },
        { k: 'phone', label: 'Telefone assistência', ph: '+66 ...', type: 'tel' },
        { k: 'email', label: 'E-mail', ph: 'contato@...' },
        { k: 'note', label: 'Observações', ph: 'cobertura, franquia...', type: 'textarea' }
      ]
    }
  ];

  const sectionByKey = (k: SectionKey) => SECTIONS.find((s) => s.key === k)!;

  // --- edição ---
  let editing = $state<{ key: SectionKey; index: number } | null>(null);
  let draft = $state<Record<string, string>>({});
  let docsDraft = $state('');
  let editingDocs = $state(false);

  function openAdd(key: SectionKey) {
    const blank: Record<string, string> = {};
    for (const f of sectionByKey(key).fields) blank[f.k] = '';
    draft = blank;
    editing = { key, index: -1 };
  }
  function openEdit(key: SectionKey, index: number) {
    draft = { ...(tripPlan[key][index] as Record<string, string>) };
    editing = { key, index };
  }
  function cancelEdit() {
    editing = null;
    draft = {};
  }
  function saveEdit() {
    if (!editing) return;
    const { key, index } = editing;
    const item = { ...draft };
    const arr = tripPlan[key] as Record<string, string>[];
    if (index < 0) arr.push(item);
    else arr[index] = item;
    saveTrip();
    cancelEdit();
  }
  function removeItem(key: SectionKey, index: number) {
    (tripPlan[key] as unknown[]).splice(index, 1);
    saveTrip();
    if (editing && editing.key === key) cancelEdit();
  }

  function startDocs() {
    docsDraft = tripPlan.docsNote;
    editingDocs = true;
  }
  function saveDocs() {
    tripPlan.docsNote = docsDraft;
    saveTrip();
    editingDocs = false;
  }

  // --- compartilhar / importar ---
  let showShare = $state(false);
  let shareCode = $state('');
  let pasted = $state('');
  let msg = $state('');
  let incoming = $state<TripPlan | null>(null); // aguardando confirmação de importação

  function openShare() {
    shareCode = encodeTrip();
    showShare = true;
    msg = '';
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(shareCode);
      msg = '📋 Código copiado!';
    } catch {
      msg = '❌ Não consegui copiar — use o botão do WhatsApp.';
    }
  }
  function tryImport(code: string) {
    const t = decodeTrip(code);
    if (!t) {
      msg = '❌ Código inválido — confira se copiou inteiro (começa com GTT1.).';
      return;
    }
    incoming = t;
    msg = '';
  }
  function confirmImport() {
    if (incoming) {
      replaceTrip(incoming);
      incoming = null;
      pasted = '';
      msg = '✅ Reservas carregadas do parceiro!';
    }
  }
  function cancelImport() {
    incoming = null;
  }

  const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const tel = (p: string) => `tel:${p.replace(/[^+0-9]/g, '')}`;

  onMount(() => {
    loadTrip();
    // Link mágico: /viagem#t=CODIGO abre a confirmação de importação.
    const m = location.hash.match(/t=([^&]+)/);
    if (m) {
      tryImport(decodeURIComponent(m[1]));
      history.replaceState(null, '', location.pathname + location.search);
    }
  });

  const empty = $derived(tripIsEmpty());
  // campos "extras" a mostrar no card (fora do título), apenas os preenchidos
  function detailFields(s: Section, it: Record<string, string>): FieldDef[] {
    return s.fields.filter((f) => it[f.k] && f.k !== s.fields[0].k);
  }
</script>

<TopBar title="Nossa viagem" />

<main class="space-y-5 p-4 pb-20">
  <!-- Intro -->
  <div class="rounded-2xl bg-gradient-to-br from-teal to-forest p-4 text-white shadow-sm">
    <p class="font-bold">✈️ Suas reservas, no seu bolso</p>
    <p class="mt-1 text-sm text-white/90">
      Cadastrem aqui voos, hospedagem, carro e seguro. Fica guardado <strong>só neste aparelho</strong>
      (funciona offline, nada vai pra internet). Um cadastra e <strong>compartilha com o outro</strong> pelo WhatsApp.
    </p>
  </div>

  {#if empty}
    <div class="rounded-2xl border border-dashed border-deep/25 bg-white p-5 text-center">
      <span class="text-3xl">📥</span>
      <p class="mt-2 font-semibold">Ainda sem reservas</p>
      <p class="mt-1 text-sm text-deep/60">Toque em “+ Adicionar” em cada seção pra cadastrar, ou receba as reservas do parceiro no botão abaixo.</p>
    </div>
  {/if}

  <!-- Botão importar do parceiro (sempre visível) -->
  <button onclick={openShare} class="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm">
    <span class="text-2xl">🔄</span>
    <span class="flex-1 text-sm font-semibold">Compartilhar / receber reservas do parceiro</span>
    <span class="text-deep/40">›</span>
  </button>

  <!-- Seções -->
  {#each SECTIONS as s (s.key)}
    <section>
      <div class="mb-2 flex items-center justify-between">
        <h2 class="text-lg font-bold">{s.emoji} {s.title}</h2>
        <button onclick={() => openAdd(s.key)} class="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white">+ Adicionar</button>
      </div>

      <div class="space-y-2">
        {#each tripPlan[s.key] as it, i (i)}
          {@const item = it as Record<string, string>}
          <div class="rounded-2xl bg-white p-4 shadow-sm">
            <div class="flex items-start justify-between gap-2">
              <p class="font-bold leading-tight">{s.heading(item)}</p>
              <div class="flex shrink-0 gap-1">
                <button onclick={() => openEdit(s.key, i)} class="rounded-lg border border-deep/15 px-2 py-1 text-xs font-semibold text-deep/70" aria-label="Editar">✏️</button>
                <button onclick={() => removeItem(s.key, i)} class="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600" aria-label="Excluir">🗑️</button>
              </div>
            </div>
            {#if detailFields(s, item).length}
              <dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {#each detailFields(s, item) as f (f.k)}
                  <dt class="text-deep/50">{f.label}</dt>
                  <dd class="text-deep/85">{item[f.k]}</dd>
                {/each}
              </dl>
            {/if}
            <div class="mt-2 flex flex-wrap gap-2">
              {#if s.mapField && item[s.mapField]}
                <a href={maps(item[s.mapField])} target="_blank" rel="noopener" class="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white">🗺️ Mapa</a>
              {/if}
              {#if s.telField && item[s.telField]}
                <a href={tel(item[s.telField])} class="rounded-lg border border-deep/20 px-3 py-1.5 text-xs font-semibold text-deep">📞 Ligar</a>
              {/if}
              {#if s.emailField && item[s.emailField]}
                <a href={`mailto:${item[s.emailField]}`} class="rounded-lg border border-deep/20 px-3 py-1.5 text-xs font-semibold text-deep">✉️ E-mail</a>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}

  <!-- Documentos / observações gerais -->
  <section>
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-lg font-bold">📄 Documentos & anotações</h2>
      {#if !editingDocs}
        <button onclick={startDocs} class="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white">{tripPlan.docsNote ? 'Editar' : '+ Adicionar'}</button>
      {/if}
    </div>
    {#if editingDocs}
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <textarea bind:value={docsDraft} rows="5" placeholder="Nº do passaporte, TDAC, comprovantes, contatos, o que quiserem ter à mão…" class="w-full rounded-lg border border-deep/15 p-2 text-sm outline-none focus:border-teal"></textarea>
        <div class="mt-2 flex gap-2">
          <button onclick={saveDocs} class="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white">Salvar</button>
          <button onclick={() => (editingDocs = false)} class="rounded-lg border border-deep/20 px-4 py-2 text-sm font-semibold text-deep/70">Cancelar</button>
        </div>
      </div>
    {:else if tripPlan.docsNote}
      <div class="whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-relaxed text-deep/80 shadow-sm">{tripPlan.docsNote}</div>
    {/if}
  </section>

  <p class="text-center text-[11px] text-deep/40">
    As reservas ficam guardadas neste aparelho, fora da internet. Protegidas pelo bloqueio do próprio celular.
  </p>
</main>

<!-- Modal de edição -->
{#if editing}
  {@const s = sectionByKey(editing.key)}
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
    <button class="absolute inset-0 bg-black/50" aria-label="Fechar" onclick={cancelEdit}></button>
    <div class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-sand p-4 shadow-2xl sm:rounded-3xl">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-bold">{editing.index < 0 ? `Novo ${s.single}` : `Editar ${s.single}`} {s.emoji}</h3>
        <button onclick={cancelEdit} class="text-3xl leading-none text-deep/50" aria-label="Fechar">×</button>
      </div>
      <div class="space-y-2.5">
        {#each s.fields as f (f.k)}
          <label class="block">
            <span class="text-xs font-semibold text-deep/60">{f.label}</span>
            {#if f.type === 'textarea'}
              <textarea bind:value={draft[f.k]} rows="2" placeholder={f.ph} class="mt-0.5 w-full rounded-lg border border-deep/15 bg-white px-3 py-2 text-sm outline-none focus:border-teal"></textarea>
            {:else}
              <input
                bind:value={draft[f.k]}
                inputmode={f.type === 'tel' ? 'tel' : 'text'}
                placeholder={f.ph}
                class="mt-0.5 w-full rounded-lg border border-deep/15 bg-white px-3 py-2 text-sm outline-none focus:border-teal"
              />
            {/if}
          </label>
        {/each}
      </div>
      <div class="mt-4 flex gap-2">
        <button onclick={saveEdit} class="flex-1 rounded-lg bg-teal py-2.5 font-semibold text-white">Salvar</button>
        {#if editing.index >= 0}
          <button onclick={() => removeItem(editing.key, editing.index)} class="rounded-lg border border-red-300 px-4 py-2.5 font-semibold text-red-600">Excluir</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal compartilhar / importar -->
{#if showShare}
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
    <button class="absolute inset-0 bg-black/50" aria-label="Fechar" onclick={() => (showShare = false)}></button>
    <div class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-sand p-4 shadow-2xl sm:rounded-3xl">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-lg font-bold">🔄 Compartilhar reservas</h3>
        <button onclick={() => (showShare = false)} class="text-3xl leading-none text-deep/50" aria-label="Fechar">×</button>
      </div>

      {#if incoming}
        <div class="rounded-2xl border border-teal bg-teal/5 p-3">
          <p class="text-sm font-semibold">📥 Reservas recebidas do parceiro:</p>
          <p class="mt-1 text-sm text-deep/75">
            {incoming.flights.length} voo(s), {incoming.lodgings.length} hospedagem(ns),
            {incoming.cars.length} carro(s) e {incoming.insurances.length} seguro(s).
          </p>
          <p class="mt-1 text-xs text-red-600">Isto substitui as reservas atuais deste aparelho.</p>
          <div class="mt-2 flex gap-2">
            <button onclick={confirmImport} class="flex-1 rounded-lg bg-teal py-2 text-sm font-semibold text-white">Carregar essas</button>
            <button onclick={cancelImport} class="rounded-lg border border-deep/20 px-4 py-2 text-sm font-semibold text-deep/70">Cancelar</button>
          </div>
        </div>
      {/if}

      <section class="mt-3 rounded-2xl bg-white p-3 shadow-sm">
        <h4 class="font-bold">📤 Mandar as minhas</h4>
        <p class="mt-1 text-sm text-deep/70">Envie pro parceiro; ele abre o link e o app carrega tudo.</p>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <a href={tripWhatsappUrl(shareCode)} target="_blank" rel="noopener" class="rounded-xl bg-forest p-3 text-center text-sm font-semibold text-white">📲 WhatsApp</a>
          <button onclick={copyCode} class="rounded-xl border border-deep/20 p-3 text-sm font-semibold">📋 Copiar código</button>
        </div>
      </section>

      <section class="mt-3 rounded-2xl bg-white p-3 shadow-sm">
        <h4 class="font-bold">📥 Receber do parceiro</h4>
        <p class="mt-1 text-sm text-deep/70">Cole aqui o código (começa com <code>GTT1.</code>) que ele te mandou.</p>
        <textarea bind:value={pasted} rows="3" placeholder="GTT1...." class="mt-2 w-full rounded-lg border border-deep/15 p-2 text-xs outline-none focus:border-teal"></textarea>
        <button onclick={() => tryImport(pasted)} class="mt-2 w-full rounded-lg bg-teal py-2 text-sm font-semibold text-white">Ler código</button>
      </section>

      {#if msg}<p class="mt-3 text-center text-sm font-medium">{msg}</p>{/if}
    </div>
  </div>
{/if}
