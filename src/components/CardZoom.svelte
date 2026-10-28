<script lang="ts">
  // Carte agrandie affichée au survol quand le texte ne tient pas dans la carte (« inspecter » une carte).
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { motionOn } from '../lib/motion';

  const WIDTH = 260;
  const MARGIN = 12;

  let { text, badge, color, rect }: { text: string; badge: string; color: string; rect: DOMRect } = $props();

  let height = $state(0);
  // Centrée sur la carte d'origine, sans sortir de la fenêtre.
  const left = $derived(
    Math.max(MARGIN, Math.min(rect.left + rect.width / 2 - WIDTH / 2, window.innerWidth - WIDTH - MARGIN))
  );
  const top = $derived(
    Math.max(MARGIN, Math.min(rect.top + rect.height / 2 - height / 2, window.innerHeight - height - MARGIN))
  );

  function pop(node: Element) {
    if (!motionOn()) return { duration: 0 };
    return scale(node, { duration: 160, start: 0.75, easing: cubicOut });
  }
</script>

<div
  class="zoom"
  role="tooltip"
  style:left="{left}px"
  style:top="{top}px"
  style:width="{WIDTH}px"
  style:background={color}
  bind:clientHeight={height}
  transition:pop
>
  <div class="paper">
    <span class="badge" style:background={color}>{badge}</span>
    <p>{text}</p>
  </div>
</div>

<style>
  .zoom {
    position: fixed;
    z-index: 35;
    min-height: 300px;
    max-height: calc(100vh - 24px);
    padding: 8px;
    border-radius: 16px;
    display: flex;
    pointer-events: none;
    box-shadow: 0 24px 40px rgba(0, 0, 0, 0.55), 0 0 0 3px var(--accent);
  }
  .paper {
    flex: 1;
    min-width: 0;
    background: var(--paper);
    border-radius: 10px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    color: var(--ink);
    overflow: hidden;
  }
  .badge {
    align-self: flex-start;
    min-width: 36px;
    height: 30px;
    padding: 0 8px;
    border-radius: 7px;
    color: #fff;
    font-family: var(--display);
    font-size: 19px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  p {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
    line-height: 1.4;
    overflow-wrap: anywhere;
    white-space: pre-line;
    user-select: text;
  }
</style>
