<script lang="ts">
  import { fly } from 'svelte/transition';
  import { app } from '../lib/app.svelte';
  import { motionOn } from '../lib/motion';
  import Icon from './Icon.svelte';

  const u = $derived(app.update);
  const visible = $derived(
    u.status === 'installing' || (u.status === 'available' && !app.updateDismissed)
  );
</script>

{#if visible}
  <div class="banner" role="status" transition:fly={{ y: 40, duration: motionOn() ? 250 : 0 }}>
    <span class="icon" aria-hidden="true"><Icon name="deck" size={20} /></span>
    {#if u.status === 'installing'}
      <div class="txt">
        <strong>Mise à jour vers la version {u.version}…</strong>
        <span class="track"><span style:width="{Math.round(u.progress * 100)}%"></span></span>
      </div>
    {:else if u.status === 'available'}
      <div class="txt">
        <strong>Nouvelle version {u.version} disponible</strong>
        <span class="muted">Fini redémarre tout seul, tes cartes restent là.</span>
      </div>
      <button class="btn primary" onclick={() => app.installUpdate()}>Mettre à jour</button>
      <button class="btn icon ghost" aria-label="Plus tard" onclick={() => (app.updateDismissed = true)}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.6" /></svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  .banner {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 60;
    max-width: 520px;
    background: var(--surface);
    border-radius: 14px;
    box-shadow: 0 6px 0 var(--shadow), 0 0 0 2px var(--accent);
    padding: 14px 14px 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .icon {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 10px;
    background: var(--accent);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .txt {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
  }
  .muted {
    font-size: 13px;
  }
  .track {
    display: block;
    width: 260px;
    height: 8px;
    border-radius: 4px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .track span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.2s ease;
  }
</style>
