<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from './Icon.svelte';

  // Carte éditable sur place : Entrée ou ✓ pour poser, Maj+Entrée pour un retour à la ligne, Échap ou ✕ pour annuler.
  let {
    initial = '',
    color,
    badge,
    onsubmit,
    oncancel
  }: {
    initial?: string;
    color: string;
    badge: string;
    onsubmit: (text: string) => void;
    oncancel: () => void;
  } = $props();

  // Valeur de départ seulement : l'éditeur ne suit pas les changements de `initial`.
  let text = $state(untrack(() => initial));
  let closed = false;

  function submit() {
    if (closed) return;
    if (!text.trim()) return cancel();
    onsubmit(text);
    text = '';
  }

  function cancel() {
    if (closed) return;
    closed = true;
    oncancel();
  }

  function keydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    }
  }

  function blur() {
    if (!closed && text.trim() && text.trim() !== initial.trim()) onsubmit(text);
    cancel();
  }

  // Curseur à la fin du texte plutôt que tout sélectionner.
  function focus(el: HTMLTextAreaElement) {
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }

  // Les boutons ne doivent pas retirer le focus du texte (sinon la carte se fermerait avant le clic).
  const keepFocus = (e: MouseEvent) => e.preventDefault();
</script>

<div class="editor" style:background={color}>
  <div class="paper">
    <span class="badge" style:background={color}>{badge}</span>
    <label class="sr-only" for="card-editor">Description de la carte</label>
    <textarea
      id="card-editor"
      bind:value={text}
      maxlength="200"
      placeholder="Écris la tâche…"
      onkeydown={keydown}
      onblur={blur}
      use:focus
    ></textarea>
    <span class="actions">
      <button class="act cancel" title="Annuler (Échap)" aria-label="Annuler" onmousedown={keepFocus} onclick={cancel}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
      </button>
      <button
        class="act ok"
        title="Poser la carte (Entrée)"
        aria-label="Poser la carte"
        disabled={!text.trim()}
        onmousedown={keepFocus}
        onclick={submit}
      >
        <Icon name="check" size={16} stroke={3} />
      </button>
    </span>
  </div>
</div>

<style>
  .editor {
    position: relative;
    z-index: 2;
    width: 150px;
    height: 212px;
    padding: 6px;
    border-radius: 12px;
    display: flex;
    /* Carte en main : soulevée, cerclée de jaune et lumineuse. */
    box-shadow:
      0 0 0 3px var(--accent),
      0 0 26px rgba(255, 210, 63, 0.45),
      0 16px 26px rgba(0, 0, 0, 0.45);
    transform: translateY(-8px);
  }
  .paper {
    flex: 1;
    min-width: 0;
    background: var(--paper);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
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
  textarea {
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 0;
    border: 0;
    resize: none;
    background: transparent;
    color: var(--ink);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.35;
    padding: 0;
    outline: none;
    caret-color: var(--ink);
  }
  textarea::placeholder {
    color: var(--ink-muted);
  }
  textarea::selection {
    background: rgba(255, 210, 63, 0.6);
    color: var(--ink);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    border-top: 2px dotted var(--paper-line);
    padding-top: 6px;
  }
  .act {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cancel {
    background: #ede3cf;
    color: var(--ink-muted);
  }
  .cancel:hover {
    color: var(--ink);
  }
  .ok {
    background: var(--ink);
    color: var(--accent);
  }
  .ok:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
