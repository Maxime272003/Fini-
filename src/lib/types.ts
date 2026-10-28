export type StartupMode = 'window' | 'compact' | 'tray';
export type CloseAction = 'tray' | 'quit';

export interface Project {
  id: string;
  name: string;
  color: string;
  back: CardBack;
  order: number;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  text: string;
  order: number;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
}

export interface Settings {
  launchAtStartup: boolean;
  startupMode: StartupMode;
  closeAction: CloseAction;
  compactAlwaysOnTop: boolean;
  compactShortcut: string;
  reduceMotion: boolean;
}

/** Position et taille d'une fenêtre, en pixels physiques de l'écran. */
export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized?: boolean;
}

export interface Data {
  version: 1;
  projects: Project[];
  tasks: Task[];
  settings: Settings;
  /** Dernière position de la fenêtre normale et du widget compact. */
  window?: { full?: Geometry; compact?: Geometry };
}

/** Couleurs de dos de carte : la teinte principale et son bord foncé (effet d'épaisseur). */
export const COLORS = [
  { hex: '#3D7BFF', edge: '#2450B8', name: 'Bleu' },
  { hex: '#FF9F1C', edge: '#C46F00', name: 'Orange' },
  { hex: '#22C38E', edge: '#128A62', name: 'Vert' },
  { hex: '#FF4FA0', edge: '#C22770', name: 'Rose' },
  { hex: '#9B6BFF', edge: '#6A3FD1', name: 'Violet' },
  { hex: '#FF5A4F', edge: '#C2322A', name: 'Rouge' }
] as const;

/** Motifs de dos de carte, dessinés en CSS (app.css, `.card-back[data-back=…]`). */
export const BACKS = [
  { id: 'harle', name: 'Arlequin' },
  { id: 'wave', name: 'Seigaiha' },
  { id: 'deco', name: 'Art déco' },
  { id: 'cosmos', name: 'Constellation' },
  { id: 'pixel', name: 'Arcade' },
  { id: 'bauhaus', name: 'Bauhaus' },
  { id: 'classic', name: 'Classique' }
] as const;

export type CardBack = (typeof BACKS)[number]['id'];

export function edgeOf(hex: string): string {
  return COLORS.find((c) => c.hex === hex)?.edge ?? '#2A2148';
}
