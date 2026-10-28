<script lang="ts">
  import { tick } from 'svelte';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { app } from '../lib/app.svelte';
  import { addTask, deleteTask, doneTasks, moveTask, setDone, todoTasks, updateTaskText } from '../lib/model';
  import { bump, deal, motionOn } from '../lib/motion';
  import { edgeOf, type Task } from '../lib/types';
  import { plural } from '../lib/text';
  import { formatShortDay } from '../lib/week';
  import CardEditor from './CardEditor.svelte';
  import Icon from './Icon.svelte';

  let { projectId }: { projectId: string } = $props();

  const project = $derived(app.data.projects.find((p) => p.id === projectId));
  const color = $derived(project?.color ?? '#3D7BFF');
  const todo = $derived(todoTasks(app.data, projectId));
  const done = $derived(doneTasks(app.data, projectId));
  const top = $derived(done.at(-1));

  $effect(() => {
    if (!project) app.go({ name: 'home' });
  });

  // --- Finir une carte : elle se soulève, se retourne puis vole jusqu'à la défausse ---
  // La carte qui vole est une copie en position fixe, pour ne pas être coupée par le défilement
  // du plateau ; l'originale reste invisible à sa place jusqu'à l'atterrissage.

  type Flyer = {
    task: Task;
    badge: string;
    rect: DOMRect;
    phase: 'start' | 'lift' | 'fly';
    dx: number;
    dy: number;
    scale: number;
  };
  let flyer = $state<Flyer | null>(null);
  let pileEl = $state<HTMLElement>();
  let topEl = $state<HTMLElement>();
  const cardEls: Record<string, HTMLElement> = {};

  const flyerTransform = $derived.by(() => {
    if (!flyer || flyer.phase === 'start') return 'none';
    if (flyer.phase === 'lift') return 'translateY(-28px) scale(1.1) rotate(-3deg)';
    return `translate(${flyer.dx}px, ${flyer.dy}px) rotate(3deg) scale(${flyer.scale})`;
  });

  function finish(task: Task, badge: string) {
    if (flyer) return;
    menu = null;
    const el = cardEls[task.id];
    if (!motionOn() || !el || !pileEl) return commitDone(task.id);
    const a = el.getBoundingClientRect();
    const b = pileEl.getBoundingClientRect();
    const f: Flyer = {
      task,
      badge,
      rect: a,
      phase: 'start',
      dx: b.left + b.width / 2 - (a.left + a.width / 2),
      dy: b.top + b.height / 2 - (a.top + a.height / 2),
      scale: b.width / a.width
    };
    flyer = f;
    requestAnimationFrame(() => requestAnimationFrame(() => (flyer = { ...f, phase: 'lift' })));
    setTimeout(() => (flyer = { ...f, phase: 'fly' }), 280);
    setTimeout(() => commitDone(task.id), 740);
  }

  async function commitDone(id: string) {
    app.mutate((d) => setDone(d, id, true));
    flyer = null;
    await tick();
    bump(topEl);
  }

  function undo() {
    if (flyer || !top) return;
    const id = top.id;
    app.mutate((d) => setDone(d, id, false));
  }

  function dayLabel(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString() ? 'aujourd’hui' : formatShortDay(iso);
  }

  const pad = (i: number) => String(i + 1).padStart(2, '0');

  // --- Menu, édition, ajout ---

  let menu = $state<{ task: Task; badge: string; x: number; y: number } | null>(null);
  let editingId = $state<string | null>(null);
  let adding = $state(false);

  function openMenu(e: MouseEvent, task: Task, badge: string) {
    e.preventDefault();
    e.stopPropagation();
    if (flyer) return;
    menu = {
      task,
      badge,
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 170)
    };
  }

  // --- Réordonner : glisser-déposer, ou Alt+flèches au clavier ---

  let dragId = $state<string | null>(null);
  let lastMove = 0;

  function dragStart(e: DragEvent, id: string) {
    dragId = id;
    menu = null;
    e.dataTransfer?.setData('text/plain', id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function dragOver(e: DragEvent, index: number, id: string) {
    if (!dragId) return;
    e.preventDefault();
    if (id === dragId) return;
    // Laisse le temps aux cartes de glisser avant de recalculer, sinon elles oscillent sous le curseur.
    const now = performance.now();
    if (now - lastMove < 200) return;
    lastMove = now;
    const moving = dragId;
    app.mutate((d) => moveTask(d, moving, index));
  }

  function cardKey(e: KeyboardEvent, task: Task, index: number) {
    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const to = index + (e.key === 'ArrowLeft' ? -1 : 1);
    if (to < 0 || to >= todo.length) return;
    app.mutate((d) => moveTask(d, task.id, to));
    tick().then(() => cardEls[task.id]?.querySelector<HTMLElement>('.face-btn')?.focus());
  }
</script>

<svelte:window
  onclick={() => (menu = null)}
  onkeydown={(e) => {
    if (e.key === 'Escape') menu = null;
  }}
/>

{#snippet faces(task: Task, badge: string)}
  <span class="face front" style:background={color}>
    <span class="paper">
      <span class="badge" style:background={color}>{badge}</span>
      <span class="text">{task.text}</span>
      <span class="state">À FAIRE</span>
    </span>
  </span>
  <span class="face back card-back" style:background-color={color}>
    <span class="frame">
      <span class="seal"><Icon name="check" size={30} stroke={3.2} /></span>
      <span class="fini">FINI</span>
      <span class="small-text">{task.text}</span>
    </span>
  </span>
{/snippet}

{#if project}
  <div class="board">
    <header>
      <div class="title">
        <button class="btn icon" aria-label="Retour aux decks" onclick={() => app.go({ name: 'home' })}>
          <Icon name="back" size={20} stroke={2.4} />
        </button>
        <span class="chip" style:background={color} style:box-shadow="0 3px 0 {edgeOf(color)}"></span>
        <div>
          <h1>{project.name}</h1>
          <span class="muted">{todo.length} à jouer · {plural(done.length, 'finie', 'finies')}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn" onclick={() => app.enterCompact(projectId)}>
          <Icon name="pin" />
          Mode compact
        </button>
        <button class="btn" onclick={() => (app.deckModal = { mode: 'edit', projectId })}>
          <Icon name="edit" />
          Modifier le deck
        </button>
      </div>
    </header>

    <div class="content">
      <section class="table" aria-label="Cartes en jeu">
        <div class="table-head">
          <h2 class="label">EN JEU</h2>
          <span class="hint">Clique une carte pour la finir · glisse-la pour la ranger · clic droit pour l’éditer</span>
        </div>

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="grid" ondragover={(e) => dragId && e.preventDefault()} ondrop={(e) => e.preventDefault()}>
          {#each todo as task, i (task.id)}
            <div
              class="slot"
              class:ghost={flyer?.task.id === task.id}
              class:dragging={dragId === task.id}
              bind:this={cardEls[task.id]}
              animate:flip={{ duration: motionOn() ? 360 : 0, easing: cubicOut }}
              in:deal
              draggable={editingId !== task.id && !flyer}
              ondragstart={(e) => dragStart(e, task.id)}
              ondragover={(e) => dragOver(e, i, task.id)}
              ondragend={() => (dragId = null)}
              oncontextmenu={(e) => openMenu(e, task, pad(i))}
            >
              {#if editingId === task.id}
                <CardEditor
                  initial={task.text}
                  {color}
                  badge={pad(i)}
                  hint="Entrée pour valider · Échap"
                  onsubmit={(text) => {
                    app.mutate((d) => updateTaskText(d, task.id, text));
                    editingId = null;
                  }}
                  oncancel={() => (editingId = null)}
                />
              {:else}
                <button
                  class="face-btn"
                  aria-label="Finir : {task.text}"
                  onclick={() => finish(task, pad(i))}
                  onkeydown={(e) => cardKey(e, task, i)}
                >
                  <span class="lift"><span class="inner">{@render faces(task, pad(i))}</span></span>
                </button>
                <button class="more" aria-label="Options de la carte {pad(i)}" onclick={(e) => openMenu(e, task, pad(i))}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                </button>
              {/if}
            </div>
          {/each}

          {#if adding}
            <CardEditor
              {color}
              badge={pad(todo.length)}
              onsubmit={(text) => app.mutate((d) => addTask(d, projectId, text))}
              oncancel={() => (adding = false)}
            />
          {:else}
            <button class="new" onclick={() => (adding = true)}>
              <Icon name="plus" size={28} stroke={2.6} />
              <span>Nouvelle carte</span>
            </button>
          {/if}
        </div>
      </section>

      <aside class="discard" aria-label="Défausse">
        <h2 class="label">DÉFAUSSE · {done.length}</h2>
        {#if top}
          <div class="pile" bind:this={pileEl}>
            {#if done.length > 1}
              <span class="under u1" style:background={edgeOf(color)}></span>
              <span class="under u2" style:background={edgeOf(color)}></span>
            {/if}
            <button
              class="top card-back"
              bind:this={topEl}
              style:background-color={color}
              aria-label="Remettre en jeu : {top.text}"
              onclick={undo}
            >
              <span class="frame">
                <span class="seal big"><Icon name="check" size={36} stroke={3.2} /></span>
                <span class="fini big">FINI</span>
                <span class="date">{dayLabel(top.doneAt)}</span>
                <span class="small-text">{top.text}</span>
              </span>
            </button>
          </div>
          <p class="muted pile-hint">Clique la carte du dessus pour la remettre en jeu.</p>
        {:else}
          <div class="pile empty" bind:this={pileEl}>Les cartes finies atterrissent ici.</div>
        {/if}
      </aside>
    </div>
  </div>

  {#if flyer}
    <div
      class="flyer {flyer.phase}"
      aria-hidden="true"
      style:left="{flyer.rect.left}px"
      style:top="{flyer.rect.top}px"
      style:transform={flyerTransform}
    >
      <span class="inner" class:flipped={flyer.phase !== 'start'}>{@render faces(flyer.task, flyer.badge)}</span>
    </div>
  {/if}

  {#if menu}
    {@const m = menu}
    <div class="menu" role="menu" style:left="{m.x}px" style:top="{m.y}px">
      <button role="menuitem" onclick={() => ((editingId = m.task.id), (menu = null))}>
        <Icon name="edit" size={16} /> Modifier le texte
      </button>
      <button role="menuitem" onclick={() => finish(m.task, m.badge)}>
        <Icon name="check" size={16} /> Marquer comme finie
      </button>
      <hr />
      <button role="menuitem" class="danger" onclick={() => ((menu = null), app.mutate((d) => deleteTask(d, m.task.id)))}>
        <Icon name="trash" size={16} /> Supprimer la carte
      </button>
    </div>
  {/if}
{/if}

<style>
  .board {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 20px 32px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 18px;
    min-width: 0;
  }
  .title div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  h1 {
    font-size: 32px;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .title .muted {
    font-size: 14px;
  }
  .chip {
    width: 22px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 5px;
    transform: rotate(-6deg);
  }
  .actions {
    display: flex;
    gap: 10px;
  }
  .content {
    flex: 1;
    min-height: 0;
    padding: 0 32px 28px;
    display: flex;
    gap: 24px;
  }
  .table {
    flex: 1;
    min-width: 0;
    border-radius: 20px;
    background: #1b2b4a;
    box-shadow: inset 0 0 0 2px #26406e, inset 0 0 80px rgba(0, 0, 0, 0.35);
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .table-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    color: #c9d8ff;
  }
  .hint {
    font-size: 13px;
    text-align: right;
  }
  .grid {
    flex: 1;
    overflow-y: auto;
    margin: -12px -12px 0;
    padding: 12px 12px 24px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    grid-auto-rows: 212px;
    gap: 20px;
    justify-items: center;
    align-content: start;
  }

  /* --- Carte --- */
  .slot {
    position: relative;
    width: 150px;
    height: 212px;
  }
  .slot.ghost {
    visibility: hidden;
  }
  .slot.dragging {
    opacity: 0.35;
  }
  .face-btn {
    position: absolute;
    inset: 0;
    border: 0;
    padding: 0;
    background: none;
    border-radius: 12px;
    text-align: left;
  }
  .lift,
  .inner {
    position: absolute;
    inset: 0;
    display: block;
  }
  .lift {
    transition: transform 0.15s ease;
  }
  .slot:hover .lift,
  .face-btn:focus-visible .lift {
    transform: translateY(-8px) rotate(-1.5deg);
  }
  .inner {
    transform-style: preserve-3d;
    transition: transform 0.26s cubic-bezier(0.3, 0.7, 0.4, 1);
  }
  .inner.flipped {
    transform: rotateY(180deg);
  }
  .face {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    display: flex;
    backface-visibility: hidden;
    box-shadow: 0 5px 0 var(--shadow);
  }
  .front {
    padding: 6px;
  }
  .back {
    padding: 8px;
    color: #fff;
    transform: rotateY(180deg);
  }
  .paper {
    flex: 1;
    min-width: 0;
    background: var(--paper);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--ink);
  }
  .badge {
    align-self: flex-start;
    min-width: 30px;
    height: 26px;
    padding: 0 6px;
    border-radius: 6px;
    color: #fff;
    font-family: var(--display);
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .text {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.35;
    overflow: hidden;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
  }
  .state {
    margin-top: auto;
    border-top: 2px dotted var(--paper-line);
    padding-top: 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--ink-muted);
  }
  .frame {
    flex: 1;
    min-width: 0;
    border: 3px solid rgba(255, 255, 255, 0.65);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    overflow: hidden;
  }
  .seal {
    width: 58px;
    height: 58px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--bg);
    color: var(--accent);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .seal.big {
    width: 70px;
    height: 70px;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.65);
  }
  .fini {
    font-family: var(--display);
    font-size: 21px;
    letter-spacing: 2px;
  }
  .fini.big {
    font-size: 25px;
  }
  .small-text {
    font-size: 11px;
    line-height: 1.3;
    text-align: center;
    overflow: hidden;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .more {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: #ede3cf;
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.12s ease, transform 0.15s ease;
  }
  .slot:hover .more,
  .slot:focus-within .more {
    opacity: 1;
    transform: translateY(-8px) rotate(-1.5deg);
  }
  .new {
    width: 150px;
    height: 212px;
    border-radius: 12px;
    border: 3px dashed #3f5f99;
    background: none;
    color: #c9d8ff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 600;
    font-size: 14px;
  }
  .new:hover {
    border-color: var(--accent);
  }

  /* --- Carte en vol --- */
  .flyer {
    position: fixed;
    z-index: 40;
    width: 150px;
    height: 212px;
    pointer-events: none;
    perspective: 900px;
  }
  .flyer.lift {
    transition: transform 0.26s cubic-bezier(0.3, 0.7, 0.4, 1);
  }
  .flyer.fly {
    transition: transform 0.44s cubic-bezier(0.55, 0, 0.25, 1);
  }
  .flyer .face {
    box-shadow: 0 26px 34px rgba(0, 0, 0, 0.55);
  }

  /* --- Défausse --- */
  .discard {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-top: 22px;
  }
  .discard h2 {
    align-self: stretch;
    color: var(--soft);
  }
  .pile {
    position: relative;
    width: 180px;
    height: 252px;
    flex-shrink: 0;
  }
  .under {
    position: absolute;
    inset: 0;
    border-radius: 14px;
  }
  .u1 {
    transform: rotate(-5deg) translate(-4px, 4px);
  }
  .u2 {
    transform: rotate(4deg) translate(4px, 2px);
    filter: brightness(1.15);
  }
  .top {
    position: absolute;
    inset: 0;
    border: 0;
    border-radius: 14px;
    box-shadow: 0 6px 0 var(--shadow);
    padding: 10px;
    display: flex;
    color: #fff;
    transition: transform 0.15s ease;
  }
  .top:hover {
    transform: translateY(-4px) rotate(1deg);
  }
  .top .frame {
    gap: 10px;
    border-radius: 9px;
  }
  .top .small-text {
    font-size: 12px;
  }
  .date {
    font-size: 12px;
    font-weight: 600;
    background: var(--bg);
    padding: 3px 8px;
    border-radius: 6px;
  }
  .pile.empty {
    border-radius: 14px;
    border: 3px dashed var(--line-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: var(--muted);
  }
  .pile-hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
  }

  /* --- Menu contextuel --- */
  .menu {
    position: fixed;
    z-index: 45;
    width: 210px;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: 0 6px 0 var(--shadow), 0 0 0 2px var(--line);
    padding: 6px;
    display: flex;
    flex-direction: column;
  }
  .menu button {
    height: 42px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
  }
  .menu button:hover,
  .menu button:focus-visible {
    background: var(--surface-3);
  }
  .menu .danger {
    color: var(--danger);
  }
  .menu hr {
    border: 0;
    height: 1px;
    background: var(--line);
    margin: 4px 6px;
  }
</style>
