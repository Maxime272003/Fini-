/** « 0 finie », « 1 finie », « 2 finies » : en français, 0 et 1 sont au singulier. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}
