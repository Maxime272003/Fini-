/**
 * Taille du texte d'une carte selon sa longueur : plus la description est longue, plus la police
 * est petite, pour que la plupart des cartes s'affichent en entier sans agrandir la carte.
 */
export function cardTextSize(text: string): 'l' | 'm' | 's' {
  const n = text.trim().length;
  if (n <= 90) return 'l';
  if (n <= 135) return 'm';
  return 's';
}

/** « 0 finie », « 1 finie », « 2 finies » : en français, 0 et 1 sont au singulier. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}
