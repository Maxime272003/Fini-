<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { addProject, deleteProject, nextColor, updateProject } from '../lib/model';
  import { COLORS } from '../lib/types';
  import Icon from './Icon.svelte';

  const modal = app.deckModal!;
  const existing = modal.mode === 'edit' ? app.data.projects.find((p) => p.id === modal.projectId) : undefined;

  let name = $state(existing?.name ?? '');
  let color = $state(existing?.color ?? nextColor(app.data));
  let confirmDelete = $state(false);

  function close() {
    app.deckModal = null;
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (existing) {
      app.mutate((d) => updateProject(d, existing.id, { name, color }));
    } else {
      let id = '';
      app.mutate((d) => (id = addProject(d, name, color).id));
      app.go({ name: 'board', projectId: id });
    }
    close();
  }

  function remove() {
    if (!existing) return;
    app.mutate((d) => deleteProject(d, existing.id));
    app.go({ name: 'home' });
    close();
  }

  function focus(el: HTMLInputElement) {
    el.focus();
    el.select();
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="overlay"
  role="dialog"
  aria-modal="true"
  aria-labelledby="deck-title"
  tabindex="-1"
  onclick={(e) => e.target === e.currentTarget && close()}
>
  <form class="dialog" aria-labelledby="deck-title" onsubmit={submit}>
    <div class="fields">
      <h2 id="deck-title">{existing ? 'Modifier le deck' : 'Nouveau deck'}</h2>

      <div class="field">
        <label for="deck-name">Nom du projet</label>
        <input id="deck-name" type="text" bind:value={name} maxlength="60" required use:focus />
      </div>

      <fieldset>
        <legend>Couleur du dos des cartes</legend>
        <div class="swatches">
          {#each COLORS as c (c.hex)}
            <button
              type="button"
              class="swatch"
              class:on={color === c.hex}
              style:background={c.hex}
              aria-label={c.name}
              aria-pressed={color === c.hex}
              onclick={() => (color = c.hex)}
            ></button>
          {/each}
        </div>
      </fieldset>

      <div class="foot">
        {#if existing}
          {#if confirmDelete}
            <span class="confirm">
              Supprimer le deck et ses cartes ?
              <button type="button" class="btn danger" onclick={remove}>Oui, supprimer</button>
              <button type="button" class="btn ghost" onclick={() => (confirmDelete = false)}>Non</button>
            </span>
          {:else}
            <button type="button" class="btn ghost danger" onclick={() => (confirmDelete = true)}>
              <Icon name="trash" />
              Supprimer le deck
            </button>
          {/if}
        {:else}
          <span></span>
        {/if}
        {#if !confirmDelete}
          <div class="buttons">
            <button type="button" class="btn" onclick={close}>Annuler</button>
            <button type="submit" class="btn primary" disabled={!name.trim()}>
              {existing ? 'Enregistrer' : 'Créer le deck'}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <div class="preview" aria-hidden="true">
      <span class="muted cap">APERÇU</span>
      <span class="back card-back" style:background-color={color}>
        <span class="frame"><span class="badge">FINI</span></span>
      </span>
    </div>
  </form>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(8, 6, 16, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .dialog {
    width: min(760px, 100%);
    background: var(--surface);
    border-radius: 18px;
    box-shadow: 0 8px 0 var(--shadow), 0 0 0 2px var(--line);
    padding: 36px;
    display: flex;
    gap: 40px;
  }
  .fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 26px;
  }
  h2 {
    font-size: 34px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  label,
  legend {
    font-size: 14px;
    font-weight: 600;
    color: var(--soft);
    padding: 0;
  }
  legend {
    margin-bottom: 12px;
  }
  input {
    height: 50px;
    border-radius: 10px;
    border: 2px solid var(--line-strong);
    background: var(--bg);
    color: var(--text);
    padding: 0 16px;
    font-size: 17px;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
  }
  .swatches {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    border: 0;
    box-shadow: 0 4px 0 var(--shadow);
  }
  .swatch.on {
    box-shadow: 0 0 0 3px var(--surface), 0 0 0 6px #fff;
  }
  .foot {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .buttons {
    display: flex;
    gap: 12px;
  }
  .confirm {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .preview {
    width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .cap {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1px;
  }
  .back {
    width: 180px;
    height: 252px;
    border-radius: 14px;
    box-shadow: 0 6px 0 var(--shadow);
    padding: 10px;
    transform: rotate(3deg);
    transition: background-color 0.2s ease;
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
    align-items: center;
    justify-content: center;
    font-family: var(--display);
    font-size: 22px;
  }
</style>
