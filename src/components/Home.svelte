<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { sortedProjects } from '../lib/model';
  import { dataFilePath } from '../lib/platform';
  import { plural } from '../lib/text';
  import { edgeOf } from '../lib/types';
  import Icon from './Icon.svelte';

  const decks = $derived(
    sortedProjects(app.data).map((p) => {
      const tasks = app.data.tasks.filter((t) => t.projectId === p.id);
      const done = tasks.filter((t) => t.done).length;
      return { ...p, edge: edgeOf(p.color), total: tasks.length, done, todo: tasks.length - done };
    })
  );
  const todoTotal = $derived(decks.reduce((n, d) => n + d.todo, 0));
  let path = $state('');
  dataFilePath().then((p) => (path = p));
</script>

<main class="home">
  <header>
    <div class="titles">
      <h1>Tes decks</h1>
      <p class="muted">
        {plural(decks.length, 'projet', 'projets')} · {plural(todoTotal, 'carte', 'cartes')} à jouer
      </p>
    </div>
    <div class="actions">
      <button class="btn icon" aria-label="Réglages" onclick={() => app.go({ name: 'settings' })}>
        <Icon name="gear" size={20} stroke={2} />
      </button>
      <button class="btn" onclick={() => app.enterCompact()}>
        <Icon name="pin" />
        Mode compact
      </button>
      <button class="btn primary" onclick={() => app.go({ name: 'recap' })}>
        <Icon name="deck" />
        Récap de la semaine
      </button>
    </div>
  </header>

  <div class="grid">
    {#each decks as d (d.id)}
      <button class="deck" onclick={() => app.go({ name: 'board', projectId: d.id })}>
        <span class="stack">
          <span class="b3" style:background={d.edge}></span>
          <span class="b2" style:background={d.edge}></span>
          <span class="front card-back" style:background-color={d.color}>
            <span class="frame">
              <span class="badge">
                <span class="count">{d.todo}</span>
                <span class="sub">À JOUER</span>
              </span>
            </span>
          </span>
        </span>
        <span class="info">
          <span class="dname">{d.name}</span>
          <span class="bar"><span style:width={d.total ? (d.done / d.total) * 100 + '%' : '0%'} style:background={d.color}></span></span>
          <span class="muted small">{plural(d.done, 'finie', 'finies')} sur {d.total}</span>
        </span>
      </button>
    {/each}

    <button class="deck new" onclick={() => (app.deckModal = { mode: 'create' })}>
      <span class="slot">
        <span class="plus"><Icon name="plus" size={26} stroke={2.6} /></span>
        <span class="slot-title">Nouveau deck</span>
      </span>
      <span class="info muted small">Un nom suffit.</span>
    </button>
  </div>

  <footer class="muted">
    <span>Sauvegarde locale : {path}</span>
    <span>Fini v0.1</span>
  </footer>
</main>

<style>
  .home {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 32px 48px 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
    flex-wrap: wrap;
  }
  .titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  h1 {
    font-size: 46px;
    letter-spacing: 0.5px;
  }
  p {
    margin: 0;
    font-size: 15px;
  }
  .actions {
    display: flex;
    gap: 12px;
  }
  .grid {
    flex: 1;
    overflow-y: auto;
    padding: 40px 48px 32px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
    gap: 40px 24px;
    align-content: start;
  }
  .deck {
    border: 0;
    background: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: left;
  }
  .stack {
    position: relative;
    width: 180px;
    height: 252px;
    display: block;
  }
  .stack > span {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    transition: transform 0.18s ease;
  }
  .b3 {
    transform: rotate(6deg) translateX(6px);
  }
  .b2 {
    transform: rotate(-4deg) translateX(-4px);
  }
  .deck:hover .b3 {
    transform: rotate(8deg) translateX(8px);
  }
  .deck:hover .b2 {
    transform: rotate(-7deg) translateX(-6px);
  }
  .deck:hover .front {
    transform: translateY(-10px) rotate(-1.5deg);
  }
  .front {
    box-shadow: 0 6px 0 var(--shadow);
    padding: 10px;
  }
  .frame {
    height: 100%;
    border: 3px solid rgba(255, 255, 255, 0.65);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .badge {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    background: var(--bg);
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.65);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .count {
    font-family: var(--display);
    font-size: 38px;
    line-height: 1;
  }
  .sub {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--soft);
  }
  .info {
    width: 180px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dname {
    font-weight: 600;
    font-size: 16px;
    line-height: 1.25;
    word-break: break-word;
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    border-radius: 4px;
  }
  .small {
    font-size: 13px;
  }
  .slot {
    width: 180px;
    height: 252px;
    border-radius: 14px;
    border: 3px dashed var(--line-strong);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: border-color 0.15s ease;
  }
  .new:hover .slot {
    border-color: var(--accent);
  }
  .plus {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slot-title {
    font-family: var(--display);
    font-size: 19px;
  }
  footer {
    padding: 12px 48px;
    border-top: 1px solid var(--surface-2);
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
</style>
