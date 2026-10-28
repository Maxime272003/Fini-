<script lang="ts">
  import { app } from '../lib/app.svelte';
  import { fadeEdges } from '../lib/fade';
  import { dataFilePath, openDataDir } from '../lib/platform';
  import type { CloseAction, StartupMode } from '../lib/types';
  import Icon from './Icon.svelte';
  import Switch from './Switch.svelte';

  const s = $derived(app.settings);
  const u = $derived(app.update);

  const modes: { id: StartupMode; label: string; hint: string }[] = [
    { id: 'window', label: 'Ouvrir la fenêtre principale', hint: 'Tes decks s’affichent directement.' },
    { id: 'compact', label: 'Ouvrir en mode compact', hint: 'Le petit widget apparaît.' },
    { id: 'tray', label: 'En arrière-plan', hint: 'Rien ne s’affiche : Fini attend dans la zone de notification.' }
  ];
  const closes: { id: CloseAction; label: string }[] = [
    { id: 'tray', label: 'Réduire dans la zone de notification' },
    { id: 'quit', label: 'Quitter Fini' }
  ];

  let path = $state('');
  dataFilePath().then((p) => (path = p));

  // --- Capture d'un nouveau raccourci ---
  let capturing = $state(false);
  let shortcutMessage = $state('');

  // Convertit une touche du clavier en nom compris par le raccourci global (lettres, chiffres, F1–F12).
  function keyName(code: string): string | null {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^F([1-9]|1[0-2])$/.test(code)) return code;
    return null;
  }

  async function capture(e: KeyboardEvent) {
    if (!capturing) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      capturing = false;
      return;
    }
    const key = keyName(e.code);
    if (!key) return;
    if (!e.ctrlKey && !e.altKey) {
      shortcutMessage = 'Ajoute Ctrl ou Alt à la touche.';
      return;
    }
    const accel = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', key].filter(Boolean).join('+');
    capturing = false;
    const ok = await app.setShortcut(accel);
    shortcutMessage = ok ? '' : `${accel} est déjà utilisé par Windows ou une autre app.`;
  }
</script>

<svelte:window onkeydowncapture={capture} />

<div class="settings">
  <header>
    <button class="btn icon" aria-label="Retour aux decks" onclick={() => app.go({ name: 'home' })}>
      <Icon name="back" size={20} stroke={2.4} />
    </button>
    <div>
      <h1>Réglages</h1>
      <span class="muted">Enregistrés automatiquement</span>
    </div>
  </header>

  <div class="columns" use:fadeEdges>
    <div class="col">
      <section aria-labelledby="s-start">
        <h2 id="s-start">DÉMARRAGE</h2>
        <div class="row">
          <div class="txt">
            <span id="l-boot" class="name">Lancer Fini au démarrage de Windows</span>
            <span class="muted desc">Fini s’ouvre tout seul quand tu allumes le PC.</span>
          </div>
          <Switch checked={s.launchAtStartup} labelledby="l-boot" onchange={(v) => app.updateSettings({ launchAtStartup: v })} />
        </div>
        <div class="radios" class:off={!s.launchAtStartup} role="radiogroup" aria-label="Comment Fini s’ouvre au démarrage">
          {#each modes as m (m.id)}
            <button
              role="radio"
              aria-checked={s.startupMode === m.id}
              class:on={s.startupMode === m.id}
              disabled={!s.launchAtStartup}
              onclick={() => app.updateSettings({ startupMode: m.id })}
            >
              <span class="dot"><span></span></span>
              <span class="txt">
                <span class="opt">{m.label}</span>
                <span class="muted hint">{m.hint}</span>
              </span>
            </button>
          {/each}
        </div>
      </section>

      <section aria-labelledby="s-display">
        <h2 id="s-display">AFFICHAGE</h2>
        <div class="row">
          <div class="txt">
            <span id="l-motion" class="name">Réduire les animations</span>
            <span class="muted desc">Les cartes passent dans la défausse sans voler.</span>
          </div>
          <Switch checked={s.reduceMotion} labelledby="l-motion" onchange={(v) => app.updateSettings({ reduceMotion: v })} />
        </div>
      </section>

      <section aria-labelledby="s-update">
        <h2 id="s-update">MISES À JOUR</h2>
        <div class="row">
          <div class="txt">
            <span class="name">Version {app.version}</span>
            <span class="muted desc" aria-live="polite">
              {#if u.status === 'checking'}
                Recherche en cours…
              {:else if u.status === 'uptodate'}
                Fini est à jour.
              {:else if u.status === 'available'}
                La version {u.version} est disponible.
              {:else if u.status === 'installing'}
                Installation de la version {u.version}… {Math.round(u.progress * 100)} %
              {:else if u.status === 'error'}
                Recherche impossible pour l’instant (pas de connexion ?).
              {:else}
                Fini vérifie tout seul au démarrage puis toutes les 6 heures.
              {/if}
            </span>
          </div>
          {#if u.status === 'available'}
            <button class="btn primary" onclick={() => app.installUpdate()}>Mettre à jour</button>
          {:else}
            <button class="btn" disabled={u.status === 'checking' || u.status === 'installing'} onclick={() => app.checkForUpdate()}>
              Rechercher
            </button>
          {/if}
        </div>
      </section>
    </div>

    <div class="col">
      <section aria-labelledby="s-win">
        <h2 id="s-win">FENÊTRE</h2>
        <div class="stack">
          <span id="l-close" class="name">Quand je ferme la fenêtre</span>
          <div class="segmented" role="radiogroup" aria-labelledby="l-close">
            {#each closes as c (c.id)}
              <button
                role="radio"
                aria-checked={s.closeAction === c.id}
                class:on={s.closeAction === c.id}
                onclick={() => app.updateSettings({ closeAction: c.id })}>{c.label}</button
              >
            {/each}
          </div>
        </div>
        <div class="row">
          <div class="txt">
            <span id="l-top" class="name">Mode compact toujours au premier plan</span>
            <span class="muted desc">Le widget reste visible au-dessus des autres fenêtres.</span>
          </div>
          <Switch checked={s.compactAlwaysOnTop} labelledby="l-top" onchange={(v) => app.updateSettings({ compactAlwaysOnTop: v })} />
        </div>
        <div class="row">
          <div class="txt">
            <span class="name">Raccourci du mode compact</span>
            <span class="muted desc" aria-live="polite">
              {#if capturing}
                Appuie sur la combinaison voulue (Échap pour annuler).
              {:else if shortcutMessage}
                {shortcutMessage}
              {:else if app.shortcutError}
                Raccourci indisponible : choisis-en un autre.
              {:else}
                Fonctionne même quand Fini est en arrière-plan.
              {/if}
            </span>
          </div>
          <div class="keys">
            {#if !capturing}
              {#each s.compactShortcut.split('+') as k (k)}<kbd>{k}</kbd>{/each}
            {/if}
            <button class="small-btn" onclick={() => ((capturing = !capturing), (shortcutMessage = ''))}>
              {capturing ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="s-data">
        <h2 id="s-data">DONNÉES</h2>
        <div class="row">
          <div class="txt">
            <span class="name">Fichier de sauvegarde</span>
            <code>{path}</code>
          </div>
          <button class="btn" onclick={() => openDataDir()}>
            <Icon name="folder" size={16} />
            Ouvrir le dossier
          </button>
        </div>
        <span class="muted desc">Une copie par jour est gardée 7 jours dans le sous-dossier backups.</span>
      </section>
    </div>
  </div>

  <footer class="muted">Fini {app.version}</footer>
</div>

<style>
  .settings {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 20px 32px 18px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  header div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  h1 {
    font-size: 32px;
  }
  header .muted {
    font-size: 14px;
  }
  .columns {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 32px 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 24px;
    align-items: start;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  section {
    background: var(--surface);
    border-radius: 18px;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 5px 0 var(--shadow);
  }
  h2 {
    font-size: 20px;
    letter-spacing: 1px;
    color: var(--accent);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .txt {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .name {
    font-size: 15px;
    font-weight: 600;
  }
  .desc {
    font-size: 13px;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .radios {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .radios.off {
    opacity: 0.4;
  }
  .radios button {
    min-height: 52px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--line);
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px;
    text-align: left;
  }
  .radios button:disabled {
    cursor: default;
  }
  .radios button.on {
    background: var(--surface-3);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .dot {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid #8e84b3;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .on .dot {
    border-color: var(--accent);
  }
  .dot span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .on .dot span {
    background: var(--accent);
  }
  .opt {
    font-size: 14px;
    font-weight: 600;
  }
  .hint {
    font-size: 12px;
  }
  .segmented {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    background: var(--bg);
    border-radius: 12px;
    padding: 5px;
  }
  .segmented button {
    min-height: 44px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--soft);
    font-size: 13px;
    font-weight: 600;
    padding: 6px 10px;
  }
  .segmented button.on {
    background: var(--accent);
    color: var(--ink);
  }
  .keys {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  kbd {
    min-width: 28px;
    height: 30px;
    padding: 0 8px;
    border-radius: 6px;
    background: var(--bg);
    box-shadow: 0 3px 0 var(--shadow);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .small-btn {
    margin-left: 4px;
    height: 36px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: var(--surface-3);
    font-size: 13px;
    font-weight: 600;
  }
  code {
    font-family: Consolas, ui-monospace, monospace;
    font-size: 13px;
    color: var(--soft);
    overflow-wrap: anywhere;
    user-select: text;
  }
  footer {
    padding: 12px 32px;
    border-top: 1px solid var(--surface-2);
    font-size: 12px;
  }
</style>
