# Fini — Cahier des charges (v0.1)

Micro-app de bureau pour suivre des tâches par projet, présentée comme un jeu de cartes.

Maquettes : https://claude.ai/artifact/14qc1KPLV62zjKYmG9PjJg

## 1. Objectif

- Noter rapidement des tâches, rangées par projet.
- Marquer une tâche comme finie, et pouvoir annuler.
- Revoir ce qui a été fait sur une semaine donnée, pour le montrer pendant un point avec sa responsable.

## 2. Métaphore

| Concept | Dans l'app |
|---|---|
| Projet | **Deck**, affiché comme un **plateau** (tapis de jeu) une fois ouvert |
| Tâche à faire | **Carte face visible**, dans la zone « En jeu » |
| Tâche finie | **Carte retournée** (dos « FINI ✓ » + date), envoyée dans la **défausse** |
| Récap hebdo | **Deck** de toutes les cartes finies de la semaine, qu'on déroule |

Style : cartes à collectionner modernes (esprit Balatro / Hearthstone). Fond violet nuit, cartes à cadre coloré,
ombres franches, typo pixel (Pixelify Sans) pour les titres et Rubik pour le texte.

## 3. Écrans

1. **Accueil — les decks** : grille des projets (pile de cartes à la couleur du deck, nombre de cartes à jouer,
   barre de progression), emplacement « Nouveau deck », accès au récap et au mode compact.
2. **Nouveau deck / modifier un deck** (fenêtre modale) : nom, couleur du dos des cartes (6 couleurs), aperçu.
   En modification : bouton « Supprimer le deck » avec confirmation.
3. **Plateau d'un projet** : zone « En jeu » (cartes à faire) + défausse (cartes finies, la dernière visible).
   - Clic sur une carte → elle se retourne et part dans la défausse.
   - Clic sur la carte du dessus de la défausse → elle revient en jeu (annuler).
4. **Plateau — édition** :
   - « Nouvelle carte » → carte vierge éditable sur place (Entrée pour poser, Échap pour annuler).
   - Menu « ⋯ » ou clic droit : modifier le texte, marquer comme finie, supprimer.
   - Glisser-déposer pour réordonner les cartes en jeu.
5. **Récap de la semaine** : toutes les cartes finies de la semaine, tous decks confondus, triées par date de fin.
   - Navigation semaine précédente / suivante (semaine ISO, du lundi au dimanche ; par défaut la semaine dernière).
   - Une grande carte à la fois (deck, texte, date de fin) ; flèches à l'écran, flèches du clavier, frise de mini-cartes.
   - Résumé du nombre de cartes par deck.
   - Pas d'export (présentation à l'écran).
6. **Mode compact** : petite fenêtre (≈ 380 × 640) qu'on peut garder au premier plan (épingle), sélecteur de deck,
   cartes en jeu en mini-format, saisie rapide d'une nouvelle carte, pile « FINI · n ».

## 4. Exigences fonctionnelles

| ID | Exigence | Priorité |
|---|---|---|
| F1 | Créer un deck (nom obligatoire, couleur par défaut attribuée) | Indispensable |
| F2 | Renommer, changer la couleur et supprimer un deck (confirmation ; supprime aussi ses cartes) | Indispensable |
| F3 | Ajouter une carte à un deck (description seule, texte libre) | Indispensable |
| F4 | Modifier le texte d'une carte, supprimer une carte | Indispensable |
| F5 | Marquer une carte finie / la remettre en jeu ; la date de fin est enregistrée | Indispensable |
| F6 | Réordonner les cartes en jeu (glisser-déposer) | Important |
| F7 | Récap par semaine, tous decks confondus | Indispensable |
| F8 | Mode compact, avec « toujours au premier plan » | Important |
| F9 | L'app rouvre le dernier écran et la dernière taille de fenêtre | Bonus |

Hors périmètre v1 : comptes, synchronisation, échéances, étiquettes, sous-tâches, notifications, export.

## 5. Exigences techniques

- **Plateforme** : Windows 10/11.
- **Stack** : Tauri 2 + Vite + TypeScript. Exécutable léger (~5–10 Mo). Rust n'est nécessaire que pour compiler.
- **Stockage** : un fichier JSON local, `%USERPROFILE%\Documents\Fini\fini.json`, créé au premier lancement.
  - Écriture atomique (fichier temporaire puis renommage) après chaque modification.
  - Copie de sauvegarde `fini.backup.json` au démarrage.
  - Le dossier de données peut être changé plus tard (hors v1).
- **Hors ligne** : aucune connexion réseau. Les polices sont embarquées dans l'app.
- **Accessibilité** : toutes les actions sont faisables au clavier, focus visible, contraste AA.

### Modèle de données

```json
{
  "version": 1,
  "projects": [
    { "id": "p_x1", "name": "Refonte site client", "color": "#3D7BFF", "order": 0, "createdAt": "2026-10-19T09:00:00Z" }
  ],
  "tasks": [
    {
      "id": "t_a1",
      "projectId": "p_x1",
      "text": "Préparer les redirections 301",
      "order": 3,
      "done": false,
      "doneAt": null,
      "createdAt": "2026-10-20T10:12:00Z"
    }
  ]
}
```

- `doneAt` est rempli quand la carte est finie et vidé si elle revient en jeu. Le récap s'appuie dessus.
- Supprimer un deck supprime ses cartes. Il n'y a pas de corbeille en v1.

## 6. Points ouverts

- Framework front : TypeScript sans framework ou un framework léger (Preact / Svelte).
- Affichage de la défausse : une seule pile, ou bien un bouton « Étaler » pour voir toutes les cartes finies du deck.
- Raccourci clavier global pour ouvrir le mode compact.
- Animations : retournement de carte et distribution des cartes dans le récap (déjà prévus dans les maquettes),
  avec un éventuel son discret ?
