# Fini

Micro-app de bureau pour Windows : tes projets sont des decks, tes tâches sont des cartes.
Clique une carte pour la finir, elle se retourne et file dans la défausse.
Le récap de la semaine déroule toutes les cartes finies, pratique pour le point avec ta responsable.

- Cahier des charges : [`docs/CDC.md`](docs/CDC.md)
- Maquettes : https://claude.ai/artifact/14qc1KPLV62zjKYmG9PjJg

## Récupérer l'installateur

À chaque push, GitHub Actions compile l'app sous Windows (workflow **Build Windows**).
Ouvre le dernier run dans l'onglet *Actions* du dépôt et télécharge l'artefact
`Fini-installateur-windows` : c'est un `Fini_0.1.0_x64-setup.exe` qui s'installe sans droits administrateur.

Tes données sont dans `Documents\Fini\fini.json` (copie de sécurité `fini.backup.json` à chaque démarrage).

## Développer

Prérequis sous Windows : [Node.js 22](https://nodejs.org), [Rust](https://rustup.rs)
et les « Outils de génération C++ » de Visual Studio (voir les
[prérequis Tauri](https://v2.tauri.app/start/prerequisites/)).

```bash
npm install
```

```bash
npm run tauri dev
```

Pour travailler uniquement l'interface dans un navigateur (les données vont alors dans `localStorage`) :

```bash
npm run dev
```

Vérifications et tests :

```bash
npm run check
```

```bash
npm test
```

Construire l'installateur localement :

```bash
npm run tauri build
```

## Organisation

| Dossier | Contenu |
|---|---|
| `src/lib/model.ts` | Données et règles : decks, cartes, finir / remettre en jeu, réordonner |
| `src/lib/week.ts` | Semaines ISO et cartes finies de la semaine (récap) |
| `src/lib/app.svelte.ts` | État de l'app, sauvegarde, mode compact, démarrage |
| `src/lib/platform.ts` | Accès au système via Tauri (fenêtre, fichier, raccourci, démarrage avec Windows) |
| `src/components/` | Écrans : accueil, plateau, récap, compact, réglages |
| `src-tauri/` | Partie Rust : lecture/écriture du fichier, icône de notification, plugins |
