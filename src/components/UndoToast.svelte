<script lang="ts">
  import { fly } from 'svelte/transition';
  import { app } from '../lib/app.svelte';
  import { motionOn } from '../lib/motion';

  // Ctrl+Z annule aussi, sauf pendant la saisie d'un texte (le champ garde son propre Ctrl+Z).
  function keydown(e: KeyboardEvent) {
    if (!app.undo || !e.ctrlKey || e.key.toLowerCase() !== 'z') return;
    if ((e.target as HTMLElement | null)?.closest('input, textarea')) return;
    e.preventDefault();
    app.undoLast();
  }
</script>

<svelte:window onkeydown={keydown} />

{#if app.undo}
  {#key app.undo.id}
    <div class="toast" role="status" transition:fly={{ y: 30, duration: motionOn() ? 200 : 0 }}>
      <span>{app.undo.label}</span>
      <button class="undo" onclick={() => app.undoLast()}>Annuler</button>
      <button class="close" aria-label="Fermer" onclick={() => app.clearUndo()}>
        <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.6" /></svg>
      </button>
      <span class="timer" aria-hidden="true"></span>
    </div>
  {/key}
{/if}

<style>
  .toast {
    position: fixed;
    left: 24px;
    /* Au-dessus de la barre du bas, comme le bandeau de mise à jour (qui est à droite). */
    bottom: 60px;
    z-index: 60;
    overflow: hidden;
    background: var(--surface);
    border-radius: 12px;
    box-shadow: 0 6px 0 var(--shadow), 0 0 0 2px var(--line);
    padding: 8px 8px 8px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
  .undo {
    height: 36px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: var(--ink);
    font-weight: 700;
    font-size: 14px;
  }
  .close {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .close:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  /* Barre qui se vide : le temps restant pour annuler (6 s, voir UNDO_DELAY). */
  .timer {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    width: 100%;
    background: var(--accent);
    transform-origin: left;
    animation: drain 6s linear forwards;
  }
  @keyframes drain {
    to {
      transform: scaleX(0);
    }
  }
</style>
