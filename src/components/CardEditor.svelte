<script lang="ts">
  import { untrack } from 'svelte';

  // Carte vierge éditable sur place : Entrée pour poser, Maj+Entrée pour un retour à la ligne, Échap pour annuler.
  let {
    initial = '',
    color,
    badge,
    hint = 'Entrée pour poser · Échap',
    onsubmit,
    oncancel
  }: {
    initial?: string;
    color: string;
    badge: string;
    hint?: string;
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

  function focus(el: HTMLTextAreaElement) {
    el.focus();
    el.select();
  }
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
    <span class="hint">{hint}</span>
  </div>
</div>

<style>
  .editor {
    width: 150px;
    height: 212px;
    padding: 6px;
    border-radius: 12px;
    display: flex;
    box-shadow: 0 5px 0 var(--shadow), 0 0 0 3px var(--accent);
    transform: translateY(-8px);
  }
  .paper {
    flex: 1;
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
    border: 0;
    resize: none;
    background: transparent;
    color: var(--ink);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.35;
    padding: 0;
    outline: none;
  }
  textarea::placeholder {
    color: var(--ink-muted);
  }
  .hint {
    border-top: 2px dotted var(--paper-line);
    padding-top: 6px;
    font-size: 11px;
    color: var(--ink-muted);
  }
</style>
