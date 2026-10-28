// Tout ce qui touche au système passe par ici. Hors de Tauri (npm run dev dans un navigateur),
// les données vont dans localStorage et les fonctions de fenêtre ne font rien.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import {
  availableMonitors,
  currentMonitor,
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
  PhysicalSize
} from '@tauri-apps/api/window';
import type { Geometry } from './types';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const STORAGE_KEY = 'fini';
const FULL_SIZE = { width: 1200, height: 760, minWidth: 900, minHeight: 600 };
const COMPACT_SIZE = { width: 380, height: 640 };
const COMPACT_MIN = { width: 320, height: 480 };

export async function loadRaw(): Promise<string | null> {
  if (isTauri) return invoke<string | null>('load_data');
  return localStorage.getItem(STORAGE_KEY);
}

export async function saveRaw(contents: string): Promise<void> {
  if (isTauri) return invoke('save_data', { contents });
  localStorage.setItem(STORAGE_KEY, contents);
}

export async function dataFilePath(): Promise<string> {
  if (isTauri) return invoke<string>('data_file_path');
  return 'localStorage (mode navigateur)';
}

export async function openDataDir(): Promise<void> {
  if (isTauri) await invoke('open_data_dir');
}

export async function launchedAtStartup(): Promise<boolean> {
  return isTauri ? invoke<boolean>('launched_at_startup') : false;
}

export async function quit(): Promise<void> {
  if (isTauri) await invoke('quit');
}

export async function minimize(): Promise<void> {
  if (isTauri) await getCurrentWindow().minimize();
}

export async function toggleMaximize(): Promise<void> {
  if (isTauri) await getCurrentWindow().toggleMaximize();
}

export async function hide(): Promise<void> {
  if (isTauri) await getCurrentWindow().hide();
}

export async function show(): Promise<void> {
  if (!isTauri) return;
  const w = getCurrentWindow();
  await w.show();
  await w.unminimize();
  await w.setFocus();
}

export async function isShownAndFocused(): Promise<boolean> {
  if (!isTauri) return true;
  const w = getCurrentWindow();
  return (await w.isVisible()) && !(await w.isMinimized()) && (await w.isFocused());
}

export async function setAlwaysOnTop(on: boolean): Promise<void> {
  if (isTauri) await getCurrentWindow().setAlwaysOnTop(on);
}

export type WindowMode = 'full' | 'compact';

/**
 * Passe la fenêtre en grande fenêtre ou en widget, à la dernière position connue pour ce mode.
 * Sans position connue (ou si l'écran a disparu) : grande fenêtre au centre, widget en bas à droite.
 */
export async function setWindowMode(mode: WindowMode, saved: Geometry | undefined, alwaysOnTop: boolean): Promise<void> {
  if (!isTauri) return;
  const w = getCurrentWindow();
  if (await w.isMaximized()) await w.unmaximize();
  // On relâche d'abord la taille minimale pour pouvoir rétrécir vers le widget.
  await w.setMinSize(new LogicalSize(COMPACT_MIN.width, COMPACT_MIN.height));
  if (saved && (await isOnScreen(saved))) {
    await w.setSize(new PhysicalSize(saved.width, saved.height));
    await w.setPosition(new PhysicalPosition(saved.x, saved.y));
  } else if (mode === 'compact') {
    await w.setSize(new LogicalSize(COMPACT_SIZE.width, COMPACT_SIZE.height));
    await placeBottomRight();
  } else {
    await w.setSize(new LogicalSize(FULL_SIZE.width, FULL_SIZE.height));
    await w.center();
  }
  if (mode === 'full') await w.setMinSize(new LogicalSize(FULL_SIZE.minWidth, FULL_SIZE.minHeight));
  if (mode === 'full' && saved?.maximized) await w.maximize();
  await w.setAlwaysOnTop(mode === 'compact' && alwaysOnTop);
}

/** Position et taille actuelles, ou null si la fenêtre est cachée ou réduite (position non significative). */
export async function readGeometry(): Promise<Geometry | null> {
  if (!isTauri) return null;
  const w = getCurrentWindow();
  if (!(await w.isVisible()) || (await w.isMinimized())) return null;
  const position = await w.outerPosition();
  const size = await w.innerSize();
  return { x: position.x, y: position.y, width: size.width, height: size.height, maximized: await w.isMaximized() };
}

export function onGeometryChange(handler: () => void): void {
  if (!isTauri) return;
  const w = getCurrentWindow();
  void w.onMoved(handler);
  void w.onResized(handler);
}

/** La barre de titre est-elle sur un écran branché ? (évite une fenêtre perdue hors champ) */
async function isOnScreen(g: Geometry): Promise<boolean> {
  const x = g.x + 60;
  const y = g.y + 16;
  return (await availableMonitors()).some(
    (m) => x >= m.position.x && x < m.position.x + m.size.width && y >= m.position.y && y < m.position.y + m.size.height
  );
}

async function placeBottomRight(): Promise<void> {
  const w = getCurrentWindow();
  const monitor = await currentMonitor();
  if (!monitor) return w.center();
  const area = monitor.workArea;
  const size = await w.outerSize();
  const margin = Math.round(24 * monitor.scaleFactor);
  await w.setPosition(
    new PhysicalPosition(
      area.position.x + area.size.width - size.width - margin,
      area.position.y + area.size.height - size.height - margin
    )
  );
}

export async function syncAutostart(enabled: boolean): Promise<void> {
  if (!isTauri) return;
  const autostart = await import('@tauri-apps/plugin-autostart');
  const current = await autostart.isEnabled();
  if (enabled && !current) await autostart.enable();
  if (!enabled && current) await autostart.disable();
}

/** Enregistre le raccourci global. Renvoie false si le système le refuse (déjà pris, invalide…). */
export async function registerShortcut(accelerator: string, onPress: () => void): Promise<boolean> {
  if (!isTauri) return true;
  const gs = await import('@tauri-apps/plugin-global-shortcut');
  await gs.unregisterAll();
  try {
    await gs.register(accelerator, (e) => {
      if (e.state === 'Pressed') onPress();
    });
    return true;
  } catch {
    return false;
  }
}

export function onTrayAction(handlers: { open: () => void; compact: () => void; quit: () => void }): void {
  if (!isTauri) return;
  void listen('tray-open', handlers.open);
  void listen('tray-compact', handlers.compact);
  void listen('tray-quit', handlers.quit);
}

/** Appelé quand Windows demande de fermer la fenêtre (Alt+F4, barre des tâches…). */
export function onCloseRequested(handler: () => Promise<void>): void {
  if (!isTauri) return;
  void getCurrentWindow().onCloseRequested(async (event) => {
    event.preventDefault();
    await handler();
  });
}
