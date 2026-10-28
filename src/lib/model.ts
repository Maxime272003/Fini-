import { BACKS, COLORS, type CardBack, type Data, type Project, type Settings, type Task } from './types';

export const DEFAULT_SETTINGS: Settings = {
  launchAtStartup: false,
  startupMode: 'tray',
  closeAction: 'tray',
  compactAlwaysOnTop: true,
  compactShortcut: 'Ctrl+Alt+F',
  reduceMotion: false
};

export function emptyData(): Data {
  return { version: 1, projects: [], tasks: [], settings: { ...DEFAULT_SETTINGS } };
}

/** Relit un fichier potentiellement ancien ou incomplet en complétant les valeurs manquantes. */
export function normalize(raw: unknown): Data {
  const d = emptyData();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<Data>;
  if (Array.isArray(r.projects))
    d.projects = r.projects
      .filter((p) => p && typeof p.id === 'string')
      .map((p) => ({ ...p, back: BACKS.some((b) => b.id === p.back) ? p.back : 'classic' }));
  if (Array.isArray(r.tasks)) {
    const ids = new Set(d.projects.map((p) => p.id));
    d.tasks = r.tasks
      .filter((t) => t && typeof t.id === 'string' && ids.has(t.projectId))
      .map((t) => ({ ...t, done: !!t.done, doneAt: t.done ? (t.doneAt ?? null) : null }));
  }
  if (r.settings && typeof r.settings === 'object') d.settings = { ...DEFAULT_SETTINGS, ...r.settings };
  if (r.window && typeof r.window === 'object') d.window = r.window;
  return d;
}

export function uid(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Première couleur pas encore utilisée par un deck, sinon on reboucle. */
export function nextColor(d: Data): string {
  const used = new Set(d.projects.map((p) => p.color));
  return (COLORS.find((c) => !used.has(c.hex)) ?? COLORS[d.projects.length % COLORS.length]).hex;
}

export function sortedProjects(d: Data): Project[] {
  return [...d.projects].sort((a, b) => a.order - b.order);
}

export function addProject(d: Data, name: string, color: string, back: CardBack = 'harle', now = new Date()): Project {
  const p: Project = {
    id: uid('p'),
    name: name.trim(),
    color,
    back,
    order: d.projects.reduce((m, x) => Math.max(m, x.order + 1), 0),
    createdAt: now.toISOString()
  };
  d.projects.push(p);
  return p;
}

export function updateProject(d: Data, id: string, patch: Partial<Pick<Project, 'name' | 'color' | 'back'>>): void {
  const p = d.projects.find((x) => x.id === id);
  if (!p) return;
  if (patch.name !== undefined) p.name = patch.name.trim();
  if (patch.color !== undefined) p.color = patch.color;
  if (patch.back !== undefined) p.back = patch.back;
}

/** Déplace un deck à la position `toIndex` dans la liste des decks. */
export function moveProject(d: Data, id: string, toIndex: number): void {
  const list = sortedProjects(d);
  const p = list.find((x) => x.id === id);
  if (!p) return;
  const rest = list.filter((x) => x !== p);
  rest.splice(Math.max(0, Math.min(toIndex, rest.length)), 0, p);
  rest.forEach((x, k) => (x.order = k));
}

/** Supprime le deck et toutes ses cartes. */
export function deleteProject(d: Data, id: string): void {
  d.projects = d.projects.filter((p) => p.id !== id);
  d.tasks = d.tasks.filter((t) => t.projectId !== id);
}

export function todoTasks(d: Data, projectId: string): Task[] {
  return d.tasks.filter((t) => t.projectId === projectId && !t.done).sort((a, b) => a.order - b.order);
}

/** Cartes finies, de la plus ancienne à la plus récente (la dernière est le dessus de la défausse). */
export function doneTasks(d: Data, projectId: string): Task[] {
  return d.tasks
    .filter((t) => t.projectId === projectId && t.done)
    .sort((a, b) => (a.doneAt ?? '').localeCompare(b.doneAt ?? ''));
}

export function addTask(d: Data, projectId: string, text: string, now = new Date()): Task | null {
  const clean = text.trim();
  if (!clean) return null;
  const t: Task = {
    id: uid('t'),
    projectId,
    text: clean,
    order: d.tasks.filter((x) => x.projectId === projectId).reduce((m, x) => Math.max(m, x.order + 1), 0),
    done: false,
    doneAt: null,
    createdAt: now.toISOString()
  };
  d.tasks.push(t);
  return t;
}

export function updateTaskText(d: Data, id: string, text: string): void {
  const t = d.tasks.find((x) => x.id === id);
  const clean = text.trim();
  if (t && clean) t.text = clean;
}

export function deleteTask(d: Data, id: string): void {
  d.tasks = d.tasks.filter((t) => t.id !== id);
}

/**
 * Finit une carte ou la remet en jeu. Une carte remise en jeu reprend sa place d'origine
 * (son `order` n'est pas touché).
 */
export function setDone(d: Data, id: string, done: boolean, now = new Date()): void {
  const t = d.tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = done;
  t.doneAt = done ? now.toISOString() : null;
}

/** Déplace une carte en jeu à la position `toIndex` parmi les cartes en jeu de son deck. */
export function moveTask(d: Data, id: string, toIndex: number): void {
  const t = d.tasks.find((x) => x.id === id);
  if (!t || t.done) return;
  const list = todoTasks(d, t.projectId).filter((x) => x.id !== id);
  const i = Math.max(0, Math.min(toIndex, list.length));
  list.splice(i, 0, t);
  // Les cartes finies gardent leur ordre relatif : on renumérote seulement les cartes en jeu,
  // en réutilisant leurs anciens numéros triés pour ne pas bousculer les cartes finies.
  const slots = list.map((x) => x.order).sort((a, b) => a - b);
  list.forEach((x, k) => (x.order = slots[k]));
}
