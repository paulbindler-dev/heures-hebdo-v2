# Audit design — Heures Hebdo
*Réalisé avec /impeccable critique — 25 juin 2026*

---

## Ce document, c'est quoi ?

C'est le compte-rendu complet d'une analyse de design de l'application Heures Hebdo, menée avec un outil appelé **Impeccable**. Il évalue l'interface selon des critères professionnels — les mêmes utilisés par des designers senior — et propose des pistes d'amélioration concrètes.

Ce document s'adresse à toi sans jargon technique. Quand un terme technique est inévitable, il est expliqué.

---

## Le score global : 30 / 40

Le score vient d'une méthode reconnue en ergonomie : les **10 heuristiques de Jakob Nielsen**. Ce sont 10 principes fondamentaux qui définissent ce qu'est une interface bien conçue. Chacun est noté de 0 à 4.

**30/40 = "Bonne interface"**. La grille de lecture :

| Score | Niveau | Ce que ça veut dire |
|-------|--------|---------------------|
| 36–40 | Excellent | Quasi parfait — juste du polish |
| 28–35 | Bon | Base solide, améliorations ciblées |
| 20–27 | Acceptable | Des problèmes visibles pour les utilisateurs |
| 12–19 | Faible | Refonte majeure nécessaire |
| 0–11 | Critique | Inutilisable en l'état |

Pour une première app, 30/40 est un très bon résultat. Ça veut dire que les fondations sont saines et que les problèmes identifiés sont des améliorations, pas des corrections d'urgence.

---

## Les 10 heuristiques de Nielsen — expliquées simplement

### 1. Visibilité de l'état du système — Score : 3/4

**Principe :** L'interface doit toujours dire à l'utilisateur ce qu'elle est en train de faire. Si quelque chose se passe en arrière-plan, tu dois le savoir.

**Ce qui marche :** Quand tu ouvres l'app, un écran de chargement t'indique que ça charge. Quand tu choisis un identifiant, l'app te dit en temps réel s'il est disponible ou non. Quand une erreur de sauvegarde se produit, un message apparaît en bas.

**Ce qui manque :** Quand tu saisis des heures et que l'app les sauvegarde dans Supabase (le cloud), rien ne te le confirme. Tu dois faire confiance que ça s'est bien passé. Si ta connexion était mauvaise à ce moment-là, tu ne le saurais pas.

---

### 2. Correspondance avec le monde réel — Score : 4/4

**Principe :** L'interface doit parler le même langage que l'utilisateur. Pas de jargon, pas de termes inventés.

**Ce qui marche parfaitement :** Arrivée, Midi, Pause, Reprise, Départ, Férié, Semaine type — tout le vocabulaire est celui d'un collaborateur de cabinet notarial. Aucune traduction mentale nécessaire. C'est la note maximale.

---

### 3. Contrôle et liberté — Score : 3/4

**Principe :** L'utilisateur doit toujours pouvoir annuler une action ou revenir en arrière facilement.

**Ce qui marche :** Fermer le sélecteur d'heure avec Échap, annuler la modale "Semaine type", annuler une copie de jour avec Échap.

**Ce qui manque :** Si tu cliques "Effacer le jour" dans le menu ⋯, le jour est effacé instantanément. Pas d'annulation possible. Si c'était une erreur, tu dois tout ressaisir.

---

### 4. Cohérence et standards — Score : 3/4

**Principe :** Les mêmes actions doivent fonctionner de la même façon partout dans l'interface. L'utilisateur ne doit pas se demander si "cliquer ici" va faire la même chose qu'avant.

**Ce qui marche :** Les boutons, les menus, les champs d'heure — le style est cohérent partout.

**Ce qui manque :** Deux actions utilisent une fenêtre de confirmation du navigateur (boîte grise native du système d'exploitation — "Nouvelle semaine" et "Enregistrer comme semaine type"). Toutes les autres confirmations sont gérées différemment. Ça crée une rupture visuelle inattendue.

---

### 5. Prévention des erreurs — Score : 3/4

**Principe :** La meilleure gestion des erreurs, c'est de les empêcher avant qu'elles se produisent.

**Ce qui marche :** Le sélecteur d'identifiant (slug) valide le format en temps réel et vérifie la disponibilité avant de te laisser continuer. Le champ d'heure accepte "730" et le transforme en "07:30" — il est très tolérant aux variations de saisie.

**Ce qui manque :** Si tu saisis une heure incohérente (arrivée après-midi avant l'heure de midi), rien ne t'avertit. L'app calcule quand même, parfois avec des résultats absurdes.

---

### 6. Reconnaissance plutôt que mémorisation — Score : 2/4

**Principe :** L'utilisateur ne doit pas avoir à mémoriser comment l'interface fonctionne. Les options et actions doivent être visibles ou facilement trouvables.

**Note la plus faible — voici pourquoi :**

**Problème 1 :** Le bouton ⋯ (menu d'actions par jour) est **invisible par défaut**. Il n'apparaît que quand tu passes la souris dessus. Si tu ne l'as pas découvert par hasard, tu ne sais pas qu'il existe. Pourtant il contient des fonctions importantes : marquer un jour férié, copier un jour, effacer.

**Problème 2 :** L'astuce de saisie rapide ("tape 730 pour avoir 07:30") est affichée en bas de l'app, mais elle **disparaît automatiquement après 21 jours** d'utilisation. Si tu changes d'appareil, elle ne réapparaît pas.

**Problème 3 :** Le lien "Comment ça marche ?" en bas de la page d'accueil est dans la couleur la plus discrète de toute l'interface. Difficile à trouver.

---

### 7. Flexibilité et efficacité — Score : 3/4

**Principe :** Les utilisateurs experts doivent pouvoir aller plus vite que les débutants. L'interface doit offrir des raccourcis sans compliquer l'expérience des novices.

**Ce qui marche :** Navigation avec la touche Tab entre les champs, saisie libre des heures, copier-coller de jours entiers, la semaine type pour pré-remplir automatiquement.

**Ce qui manque :** Pas de raccourci clavier pour "Nouvelle semaine" ou pour accéder au menu d'une journée. Les actions les plus courantes ne sont accessibles qu'à la souris.

---

### 8. Esthétique et minimalisme — Score : 3/4

**Principe :** L'interface ne doit contenir que ce qui est nécessaire. Chaque élément doit gagner sa place. Plus il y a d'éléments, moins chacun attire l'attention.

**Ce qui marche :** La table est propre, sans éléments superflus. Les couleurs sont sobres. Pas de publicité, pas de bannières, pas de décorations inutiles.

**Ce qui gêne :** Les deux grandes cases de statistiques en haut (Total semaine / Delta) affichent des chiffres en **48px** — une taille qu'on retrouve typiquement dans des applications SaaS qui veulent impressionner des managers. Pour un outil de saisie personnel, c'est disproportionné par rapport à la table qui est le vrai cœur de l'app. Ces statistiques sont utiles, mais elles prennent trop de place.

---

### 9. Aide à la récupération après les erreurs — Score : 3/4

**Principe :** Quand une erreur se produit, l'interface doit expliquer le problème en langage clair et proposer une solution concrète.

**Ce qui marche :** Si la sauvegarde Supabase échoue, un message s'affiche avec le détail de l'erreur. Si l'identifiant est déjà pris, c'est clairement indiqué avec la couleur rouge et un message explicite.

**Ce qui manque :** Si tu saisis une heure dans un mauvais format que l'app ne reconnaît pas, le champ revient simplement à vide — sans t'expliquer ce qui s'est passé.

---

### 10. Aide et documentation — Score : 3/4

**Principe :** L'aide doit exister, être facile à trouver, et être organisée par tâche (pas par fonctionnalité).

**Ce qui marche :** Le guide "Comment ça marche ?" sur la page d'accueil explique bien les 5 étapes principales. Il est accessible depuis la page d'accueil et depuis l'écran de confirmation.

**Ce qui manque :** Dans l'app principale (app.html), il n'y a aucun accès à ce guide. Si tu as oublié comment fonctionne une option du menu ⋯ ou comment modifier ta semaine type, tu dois retourner sur la page d'accueil ou te souvenir de tête.

---

## Les problèmes détaillés — par ordre d'importance

### Problème critique : les textes trop clairs

C'est le problème le plus objectif de toute l'interface. Les normes d'accessibilité internationales (WCAG AA) définissent qu'un texte doit avoir un **rapport de contraste d'au moins 4.5:1** avec son fond pour être lisible dans de bonnes conditions.

**Ce que ça veut dire concrètement :** Si le texte est blanc sur blanc, le rapport est 1:1 — illisible. Si le texte est noir sur blanc, le rapport est 21:1 — parfait. 4.5:1 est le minimum raisonnable.

**Ce qui a été mesuré dans l'app :**

| Élément | Contraste mesuré | Minimum requis | Résultat |
|---------|-----------------|----------------|----------|
| Labels des stats ("TOTAL SEMAINE") | 2.68 : 1 | 4.5 : 1 | ❌ |
| Les "/8h" et "/3h" sous chaque total | 1.64 : 1 | 4.5 : 1 | ❌ |
| "Heures Hebdo" dans le header | 2.48 : 1 | 4.5 : 1 | ❌ |
| "heures-hebdo.vercel.app/" dans le champ | 2.68 : 1 | 4.5 : 1 | ❌ |
| Le texte d'aide sous le champ d'identifiant | 2.48 : 1 | 4.5 : 1 | ❌ |
| Texte de saisie principal | 17.48 : 1 | 4.5 : 1 | ✅ |
| Labels des lignes (Arrivée, Midi…) | 6.29 : 1 | 4.5 : 1 | ✅ |

La bonne nouvelle : les couleurs du texte principal et des labels de lignes sont parfaites. Seules les couleurs "secondaires" et "très discrètes" posent problème — et elles sont utilisées sur des informations fonctionnelles (pas juste décoratives).

**La correction est simple :** Assombrir légèrement deux variables de couleur dans le CSS (`--text3` et `--text4`). C'est une modification de 2 lignes dans chaque fichier.

---

### Problème notable : les boutons ⋯ cachés

Le menu d'actions par jour (copier, marquer férié, effacer, ajouter une session) est accessible via le bouton **⋯** qui apparaît dans l'en-tête de chaque colonne de jour. Mais ce bouton est **invisible** tant que tu ne passes pas la souris dessus.

En pratique, si tu n'as jamais vu ce bouton apparaître par hasard, tu ne sais pas qu'il existe. Et même en sachant qu'il existe, trouver exactement où passer la souris pour le faire apparaître demande un effort cognitif inutile.

**La correction :** Afficher le bouton avec une opacité réduite (très discret au repos, pleinement visible au survol). Il reste discret sans être introuvable.

---

### Problème notable : la sauvegarde silencieuse

Quand tu saisis des heures, l'app envoie les données à Supabase (le cloud) en arrière-plan. Si ça réussit — aucun message. Si ça échoue — un message d'erreur apparaît.

C'est le comportement de nombreuses apps modernes (Google Docs par exemple), mais la différence est que dans Google Docs, tu vois "Enregistrement…" puis "Toutes les modifications ont été enregistrées". Cette rassurance passive te permet de fermer l'onglet sans inquiétude.

Sans ça, tu dois faire confiance que la synchronisation s'est bien passée — ce qui est particulièrement important pour une app dont la raison d'être est justement de synchroniser sur tous tes appareils.

**La correction :** Un petit indicateur dans le header — un point ou une icône discrète qui indique "Sauvegardé il y a quelques secondes". Invisible quand tout va bien, rassurant quand on fait attention.

---

### Problème esthétique : les grandes cases de statistiques

Les deux cases "Total semaine" et "Delta / objectif" avec des chiffres en 48px sont une convention visuelle qu'on retrouve dans les tableaux de bord d'entreprise (Salesforce, Jira, etc.) — là où l'objectif est d'impressionner des managers qui jettent un coup d'œil rapide.

Pour un outil de saisie personnel dont le mantra est "l'interface s'efface", ces grandes cases détournent le regard de la table qui est l'essentiel. L'information est utile — la forme est disproportionnée.

**La correction proposée :** Intégrer ces statistiques dans la ligne du header, en format compact, à côté du nom de la semaine. Même information, moins de bruit visuel.

---

### Problème de finition : les boîtes de dialogue du navigateur

Deux actions dans l'app déclenchent une fenêtre native du navigateur (la boîte grise standard du système) :
- "Nouvelle semaine" → "Recharger la semaine type ? Les heures saisies seront effacées."
- "Enregistrer la semaine en cours comme semaine type"

Ces boîtes grises rompent le fil de l'expérience — elles viennent du système d'exploitation, pas de l'app. Elles ont un style différent de tout le reste.

**La correction :** Remplacer par une confirmation intégrée dans l'interface — par exemple, le bouton "Nouvelle semaine" se transforme en "Confirmer ?" pendant 2 secondes avant d'agir.

---

## Ce qui est bien — et doit rester

Avant de passer aux améliorations, il faut nommer ce qui fonctionne, parce que c'est significatif pour une première app :

**La validation d'identifiant** est un exemple à montrer en cours. Elle vérifie le format en temps réel, attend que tu aies fini de taper (400ms de délai intelligent), vérifie la disponibilité dans la base de données, et communique l'état avec trois signaux simultanés : couleur de bordure + icône + texte. C'est du bon travail.

**Le vocabulaire** correspond exactement au contexte notarial. Aucun terme anglais inutile, aucun jargon informatique exposé à l'utilisateur.

**Le parsing d'heure** ("730" → "07:30") est une attention aux utilisateurs qui tapent vite. Cette tolérance aux variations de saisie est la marque d'une interface qui respecte l'utilisateur.

**Le mode sombre automatique** — l'app suit la préférence du système d'exploitation sans switch manuel. Et les couleurs du mode sombre sont bien calibrées (elles ont toutes été redéfinies correctement, pas juste inversées).

**La structure de tokens CSS** — les couleurs, tailles et espacements sont définis comme des variables réutilisables, pas codés en dur partout. Ça rend l'app maintenable : changer la couleur d'erreur ne demande qu'une modification à un seul endroit.

---

## Le mockup — à quoi ressemblerait une version 40/40

Voici une représentation des principaux changements visuels. Ce n'est pas du code — c'est une esquisse de la direction.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  Heures Hebdo   Semaine du 23 au 27 juin 2026              ● Sauvegardé  10s   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  32h45 / 35h    Δ +02:45                    [Semaine type ▾]  [Nouvelle semaine]│
│                                                                                 │
├──────────┬───────────┬───────────┬───────────┬───────────┬───────────┤
│          │  Lundi    │  Mardi    │ Mercredi  │  Jeudi    │ Vendredi  │
│          │       ···  │       ··· │       ··· │       ··· │       ··· │  ← ··· visible
├──────────┼───────────┼───────────┼───────────┼───────────┼───────────┤  en opacité réduite
│ Arrivée  │   07:30   │   07:30   │   07:30   │   07:30   │   07:30   │
│ Midi     │   13:00   │   13:00   │   13:00   │   13:00   │   12:00   │
│ pause    │   01:00   │   01:00   │   01:00   │   01:00   │    —      │
│ Reprise  │   14:00   │   14:00   │   14:00   │   14:00   │    —      │
│ Départ   │   17:00   │   17:00   │   17:00   │   17:00   │   10:30   │
├──────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│          │   07:30   │   07:30   │   07:30   │   07:30   │   04:30   │
│          │    / 8h   │    / 8h   │    / 8h   │    / 8h   │    / 3h   │
│          │ (texte    │ lisible   │ en vrai   │ gris foncé│ visible)  │
└──────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

**Différences principales par rapport à l'actuel :**

| Actuel | Version 40/40 |
|--------|---------------|
| 2 grandes cartes stats (48px) séparées de l'en-tête | Stats intégrées dans le header, format compact |
| Aucun retour sur la sauvegarde | "● Sauvegardé — il y a 10s" dans le header |
| ⋯ complètement invisible au repos | ⋯ visible en opacité ~30% au repos, plein au survol |
| Labels stat ("/ 8h") à 1.64:1 de contraste | Même labels à 4.6:1 — lisibles |
| Boîtes grises du navigateur pour confirmer | Confirmation inline (bouton qui se transforme) |
| Vocabulaire "Heures Hebdo" à 2.48:1 | Même texte à 4.6:1 |

---

## Les commandes /impeccable — guide complet

Impeccable est une suite d'outils de design intégrée dans Claude Code. Chaque commande correspond à une intervention précise sur une interface. Elles se tapent dans la conversation avec Claude, précédées de `/impeccable`.

### Commandes de construction

| Commande | Ce qu'elle fait |
|----------|----------------|
| `/impeccable craft [élément]` | Conçoit et code un élément de bout en bout — UX d'abord, puis implémentation complète |
| `/impeccable shape [élément]` | Réfléchit à l'UX et propose un plan avant d'écrire du code |
| `/impeccable init` | Configure le contexte du projet (PRODUCT.md, DESIGN.md) — à faire une fois par projet |
| `/impeccable document` | Génère un DESIGN.md à partir du code existant — capture le système de design actuel |
| `/impeccable extract [cible]` | Extrait les couleurs, tailles, composants répétés en un système de design réutilisable |

### Commandes d'évaluation

| Commande | Ce qu'elle fait |
|----------|----------------|
| `/impeccable critique [cible]` | Analyse complète UX/design — scores heuristiques, anti-patterns, personas. **Tu l'as utilisée ici.** |
| `/impeccable audit [cible]` | Vérifications techniques — accessibilité (contraste, clavier), performance, responsive |

### Commandes d'amélioration

| Commande | Ce qu'elle fait |
|----------|----------------|
| `/impeccable polish [cible]` | Passe finale avant mise en ligne — reprend les problèmes du dernier critique et les corrige |
| `/impeccable bolder [cible]` | Amplifie un design trop sage ou trop fade |
| `/impeccable quieter [cible]` | Calme un design trop agressif ou visuellement surchargé |
| `/impeccable distill [cible]` | Simplifie à l'essentiel — retire tout ce qui n'est pas nécessaire |
| `/impeccable harden [cible]` | Rend l'interface robuste — états d'erreur, cas limites, internationalisation |
| `/impeccable onboard [cible]` | Conçoit l'expérience première utilisation et les états vides |

### Commandes d'amélioration spécialisées

| Commande | Ce qu'elle fait |
|----------|----------------|
| `/impeccable animate [cible]` | Ajoute des animations intentionnelles — transitions, retours visuels, micro-interactions |
| `/impeccable colorize [cible]` | Ajoute de la couleur stratégique à une interface monochrome |
| `/impeccable typeset [cible]` | Améliore la typographie — hiérarchie, lisibilité, espacement, polices |
| `/impeccable layout [cible]` | Corrige l'espacement, le rythme, et la hiérarchie visuelle |
| `/impeccable delight [cible]` | Ajoute de la personnalité — petits détails qui rendent l'interface mémorable |
| `/impeccable overdrive [cible]` | Pousse le design au-delà des conventions — pour les moments qui justifient l'audace |

### Commandes de correction

| Commande | Ce qu'elle fait |
|----------|----------------|
| `/impeccable clarify [cible]` | Améliore le texte de l'interface — labels, messages d'erreur, instructions |
| `/impeccable adapt [cible]` | Adapte pour différents appareils et tailles d'écran |
| `/impeccable optimize [cible]` | Diagnostique et corrige les problèmes de performance de l'interface |
| `/impeccable live` | Mode itération en temps réel — sélectionne des éléments dans le navigateur et génère des variantes |

### Pour Heures Hebdo, par ordre de priorité recommandé

1. **`/impeccable audit app.html index.html`** — Corrige les contrastes et l'accessibilité en premier (problèmes objectifs et mesurables)
2. **`/impeccable layout app.html`** — Restructure la zone de statistiques et intègre le statut de sauvegarde
3. **`/impeccable polish app.html`** — Corrige les boîtes de dialogue natives et les ⋯ cachés
4. **`/impeccable critique app.html index.html`** — Re-passer la critique après les corrections pour voir le score progresser

---

## Contexte de cet audit

**App :** Heures Hebdo v2  
**Date :** 25 juin 2026  
**Outil :** /impeccable critique (Claude Code)  
**Score :** 30/40 (Bon)  
**Problèmes bloquants (P0) :** 0  
**Problèmes majeurs (P1) :** 2 (contraste WCAG, ⋯ invisible)  
**Première app — contexte :** Projet personnel, usage desktop principal, exercice de développement. La qualité obtenue est au-dessus de la moyenne pour une première réalisation.

---

*Document généré automatiquement par /impeccable critique — Heures Hebdo v2*
