# Fini

Micro-app de bureau pour Windows : tes projets sont des decks, tes tâches sont des cartes.
Clique une carte pour la finir, elle se retourne et file dans la défausse.
Le récap de la semaine déroule toutes les cartes finies, pratique pour le point avec ta responsable.

- Cahier des charges : [`docs/CDC.md`](docs/CDC.md)
- Maquettes : https://claude.ai/artifact/14qc1KPLV62zjKYmG9PjJg

## Installer

Télécharge le `Fini_…_x64-setup.exe` de la dernière
[Release](https://github.com/Maxime272003/Fini-/releases/latest) et lance-le : il s'installe sans droits administrateur.
Ensuite, plus besoin de réinstaller : l'app se met à jour toute seule (voir ci-dessous).

## Mises à jour

- **Push sur `main`** → le workflow **Release** compile l'app, lui donne la version `0.1.<numéro du run>`,
  signe l'installateur et publie une Release GitHub avec un fichier `latest.json`.
- **Dans l'app** → Fini lit ce `latest.json` au démarrage puis toutes les 6 heures. Si une version plus récente existe,
  un bandeau propose « Mettre à jour » : l'app télécharge la mise à jour, l'installe sans poser de question
  et redémarre. Les données (`Documents\Fini`) ne sont pas touchées. On peut aussi vérifier à la main dans
  *Réglages › Mises à jour*.
- **Les autres branches** → le workflow **Build Windows** vérifie seulement que tout compile (installateur non signé,
  disponible en artefact du run).

Les mises à jour sont signées : l'app refuse un installateur qui n'est pas signé avec la clé du projet.
La clé publique est dans `src-tauri/tauri.conf.json` ; la clé privée doit être enregistrée **une seule fois**
dans les secrets du dépôt :

1. GitHub › *Settings* › *Secrets and variables* › *Actions* › *New repository secret*.
2. Nom : `TAURI_SIGNING_PRIVATE_KEY`, valeur : le contenu du fichier de clé privée (une seule ligne).

Garde aussi une copie de cette clé privée en lieu sûr. Si elle est perdue, les versions déjà installées
ne pourront plus se mettre à jour, il faudra réinstaller une fois avec une nouvelle clé.

Tes données sont dans `Documents\Fini\fini.json` (une copie par jour dans `Documents\Fini\backups`, les 7 dernières sont gardées).

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

Construire l'installateur localement, sans signature de mise à jour :

```bash
npm run tauri build -- --config src-tauri/tauri.unsigned.conf.json
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
