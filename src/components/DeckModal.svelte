<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { addProject, nextColor, updateProject } from '../lib/model';
  import { BACKS, COLORS, edgeOf, type CardBack } from '../lib/types';
  import Icon from './Icon.svelte';

  const modal = app.deckModal!;
  const existing = modal.mode === 'edit' ? app.data.projects.find((p) => p.id === modal.projectId) : undefined;

  const STEPS = ['Nom', 'Dos', 'Couleur'];

  let name = $state(existing?.name ?? '');
  let back = $state<CardBack>(existing?.back ?? BACKS[0].id);
  let color = $state(existing?.color ?? nextColor(app.data));
  let step = $state(1);
  let confirmDelete = $state(false);

  const named = $derived(!!name.trim());
  const backName = $derived(BACKS.find((b) => b.id === back)?.name ?? '');
  const colorName = $derived(COLORS.find((c) => c.hex === color)?.name ?? '');

  function close() {
    app.deckModal = null;
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!named) return;
    // À la création, Entrée et « Suivant » avancent d'une étape jusqu'à la couleur.
    if (!existing && step < STEPS.length) {
      step++;
      return;
    }
    if (existing) {
      app.mutate((d) => updateProject(d, existing.id, { name, color, back }));
    } else {
      let id = '';
      app.mutate((d) => (id = addProject(d, name, color, back).id));
      app.go({ name: 'board', projectId: id });
    }
    close();
  }

  function remove() {
    if (!existing) return;
    app.deleteProject(existing.id);
    close();
  }

  function focus(el: HTMLInputElement) {
    el.focus();
    el.select();
  }

  // En changeant d'étape, le champ du nom disparaît : le focus passe au bouton principal
  // pour que Entrée continue d'avancer.
  let primary = $state<HTMLButtonElement>();
  $effect(() => {
    if (step > 1) primary?.focus();
  });
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
    <div class="preview" aria-hidden="true">
      <span class="stack">
        <span class="b3" style:background={edgeOf(color)}></span>
        <span class="b2" style:background={edgeOf(color)}></span>
        <span class="front card-back cover" data-back={back} style:--c={color} style:--e={edgeOf(color)}>
          <span class="frame">
            <span class="badge">
              <span class="count">0</span>
              <span class="sub">À JOUER</span>
            </span>
          </span>
        </span>
      </span>
      <span class="pname">{name.trim() || 'Sans nom'}</span>
      <span class="muted small">{backName} · {colorName}</span>
    </div>

    <div class="fields">
      <h2 id="deck-title">{existing ? 'Modifier le deck' : 'Nouveau deck'}</h2>

      <ol class="steps">
        {#each STEPS as label, i (label)}
          <li>
            <button
              type="button"
              class="step"
              class:on={step === i + 1}
              class:past={step > i + 1}
              aria-current={step === i + 1 ? 'step' : undefined}
              disabled={i > 0 && !named}
              onclick={() => (step = i + 1)}
            >
              <span class="dot">{i + 1}</span>
              {label}
            </button>
          </li>
        {/each}
      </ol>

      <div class="body">
        {#if step === 1}
          <div class="field">
            <label for="deck-name">Nom du projet</label>
            <input id="deck-name" type="text" bind:value={name} maxlength="60" required use:focus />
          </div>
        {:else if step === 2}
          <fieldset>
            <legend>Dos des cartes</legend>
            <div class="backs">
              {#each BACKS as b (b.id)}
                <button
                  type="button"
                  class="opt"
                  class:on={back === b.id}
                  aria-pressed={back === b.id}
                  onclick={() => (back = b.id)}
                >
                  <span class="mini card-back cover" data-back={b.id} style:--c={color} style:--e={edgeOf(color)}>
                    <span class="frame"><span class="badge"></span></span>
                  </span>
                  {b.name}
                </button>
              {/each}
            </div>
          </fieldset>
        {:else}
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
        {/if}
      </div>

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
              Supprimer
            </button>
          {/if}
        {:else}
          <span></span>
        {/if}
        {#if !confirmDelete}
          <div class="buttons">
            {#if existing || step === 1}
              <button type="button" class="btn" onclick={close}>Annuler</button>
            {:else}
              <button type="button" class="btn" onclick={() => step--}>Retour</button>
            {/if}
            <button type="submit" class="btn primary" disabled={!named} bind:this={primary}>
              {existing ? 'Enregistrer' : step < STEPS.length ? 'Suivant' : 'Créer le deck'}
            </button>
          </div>
        {/if}
      </div>
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
    width: min(880px, 100%);
    min-height: 500px;
    background: var(--surface);
    border-radius: 18px;
    box-shadow: 0 8px 0 var(--shadow), 0 0 0 2px var(--line);
    display: flex;
    overflow: hidden;
  }

  /* --- Aperçu du paquet --- */
  .preview {
    width: 290px;
    flex-shrink: 0;
    background: var(--bg);
    border-right: 2px solid var(--line);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 24px;
    text-align: center;
  }
  .stack {
    position: relative;
    width: 180px;
    height: 252px;
    margin-bottom: 28px;
  }
  .stack > span {
    position: absolute;
    inset: 0;
    border-radius: 14px;
  }
  .b3 {
    transform: rotate(6deg) translateX(6px);
  }
  .b2 {
    transform: rotate(-4deg) translateX(-4px);
  }
  .front {
    box-shadow: 0 6px 0 var(--shadow);
    padding: 10px;
    display: flex;
    transform: translateY(-6px) rotate(-1.5deg);
  }
  :where(.front) .frame {
    flex: 1;
    border: 3px solid rgba(255, 255, 255, 0.65);
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :where(.front) .badge {
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
  .pname {
    font-weight: 600;
    font-size: 18px;
    word-break: break-word;
  }
  .small {
    font-size: 13px;
  }

  /* --- Étapes --- */
  .fields {
    flex: 1;
    min-width: 0;
    padding: 34px 36px;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  h2 {
    font-size: 34px;
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 10px;
  }
  .steps li {
    flex: 1;
  }
  .step {
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: none;
    font-weight: 600;
    font-size: 15px;
    text-align: left;
  }
  .step.on {
    border-color: var(--accent);
    background: var(--surface-3);
  }
  .step:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .dot {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--surface-2);
    color: var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--display);
    font-size: 15px;
  }
  .step.on .dot,
  .step.past .dot {
    background: var(--accent);
    color: var(--ink);
  }
  .body {
    flex: 1;
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

  /* --- Choix du dos --- */
  .backs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 12px;
    border: 2px solid var(--line);
    background: var(--surface-2);
    font-weight: 600;
    font-size: 14px;
    text-align: left;
  }
  .opt:hover {
    border-color: var(--line-strong);
  }
  .opt.on {
    border-color: var(--accent);
    background: var(--surface-3);
  }
  .mini {
    --u: 3.2px;
    width: calc(18 * var(--u));
    height: calc(25.2 * var(--u));
    flex-shrink: 0;
    border-radius: 6px;
    padding: var(--u);
    display: flex;
    box-shadow: 0 2px 0 var(--shadow);
  }
  :where(.mini) .frame {
    flex: 1;
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :where(.mini) .badge {
    width: calc(8.4 * var(--u));
    height: calc(8.4 * var(--u));
    border-radius: 50%;
    background: var(--bg);
    box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.65);
  }

  /* --- Choix de la couleur --- */
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
</style>
