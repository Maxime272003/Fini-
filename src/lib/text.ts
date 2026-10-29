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

/** Longueur maximale d'une carte, comme les champs de saisie. */
export const CARD_MAX = 200;

/**
 * Texte glissé depuis une autre application (ou un post-it) : espaces superflus retirés,
 * lignes vides regroupées, coupé à la longueur d'une carte. Null s'il n'y a rien à poser.
 */
export function cleanDroppedText(raw: string): string | null {
  const text = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return null;
  return text.length > CARD_MAX ? text.slice(0, CARD_MAX - 1).trimEnd() + '…' : text;
}

/** Vrai si l'objet glissé contient du texte venu d'ailleurs. */
export const carriesText = (e: DragEvent): boolean => !!e.dataTransfer?.types.includes('text/plain');
