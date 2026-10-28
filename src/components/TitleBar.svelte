<script lang="ts">
  import { app } from '../lib/app.svelte';
  import * as platform from '../lib/platform';
  import Icon from './Icon.svelte';

  let { compact = false }: { compact?: boolean } = $props();
  const pinned = $derived(app.settings.compactAlwaysOnTop);
</script>

<div class="bar" class:compact data-tauri-drag-region>
  <div class="brand" data-tauri-drag-region>
    <span class="logo" aria-hidden="true"></span>
    <span class="name">FINI</span>
  </div>
  <div class="controls">
    {#if compact}
      <button
        class="ctl"
        class:on={pinned}
        aria-label={pinned ? 'Ne plus garder au premier plan' : 'Garder au premier plan'}
        aria-pressed={pinned}
        onclick={() => app.updateSettings({ compactAlwaysOnTop: !pinned })}
      >
        <Icon name="pin" size={14} />
      </button>
      <button class="ctl" aria-label="Agrandir l’app" onclick={() => app.exitCompact()}>
        <Icon name="expand" size={13} stroke={2.4} />
      </button>
    {:else}
      <button class="ctl" aria-label="Réduire" onclick={() => platform.minimize()}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h10" stroke="currentColor" stroke-width="1.4" /></svg>
      </button>
      <button class="ctl" aria-label="Agrandir" onclick={() => platform.toggleMaximize()}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>
      </button>
    {/if}
    <button class="ctl close" aria-label="Fermer" onclick={() => app.closeWindow()}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.4" /></svg>
    </button>
  </div>
</div>

<style>
  .bar {
    height: 36px;
    flex-shrink: 0;
    background: var(--bar);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 14px;
  }
  .bar.compact {
    height: 32px;
    padding-left: 12px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    width: 14px;
    height: 18px;
    border-radius: 3px;
    background: var(--accent);
    transform: rotate(-8deg);
  }
  .name {
    font-family: var(--display);
    font-size: 15px;
    letter-spacing: 1px;
  }
  .controls {
    display: flex;
    height: 100%;
  }
  .ctl {
    width: 46px;
    height: 100%;
    border: 0;
    background: transparent;
    color: var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .compact .ctl {
    width: 40px;
  }
  .ctl:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .ctl.close:hover {
    background: #c42b1c;
    color: #fff;
  }
  .ctl.on {
    color: var(--accent);
  }
</style>
