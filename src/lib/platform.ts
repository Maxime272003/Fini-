// Tout ce qui touche au système passe par ici. Hors de Tauri (npm run dev dans un navigateur),
// les données vont dans localStorage et les fonctions de fenêtre ne font rien.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const STORAGE_KEY = 'fini';
const FULL_SIZE = { width: 1200, height: 760, minWidth: 900, minHeight: 600 };
const COMPACT_SIZE = { width: 380, height: 640 };

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

/** Passe la fenêtre en petit widget ou la remet en taille normale. */
export async function setCompactWindow(on: boolean, alwaysOnTop: boolean): Promise<void> {
  if (!isTauri) return;
  const w = getCurrentWindow();
  if (on) {
    if (await w.isMaximized()) await w.unmaximize();
    await w.setMinSize(new LogicalSize(320, 480));
    await w.setSize(new LogicalSize(COMPACT_SIZE.width, COMPACT_SIZE.height));
    await w.setAlwaysOnTop(alwaysOnTop);
  } else {
    await w.setAlwaysOnTop(false);
    await w.setSize(new LogicalSize(FULL_SIZE.width, FULL_SIZE.height));
    await w.setMinSize(new LogicalSize(FULL_SIZE.minWidth, FULL_SIZE.minHeight));
    await w.center();
  }
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
