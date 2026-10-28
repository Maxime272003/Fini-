<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { deal } from '../lib/motion';
  import { plural } from '../lib/text';
  import { doneInWeek, formatShortDay, weekRange } from '../lib/week';
  import Icon from './Icon.svelte';

  // Par défaut : la semaine dernière, celle qu'on présente au point hebdo.
  let offset = $state(-1);
  let index = $state(0);
  let direction = $state(1);

  const range = $derived(weekRange(offset));
  const cards = $derived(
    doneInWeek(app.data, range).map((t) => {
      const p = app.data.projects.find((x) => x.id === t.projectId);
      return { ...t, project: p?.name ?? '', color: p?.color ?? '#3D7BFF' };
    })
  );
  const current = $derived(cards[index]);
  const byDeck = $derived.by(() => {
    const counts = new Map<string, { id: string; name: string; color: string; count: number }>();
    for (const c of cards) {
      const e = counts.get(c.projectId) ?? { id: c.projectId, name: c.project, color: c.color, count: 0 };
      e.count++;
      counts.set(c.projectId, e);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count);
  });

  function setWeek(o: number) {
    offset = Math.min(0, o);
    index = 0;
  }

  function go(i: number) {
    const n = cards.length;
    if (!n) return;
    direction = i < index ? -1 : 1;
    index = (i + n) % n;
  }

  function keydown(e: KeyboardEvent) {
    if (app.deckModal) return;
    if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
  }
</script>

<svelte:window onkeydown={keydown} />

<div class="recap">
  <header>
    <div class="title">
      <button class="btn icon" aria-label="Retour aux decks" onclick={() => app.go({ name: 'home' })}>
        <Icon name="back" size={20} stroke={2.4} />
      </button>
      <div>
        <h1>Récap de la semaine</h1>
        <span class="muted">{plural(cards.length, 'carte jouée', 'cartes jouées')}, tous decks confondus</span>
      </div>
    </div>
    <div class="weeks">
      <button class="wk" aria-label="Semaine précédente" onclick={() => setWeek(offset - 1)}>
        <Icon name="back" stroke={2.4} />
      </button>
      <div class="wk-label" aria-live="polite">
        <span class="wk-num">SEMAINE {range.week}</span>
        <span class="muted">{range.label}</span>
      </div>
      <button class="wk" aria-label="Semaine suivante" disabled={offset >= 0} onclick={() => setWeek(offset + 1)}>
        <Icon name="next" stroke={2.4} />
      </button>
    </div>
  </header>

  <div class="content">
    <section class="stage" aria-label="Deck des cartes finies">
      {#if current}
        <div class="row">
          <button class="nav" aria-label="Carte précédente" onclick={() => go(index - 1)}>
            <Icon name="back" size={22} stroke={2.6} />
          </button>

          <div class="stack">
            {#if cards.length > 2}
              <span class="behind b2" style:background={cards[(index + 2) % cards.length].color}></span>
            {/if}
            {#if cards.length > 1}
              <span class="behind b1" style:background={cards[(index + 1) % cards.length].color}></span>
            {/if}
            {#key current.id}
              <article class="big" style:background={current.color} in:deal={{ distance: 60 * direction }}>
                <div class="paper">
                  <div class="top">
                    <span class="tag" style:background={current.color}>{current.project}</span>
                    <span class="pos">{index + 1} / {cards.length}</span>
                  </div>
                  <p>{current.text}</p>
                  <div class="when">
                    <span class="seal"><Icon name="check" size={18} stroke={3.2} /></span>
                    Fini le {formatShortDay(current.doneAt!)}
                  </div>
                </div>
              </article>
            {/key}
          </div>

          <button class="nav primary" aria-label="Carte suivante" onclick={() => go(index + 1)}>
            <Icon name="next" size={22} stroke={2.6} />
          </button>
        </div>

        <div class="strip-wrap">
          <div class="strip">
            {#each cards as c, i (c.id)}
              <button
                class="mini"
                class:on={i === index}
                style:background={c.color}
                aria-label="Carte {i + 1} : {c.text}"
                aria-current={i === index}
                onclick={() => go(i)}
              ></button>
            {/each}
          </div>
          <span class="muted small">Flèches ← → du clavier pour dérouler</span>
        </div>
      {:else}
        <div class="empty">
          <span class="empty-card" aria-hidden="true"></span>
          <p>Aucune carte jouée cette semaine.</p>
        </div>
      {/if}
    </section>

    <aside class="summary" aria-label="Résumé par deck">
      <h2 class="label">PAR DECK</h2>
      {#each byDeck as b (b.id)}
        <div class="line">
          <span class="chip" style:background={b.color}></span>
          <span class="name">{b.name}</span>
          <span class="n">{b.count}</span>
        </div>
      {:else}
        <span class="muted small">Rien pour l’instant.</span>
      {/each}
      <hr />
      <div class="total">
        <span>Total</span>
        <span class="n accent">{cards.length}</span>
      </div>
    </aside>
  </div>
</div>

<style>
  .recap {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 20px 32px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .title div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  h1 {
    font-size: 32px;
  }
  .title .muted {
    font-size: 14px;
  }
  .weeks {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface);
    border-radius: 12px;
    padding: 6px;
  }
  .wk {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 8px;
    background: var(--surface-3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .wk:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .wk-label {
    min-width: 190px;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 13px;
  }
  .wk-num {
    font-family: var(--display);
    font-size: 18px;
    letter-spacing: 1px;
  }
  .content {
    flex: 1;
    min-height: 0;
    padding: 0 32px 24px;
    display: flex;
    gap: 28px;
  }
  .stage {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding-top: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 40px;
  }
  .nav {
    width: 56px;
    height: 56px;
    border: 0;
    border-radius: 50%;
    background: var(--surface-2);
    box-shadow: 0 4px 0 var(--shadow);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav.primary {
    background: var(--accent);
    color: var(--ink);
    box-shadow: 0 4px 0 var(--accent-edge);
  }
  .stack {
    position: relative;
    width: 290px;
    height: 400px;
  }
  .behind,
  .big {
    position: absolute;
    inset: 0;
    border-radius: 18px;
  }
  .b1 {
    transform: rotate(3.5deg) translate(11px, 3px);
    opacity: 0.8;
  }
  .b2 {
    transform: rotate(7deg) translate(22px, 6px);
    opacity: 0.55;
  }
  .big {
    padding: 10px;
    box-shadow: 0 8px 0 var(--shadow);
    display: flex;
  }
  .paper {
    flex: 1;
    min-width: 0;
    background: var(--paper);
    border-radius: 11px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    color: var(--ink);
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .tag {
    padding: 5px 10px;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pos {
    font-family: var(--display);
    font-size: 17px;
    color: var(--ink-muted);
    flex-shrink: 0;
  }
  p {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;
    overflow: hidden;
  }
  .when {
    margin-top: auto;
    border-top: 2px dotted var(--paper-line);
    padding-top: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
  }
  .seal {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .strip-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    max-width: 100%;
  }
  .strip {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    height: 62px;
    max-width: 100%;
    overflow-x: auto;
    padding: 0 4px;
  }
  .mini {
    width: 34px;
    height: 48px;
    flex-shrink: 0;
    border: 0;
    border-radius: 6px;
    padding: 0;
    box-shadow: 0 3px 0 var(--shadow);
    transition: transform 0.15s ease;
  }
  .mini:hover {
    transform: translateY(-4px);
  }
  .mini.on {
    transform: translateY(-12px);
    box-shadow: 0 0 0 3px var(--accent);
  }
  .small {
    font-size: 13px;
  }
  .empty {
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    color: var(--muted);
  }
  .empty p {
    font-size: 16px;
    font-weight: 500;
  }
  .empty-card {
    width: 180px;
    height: 252px;
    border-radius: 14px;
    border: 3px dashed var(--line-strong);
  }
  .summary {
    width: 270px;
    flex-shrink: 0;
    align-self: flex-start;
    background: var(--surface);
    border-radius: 18px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 5px 0 var(--shadow);
  }
  .summary h2 {
    color: var(--soft);
  }
  .line {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .chip {
    width: 18px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 4px;
    transform: rotate(-6deg);
  }
  .name {
    flex: 1;
    font-size: 15px;
    line-height: 1.25;
  }
  .n {
    font-family: var(--display);
    font-size: 21px;
  }
  .accent {
    color: var(--accent);
    font-size: 28px;
  }
  hr {
    width: 100%;
    border: 0;
    height: 1px;
    background: var(--line);
    margin: 0;
  }
  .total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 15px;
    font-weight: 600;
  }
</style>
