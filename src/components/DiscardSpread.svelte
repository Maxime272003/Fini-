<script lang="ts">
  // La défausse étalée : toutes les cartes finies du deck, la plus récente en premier.
  // Un clic remet une carte en jeu.
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { app } from '../lib/app.svelte';
  import { fadeEdges } from '../lib/fade';
  import { setDone } from '../lib/model';
  import { motionOn } from '../lib/motion';
  import { cardTextSize, plural } from '../lib/text';
  import type { Task } from '../lib/types';
  import { doneDayLabel } from '../lib/week';
  import CardZoom from './CardZoom.svelte';
  import Icon from './Icon.svelte';

  let { tasks, color, onclose }: { tasks: Task[]; color: string; onclose: () => void } = $props();

  const list = $derived([...tasks].reverse());

  $effect(() => {
    if (list.length === 0) onclose();
  });

  function restore(id: string) {
    hideZoom();
    app.mutate((d) => setDone(d, id, false));
  }

  function leave(node: Element) {
    if (!motionOn()) return { duration: 0 };
    return scale(node, { duration: 220, start: 0.6, easing: cubicOut });
  }

  // Zoom au survol pour les textes coupés, comme sur le plateau.
  let zoom = $state<{ task: Task; rect: DOMRect } | null>(null);
  let zoomTimer: ReturnType<typeof setTimeout> | undefined;

  function showZoom(el: HTMLElement, task: Task) {
    clearTimeout(zoomTimer);
    const t = el.querySelector<HTMLElement>('.text');
    if (!t || t.scrollHeight <= t.clientHeight + 1) return;
    zoomTimer = setTimeout(() => (zoom = { task, rect: el.getBoundingClientRect() }), 400);
  }

  function hideZoom() {
    clearTimeout(zoomTimer);
    zoom = null;
  }

  function keydown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    onclose();
  }

  function focus(el: HTMLElement) {
    el.focus();
  }
</script>

<svelte:window onkeydown={keydown} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="overlay" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="spread-title" tabindex="-1">
    <header>
      <div>
        <h2 id="spread-title">DÉFAUSSE · {plural(list.length, 'carte finie', 'cartes finies')}</h2>
        <p class="muted">Clique une carte pour la remettre en jeu.</p>
      </div>
      <button class="btn icon" aria-label="Fermer la défausse" onclick={onclose} use:focus>
        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.6" /></svg>
      </button>
    </header>

    <div class="grid" use:fadeEdges>
      {#each list as t (t.id)}
        <button
          class="card card-back"
          style:background-color={color}
          aria-label="Remettre en jeu : {t.text}"
          animate:flip={{ duration: motionOn() ? 300 : 0, easing: cubicOut }}
          out:leave
          onclick={() => restore(t.id)}
          onmouseenter={(e) => showZoom(e.currentTarget, t)}
          onmouseleave={hideZoom}
        >
          <span class="frame">
            <span class="top">
              <span class="seal"><Icon name="check" size={14} stroke={3.4} /></span>
              <span class="date">{doneDayLabel(t.doneAt)}</span>
            </span>
            <span class="text {cardTextSize(t.text)}">{t.text}</span>
          </span>
        </button>
      {/each}
    </div>
  </div>
</div>

{#if zoom}
  <CardZoom text={zoom.task.text} badge="✓" {color} rect={zoom.rect} />
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 36px 0 0;
    z-index: 30;
    background: rgba(8, 6, 16, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  .panel {
    width: min(1000px, 100%);
    max-height: 100%;
    background: var(--surface);
    border-radius: 18px;
    box-shadow: 0 8px 0 var(--shadow), 0 0 0 2px var(--line);
    padding: 24px 24px 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  h2 {
    font-size: 22px;
    letter-spacing: 1px;
    color: var(--soft);
  }
  p {
    margin: 4px 0 0;
    font-size: 14px;
  }
  .grid {
    overflow-y: auto;
    margin: 0 -12px;
    padding: 12px 12px 24px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    grid-auto-rows: 196px;
    gap: 18px;
    justify-items: center;
  }
  .card {
    width: 140px;
    height: 196px;
    border: 0;
    border-radius: 12px;
    padding: 7px;
    display: flex;
    color: #fff;
    box-shadow: 0 5px 0 var(--shadow);
    text-align: left;
    transition: transform 0.15s ease;
  }
  .card:hover,
  .card:focus-visible {
    transform: translateY(-6px) rotate(-1.5deg);
  }
  .frame {
    flex: 1;
    min-width: 0;
    border: 2px solid rgba(255, 255, 255, 0.65);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .seal {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--bg);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .date {
    font-size: 11px;
    font-weight: 600;
    background: var(--bg);
    padding: 3px 7px;
    border-radius: 6px;
    white-space: nowrap;
  }
  /* Le texte est posé sur un fond sombre pour rester lisible sur le motif du dos de carte. */
  .text {
    flex: 1;
    min-height: 0;
    background: rgba(23, 18, 43, 0.72);
    border-radius: 6px;
    padding: 7px 8px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.3;
    overflow: hidden;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 7;
    line-clamp: 7;
    -webkit-box-orient: vertical;
  }
  .text.m,
  .text.s {
    font-size: 11.5px;
    -webkit-line-clamp: 8;
    line-clamp: 8;
  }
</style>
