import { cubicOut } from 'svelte/easing';
import { app } from './app.svelte';

export const motionOn = () => !app.settings.reduceMotion;

/** Carte distribuée depuis la droite (carte remise en jeu, nouvelle carte, récap). */
export function deal(_node: Element, { distance = 260 }: { distance?: number } = {}) {
  if (!motionOn()) return { duration: 0 };
  return {
    duration: 380,
    easing: cubicOut,
    css: (t: number, u: number) =>
      `transform: translate(${u * distance}px, ${-u * 20}px) rotate(${u * 12}deg) scale(${0.9 + 0.1 * t}); opacity: ${t}`
  };
}

/** Petit rebond de la pile quand une carte y atterrit. */
export function bump(el: Element | undefined) {
  if (!el || !motionOn()) return;
  el.animate(
    [
      { transform: 'translateY(-8px) scale(1.05)' },
      { transform: 'translateY(2px) scale(0.99)', offset: 0.6 },
      { transform: 'none' }
    ],
    { duration: 300, easing: 'ease-out' }
  );
}
