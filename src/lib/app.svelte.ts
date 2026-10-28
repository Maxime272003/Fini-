import type { Update } from '@tauri-apps/plugin-updater';
import * as m from './model';
import * as platform from './platform';
import type { Data, Project, Settings, Task } from './types';
import * as updater from './updater';

const UPDATE_CHECK_EVERY = 6 * 60 * 60 * 1000;
/** Durée pendant laquelle une suppression peut être annulée. */
const UNDO_DELAY = 6000;

export type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'uptodate' }
  | { status: 'available'; version: string }
  | { status: 'installing'; version: string; progress: number }
  | { status: 'error'; message: string };

export type View =
  | { name: 'home' }
  | { name: 'board'; projectId: string }
  | { name: 'recap' }
  | { name: 'settings' };

export type DeckModal = { mode: 'create' } | { mode: 'edit'; projectId: string } | null;

class AppState {
  data = $state<Data>(m.emptyData());
  loaded = $state(false);
  /** Message affiché si le fichier n'a pas pu être lu : on n'écrit alors rien pour ne pas l'écraser. */
  loadError = $state<string | null>(null);
  view = $state<View>({ name: 'home' });
  deckModal = $state<DeckModal>(null);
  compact = $state(false);
  compactProjectId = $state<string | null>(null);
  shortcutError = $state(false);
  version = $state('');
  update = $state<UpdateState>({ status: 'idle' });
  /** L'utilisateur a fermé le bandeau : on ne le réaffiche pas avant le prochain lancement. */
  updateDismissed = $state(false);
  /** Dernière suppression, annulable pendant quelques secondes. */
  undo = $state<{ id: number; label: string } | null>(null);
  /** Incrémenté pour demander au widget de placer le curseur dans « Nouvelle carte ». */
  quickAddRequest = $state(0);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUpdate: Update | null = null;
  private undoRestore: ((d: Data) => void) | null = null;
  private undoTimer: ReturnType<typeof setTimeout> | undefined;
  private geometryTimer: ReturnType<typeof setTimeout> | undefined;
  /** Vrai pendant qu'on redimensionne la fenêtre nous-mêmes : ces mouvements ne sont pas enregistrés. */
  private applyingWindow = false;

  get settings(): Settings {
    return this.data.settings;
  }

  async init(): Promise<void> {
    try {
      const raw = await platform.loadRaw();
      this.data = m.normalize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      this.loadError = 'Impossible de lire fini.json : ' + String(e) + '. Les copies des 7 derniers jours sont dans le sous-dossier backups.';
    }
    this.loaded = true;

    platform.onTrayAction({
      open: () => void this.openFull(),
      compact: () => void this.openCompact(),
      quit: () => void this.quit()
    });
    platform.onCloseRequested(() => this.closeWindow());
    platform.onGeometryChange(() => {
      clearTimeout(this.geometryTimer);
      this.geometryTimer = setTimeout(() => void this.recordGeometry(), 500);
    });
    await this.applyShortcut();
    await platform.syncAutostart(this.settings.launchAtStartup).catch(() => {});

    this.version = await updater.currentVersion();
    void this.checkForUpdate(true);
    setInterval(() => void this.checkForUpdate(true), UPDATE_CHECK_EVERY);

    const auto = await platform.launchedAtStartup();
    if (auto && this.settings.startupMode === 'tray') return;
    if (auto && this.settings.startupMode === 'compact') await this.enterCompact();
    else await this.applyWindowMode();
    await platform.show();
  }

  /** Applique une modification aux données puis sauvegarde (regroupée sur 200 ms). */
  mutate(fn: (d: Data) => void): void {
    fn(this.data);
    if (this.loadError) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), 200);
  }

  /** Écrit tout de suite la sauvegarde en attente, s'il y en a une. */
  async flush(): Promise<void> {
    if (!this.saveTimer) return;
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    await platform.saveRaw(JSON.stringify($state.snapshot(this.data), null, 2));
  }

  async quit(): Promise<void> {
    await this.flush();
    await platform.quit();
  }

  go(view: View): void {
    this.view = view;
    if (view.name === 'board') this.compactProjectId = view.projectId;
  }

  // --- Réglages ---

  async updateSettings(patch: Partial<Settings>): Promise<void> {
    this.mutate((d) => Object.assign(d.settings, patch));
    if (patch.launchAtStartup !== undefined) await platform.syncAutostart(patch.launchAtStartup);
    if (patch.compactAlwaysOnTop !== undefined && this.compact) await platform.setAlwaysOnTop(patch.compactAlwaysOnTop);
  }

  /** Change le raccourci ; s'il est refusé par Windows, on garde l'ancien. */
  async setShortcut(accelerator: string): Promise<boolean> {
    const ok = await platform.registerShortcut(accelerator, () => void this.onShortcut());
    if (ok) {
      this.mutate((d) => (d.settings.compactShortcut = accelerator));
    } else {
      await this.applyShortcut();
    }
    return ok;
  }

  private async applyShortcut(): Promise<void> {
    this.shortcutError = !(await platform.registerShortcut(this.settings.compactShortcut, () => void this.onShortcut()));
  }

  // --- Suppressions annulables ---

  deleteTask(id: string): void {
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return;
    const copy: Task = $state.snapshot(task);
    this.mutate((d) => m.deleteTask(d, id));
    this.offerUndo('Carte supprimée', (d) => {
      if (d.projects.some((p) => p.id === copy.projectId)) d.tasks.push(copy);
    });
  }

  deleteProject(id: string): void {
    const project = this.data.projects.find((p) => p.id === id);
    if (!project) return;
    const copy: Project = $state.snapshot(project);
    const tasks: Task[] = $state.snapshot(this.data.tasks.filter((t) => t.projectId === id));
    this.mutate((d) => m.deleteProject(d, id));
    if (this.view.name === 'board' && this.view.projectId === id) this.view = { name: 'home' };
    this.offerUndo(`Deck « ${copy.name} » supprimé`, (d) => {
      d.projects.push(copy);
      d.tasks.push(...tasks);
    });
  }

  undoLast(): void {
    const restore = this.undoRestore;
    if (!restore) return;
    this.mutate(restore);
    this.clearUndo();
  }

  clearUndo(): void {
    clearTimeout(this.undoTimer);
    this.undoRestore = null;
    this.undo = null;
  }

  private offerUndo(label: string, restore: (d: Data) => void): void {
    clearTimeout(this.undoTimer);
    this.undoRestore = restore;
    this.undo = { id: Date.now(), label };
    this.undoTimer = setTimeout(() => this.clearUndo(), UNDO_DELAY);
  }

  // --- Mises à jour ---

  /** `silent` : vérification automatique, une erreur réseau ne s'affiche pas. */
  async checkForUpdate(silent = false): Promise<void> {
    if (this.update.status === 'installing') return;
    if (!silent) this.update = { status: 'checking' };
    try {
      const found = await updater.findUpdate();
      this.pendingUpdate = found;
      this.update = found ? { status: 'available', version: found.version } : { status: 'uptodate' };
    } catch (e) {
      if (!silent) this.update = { status: 'error', message: String(e) };
    }
  }

  async installUpdate(): Promise<void> {
    const pending = this.pendingUpdate;
    if (!pending) return;
    await this.flush();
    this.update = { status: 'installing', version: pending.version, progress: 0 };
    try {
      await updater.installUpdate(pending, (progress) => {
        this.update = { status: 'installing', version: pending.version, progress };
      });
    } catch (e) {
      this.update = { status: 'error', message: String(e) };
    }
  }

  // --- Fenêtre ---

  private async onShortcut(): Promise<void> {
    if (this.compact && (await platform.isShownAndFocused())) {
      await platform.hide();
      return;
    }
    await this.openCompact();
    // Ajout express : le curseur attend dans « Nouvelle carte ».
    this.quickAddRequest++;
  }

  async hideWindow(): Promise<void> {
    await platform.hide();
  }

  /** Place la fenêtre selon le mode courant, à sa dernière position connue. */
  private async applyWindowMode(): Promise<void> {
    const mode = this.compact ? 'compact' : 'full';
    this.applyingWindow = true;
    try {
      await platform.setWindowMode(mode, this.data.window?.[mode], this.settings.compactAlwaysOnTop);
    } finally {
      // Les événements de déplacement arrivent un peu après : on les ignore encore un instant.
      setTimeout(() => (this.applyingWindow = false), 600);
    }
  }

  private async recordGeometry(): Promise<void> {
    if (this.applyingWindow) return;
    const g = await platform.readGeometry();
    if (!g) return;
    const mode = this.compact ? 'compact' : 'full';
    this.mutate((d) => {
      d.window ??= {};
      const previous = d.window[mode];
      // Agrandie : on garde la taille normale d'avant pour la restaurer au prochain lancement.
      d.window[mode] = g.maximized && previous ? { ...previous, maximized: true } : g;
    });
  }

  async enterCompact(projectId?: string): Promise<void> {
    // Par défaut, le widget montre le dernier deck ouvert.
    if (projectId) this.compactProjectId = projectId;
    if (!this.data.projects.some((p) => p.id === this.compactProjectId)) {
      this.compactProjectId = m.sortedProjects(this.data)[0]?.id ?? null;
    }
    this.deckModal = null;
    this.compact = true;
    await this.applyWindowMode();
  }

  async exitCompact(): Promise<void> {
    this.compact = false;
    if (this.compactProjectId) this.view = { name: 'board', projectId: this.compactProjectId };
    await this.applyWindowMode();
  }

  async openCompact(): Promise<void> {
    if (!this.compact) await this.enterCompact();
    await platform.show();
  }

  async openFull(): Promise<void> {
    if (this.compact) await this.exitCompact();
    await platform.show();
  }

  async closeWindow(): Promise<void> {
    if (this.settings.closeAction === 'tray') await platform.hide();
    else await this.quit();
  }
}

export const app = new AppState();
