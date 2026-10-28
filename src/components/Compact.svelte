<script lang="ts">
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { app } from '../lib/app.svelte';
  import { addTask, doneTasks, setDone, sortedProjects, todoTasks } from '../lib/model';
  import { motionOn } from '../lib/motion';
  import { cardTextSize, plural } from '../lib/text';
  import type { Task } from '../lib/types';
  import CardZoom from './CardZoom.svelte';
  import { edgeOf } from '../lib/types';
  import Icon from './Icon.svelte';

  const projects = $derived(sortedProjects(app.data));
  const project = $derived(projects.find((p) => p.id === app.compactProjectId));
  const color = $derived(project?.color ?? '#3D7BFF');
  const todo = $derived(project ? todoTasks(app.data, project.id) : []);
  const done = $derived(project ? doneTasks(app.data, project.id) : []);
  const total = $derived(todo.length + done.length);

  let text = $state('');

  const pad = (i: number) => String(i + 1).padStart(2, '0');

  // Zoom au survol pour les cartes dont le texte est coupé (même principe que sur le plateau).
  let zoom = $state<{ task: Task; badge: string; rect: DOMRect } | null>(null);
  let zoomTimer: ReturnType<typeof setTimeout> | undefined;

  function showZoom(el: HTMLElement, task: Task, badge: string, delay: number) {
    clearTimeout(zoomTimer);
    const t = el.querySelector<HTMLElement>('.text');
    if (!t || t.scrollHeight <= t.clientHeight + 1) return;
    zoomTimer = setTimeout(() => (zoom = { task, badge, rect: el.getBoundingClientRect() }), delay);
  }

  function hideZoom() {
    clearTimeout(zoomTimer);
    zoom = null;
  }

  function add(e: SubmitEvent) {
    e.preventDefault();
    if (!project || !text.trim()) return;
    const id = project.id;
    app.mutate((d) => addTask(d, id, text));
    text = '';
  }

  function undoLast() {
    const last = done.at(-1);
    if (last) app.mutate((d) => setDone(d, last.id, false));
  }

  // Carte finie dans le widget : elle rétrécit sur place, les autres glissent pour combler.
  function shrink(node: Element) {
    if (!motionOn()) return { duration: 0 };
    return scale(node, { duration: 260, start: 0.6, easing: cubicOut });
  }
</script>

<div class="compact">
  {#if projects.length === 0}
    <div class="empty">
      <p>Crée d’abord un deck dans la grande fenêtre.</p>
      <button class="btn primary" onclick={() => app.exitCompact()}>Ouvrir Fini</button>
    </div>
  {:else}
    <div class="head">
      <div class="select-wrap" style:--deck={color}>
        <span class="chip" style:background={color} aria-hidden="true"></span>
        <label class="sr-only" for="deck-select">Deck</label>
        <select id="deck-select" bind:value={app.compactProjectId}>
          {#each projects as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
        <span class="caret" aria-hidden="true"><Icon name="down" size={16} stroke={2.4} /></span>
      </div>
      <div class="progress">
        <div class="track"><div style:width={total ? (done.length / total) * 100 + '%' : '0%'} style:background={color}></div></div>
        <span class="muted">{todo.length} à jouer · {plural(done.length, 'finie', 'finies')}</span>
      </div>
    </div>

    <div class="cards">
      {#each todo as t, i (t.id)}
        <button
          class="mini"
          style:background={color}
          aria-label="Finir : {t.text}"
          animate:flip={{ duration: motionOn() ? 300 : 0, easing: cubicOut }}
          out:shrink
          onclick={() => (hideZoom(), app.mutate((d) => setDone(d, t.id, true)))}
          onmouseenter={(e) => showZoom(e.currentTarget, t, pad(i), 400)}
          onmouseleave={hideZoom}
          onfocus={(e) => e.currentTarget.matches(':focus-visible') && showZoom(e.currentTarget, t, pad(i), 0)}
          onblur={hideZoom}
        >
          <span class="paper">
            <span class="num" style:color={edgeOf(color)}>{pad(i)}</span>
            <span class="text {cardTextSize(t.text)}">{t.text}</span>
          </span>
        </button>
      {/each}
      {#if done.length}
        <button
          class="mini done card-back"
          style:background-color={color}
          aria-label="Remettre en jeu la dernière carte finie : {done.at(-1)?.text}"
          onclick={undoLast}
        >
          <span class="frame">
            <span class="seal"><Icon name="check" size={16} stroke={3.2} /></span>
            <span class="fini">FINI · {done.length}</span>
          </span>
        </button>
      {/if}
    </div>

    {#if zoom}
      <CardZoom text={zoom.task.text} badge={zoom.badge} {color} rect={zoom.rect} />
    {/if}

    <form class="add" onsubmit={add}>
      <label class="sr-only" for="quick-add">Nouvelle carte</label>
      <input id="quick-add" type="text" placeholder="Nouvelle carte…" maxlength="200" bind:value={text} />
      <button class="go" aria-label="Poser la carte" disabled={!text.trim()}>
        <Icon name="plus" size={20} stroke={2.8} />
      </button>
    </form>
  {/if}
</div>

<style>
  .compact {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .head {
    padding: 14px 14px 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .select-wrap {
    position: relative;
    height: 46px;
    border-radius: 10px;
    background: var(--surface);
    box-shadow: 0 3px 0 var(--shadow);
    display: flex;
    align-items: center;
  }
  .chip {
    position: absolute;
    left: 12px;
    width: 16px;
    height: 22px;
    border-radius: 4px;
    transform: rotate(-6deg);
    pointer-events: none;
  }
  select {
    appearance: none;
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    padding: 0 40px 0 40px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
  }
  select option {
    background: var(--surface);
  }
  .caret {
    position: absolute;
    right: 12px;
    display: flex;
    pointer-events: none;
  }
  .progress {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
  }
  .track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .track div {
    height: 100%;
    transition: width 0.3s ease;
  }
  .cards {
    flex: 1;
    overflow-y: auto;
    padding: 6px 14px 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 104px;
    gap: 12px;
    align-content: start;
  }
  .mini {
    border: 0;
    padding: 5px;
    border-radius: 10px;
    box-shadow: 0 4px 0 var(--shadow);
    display: flex;
    text-align: left;
    transition: transform 0.12s ease;
  }
  .mini:hover {
    transform: translateY(-3px);
  }
  .paper {
    flex: 1;
    min-width: 0;
    background: var(--paper);
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--ink);
    overflow: hidden;
  }
  .num {
    font-family: var(--display);
    font-size: 14px;
  }
  .text {
    font-size: 13px;
    font-weight: 500;
    line-height: 1.3;
    overflow: hidden;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .text.m,
  .text.s {
    font-size: 11.5px;
    line-height: 1.25;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }
  .done {
    color: #fff;
  }
  .frame {
    flex: 1;
    border: 2px solid rgba(255, 255, 255, 0.65);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .seal {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--bg);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fini {
    font-family: var(--display);
    font-size: 16px;
    letter-spacing: 1px;
  }
  .add {
    padding: 12px 14px 14px;
    display: flex;
    gap: 8px;
    border-top: 1px solid var(--surface-2);
  }
  input {
    flex: 1;
    min-width: 0;
    height: 44px;
    border-radius: 10px;
    border: 2px solid var(--line-strong);
    background: var(--surface);
    color: var(--text);
    padding: 0 12px;
    font-size: 14px;
  }
  input::placeholder {
    color: #9c92bf;
  }
  .go {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: var(--accent);
    color: var(--ink);
    box-shadow: 0 3px 0 var(--accent-edge);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .go:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .empty {
    margin: auto;
    padding: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    color: var(--muted);
  }
</style>
