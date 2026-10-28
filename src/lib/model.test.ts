import { describe, expect, it } from 'vitest';
import {
  addProject,
  addTask,
  deleteProject,
  doneTasks,
  emptyData,
  moveTask,
  nextColor,
  normalize,
  setDone,
  todoTasks
} from './model';
import { doneInWeek, isoWeekNumber, weekRange } from './week';

function deckWith(texts: string[]) {
  const d = emptyData();
  const p = addProject(d, 'Deck', '#3D7BFF');
  const tasks = texts.map((t) => addTask(d, p.id, t)!);
  return { d, p, tasks };
}

describe('cartes', () => {
  it('ignore une carte vide', () => {
    const { d, p } = deckWith([]);
    expect(addTask(d, p.id, '   ')).toBeNull();
    expect(d.tasks).toHaveLength(0);
  });

  it('finir puis remettre en jeu rend la carte à sa place', () => {
    const { d, p, tasks } = deckWith(['a', 'b', 'c']);
    setDone(d, tasks[1].id, true, new Date('2026-10-20T10:00:00Z'));
    expect(todoTasks(d, p.id).map((t) => t.text)).toEqual(['a', 'c']);
    expect(doneTasks(d, p.id)[0].doneAt).toBe('2026-10-20T10:00:00.000Z');
    setDone(d, tasks[1].id, false);
    expect(todoTasks(d, p.id).map((t) => t.text)).toEqual(['a', 'b', 'c']);
    expect(tasks[1].doneAt).toBeNull();
  });

  it('la défausse a la dernière carte finie au-dessus', () => {
    const { d, p, tasks } = deckWith(['a', 'b']);
    setDone(d, tasks[1].id, true, new Date('2026-10-20T10:00:00Z'));
    setDone(d, tasks[0].id, true, new Date('2026-10-21T10:00:00Z'));
    expect(doneTasks(d, p.id).map((t) => t.text)).toEqual(['b', 'a']);
  });

  it('réordonne les cartes en jeu', () => {
    const { d, p, tasks } = deckWith(['a', 'b', 'c', 'd']);
    moveTask(d, tasks[3].id, 0);
    expect(todoTasks(d, p.id).map((t) => t.text)).toEqual(['d', 'a', 'b', 'c']);
    moveTask(d, tasks[3].id, 2);
    expect(todoTasks(d, p.id).map((t) => t.text)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('réordonner ne déplace pas une carte finie remise en jeu ensuite', () => {
    const { d, p, tasks } = deckWith(['a', 'b', 'c']);
    setDone(d, tasks[1].id, true);
    moveTask(d, tasks[2].id, 0);
    setDone(d, tasks[1].id, false);
    expect(todoTasks(d, p.id).map((t) => t.text)).toEqual(['c', 'b', 'a']);
  });
});

describe('decks', () => {
  it('supprimer un deck supprime ses cartes', () => {
    const { d, p } = deckWith(['a', 'b']);
    const other = addProject(d, 'Autre', '#FF9F1C');
    addTask(d, other.id, 'x');
    deleteProject(d, p.id);
    expect(d.projects.map((x) => x.name)).toEqual(['Autre']);
    expect(d.tasks.map((t) => t.text)).toEqual(['x']);
  });

  it('propose une couleur pas encore prise', () => {
    const d = emptyData();
    addProject(d, 'A', '#3D7BFF');
    expect(nextColor(d)).toBe('#FF9F1C');
  });

  it('complète un fichier incomplet sans perdre les données', () => {
    const d = normalize({
      projects: [{ id: 'p1', name: 'A', color: '#3D7BFF', order: 0, createdAt: '' }],
      tasks: [
        { id: 't1', projectId: 'p1', text: 'x', order: 0, done: true, doneAt: '2026-10-20T10:00:00Z', createdAt: '' },
        { id: 't2', projectId: 'inconnu', text: 'y', order: 0, done: false, doneAt: null, createdAt: '' }
      ],
      settings: { reduceMotion: true }
    });
    expect(d.tasks.map((t) => t.id)).toEqual(['t1']);
    expect(d.settings.reduceMotion).toBe(true);
    expect(d.settings.compactShortcut).toBe('Ctrl+Alt+F');
  });
});

describe('semaines', () => {
  it('numérote les semaines ISO', () => {
    expect(isoWeekNumber(new Date(2026, 9, 19))).toBe(43);
    expect(isoWeekNumber(new Date(2026, 9, 25))).toBe(43);
    expect(isoWeekNumber(new Date(2021, 0, 3))).toBe(53);
    expect(isoWeekNumber(new Date(2024, 11, 30))).toBe(1);
  });

  it('calcule la semaine dernière', () => {
    const r = weekRange(-1, new Date(2026, 9, 28, 15));
    expect(r.week).toBe(43);
    expect(r.start).toEqual(new Date(2026, 9, 19));
    expect(r.end).toEqual(new Date(2026, 9, 26));
    expect(r.label).toBe('19 – 25 oct. 2026');
  });

  it('écrit le mois des deux bornes quand la semaine chevauche deux mois', () => {
    expect(weekRange(0, new Date(2026, 8, 30)).label).toBe('28 sept. – 4 oct. 2026');
  });

  it('ne garde que les cartes finies dans la semaine', () => {
    const { d, tasks } = deckWith(['a', 'b', 'c']);
    setDone(d, tasks[0].id, true, new Date(2026, 9, 18, 23, 59));
    setDone(d, tasks[1].id, true, new Date(2026, 9, 19, 0, 0));
    setDone(d, tasks[2].id, true, new Date(2026, 9, 25, 23, 59));
    const r = weekRange(-1, new Date(2026, 9, 28));
    expect(doneInWeek(d, r).map((t) => t.text)).toEqual(['b', 'c']);
  });
});
