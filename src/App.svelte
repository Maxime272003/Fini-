<script lang="ts">
  import { app } from './lib/app.svelte';
  import Board from './components/Board.svelte';
  import Compact from './components/Compact.svelte';
  import DeckModal from './components/DeckModal.svelte';
  import Home from './components/Home.svelte';
  import Recap from './components/Recap.svelte';
  import Settings from './components/Settings.svelte';
  import TitleBar from './components/TitleBar.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
</script>

<div class="window">
  <TitleBar compact={app.compact} />

  {#if app.loadError}
    <div class="error" role="alert">{app.loadError}</div>
  {/if}

  {#if app.loaded}
    {#if app.compact}
      <Compact />
    {:else if app.view.name === 'board'}
      {#key app.view.projectId}
        <Board projectId={app.view.projectId} />
      {/key}
    {:else if app.view.name === 'recap'}
      <Recap />
    {:else if app.view.name === 'settings'}
      <Settings />
    {:else}
      <Home />
    {/if}
  {/if}

  {#if app.deckModal && !app.compact}
    <DeckModal />
  {/if}

  {#if !app.compact}
    <UpdateBanner />
  {/if}
</div>

<style>
  .window {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .error {
    margin: 12px 32px 0;
    padding: 12px 16px;
    border-radius: 10px;
    background: #4a1f2b;
    color: #ffd7d3;
    font-size: 14px;
  }
</style>
