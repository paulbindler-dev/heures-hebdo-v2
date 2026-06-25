# /impeccable — Guide complet

`/impeccable` est un outil de design intégré à Claude Code. Il analyse, critique et améliore les interfaces web. Chaque commande est spécialisée dans un aspect précis du design ou de la qualité.

---

## Comment l'utiliser

Dans Claude Code, tu tapes `/impeccable` suivi d'une commande et (souvent) d'un fichier cible :

```
/impeccable critique app.html
/impeccable polish app.html
/impeccable typeset app.html
```

Si tu ne précises pas de fichier, /impeccable l'infère depuis le contexte du projet.

---

## Les commandes par catégorie

---

### CONSTRUIRE

#### `/impeccable init`
**À quoi ça sert :** Initialise un nouveau projet. Crée les fichiers de contexte (`PRODUCT.md`, `DESIGN.md`) qui définissent ce qu'est l'application, pour qui, avec quel style.
**Quand l'utiliser :** Au tout début d'un projet, avant d'écrire la moindre ligne de code.

#### `/impeccable shape [fonctionnalité]`
**À quoi ça sert :** Planifie l'UX/UI d'une nouvelle fonctionnalité *avant* de la coder. Produit des maquettes et une description de la solution.
**Quand l'utiliser :** Quand tu sais ce que tu veux ajouter mais pas comment le présenter.
**Exemple :** `/impeccable shape formulaire de connexion`

#### `/impeccable craft [fonctionnalité]`
**À quoi ça sert :** Fait `shape` + implémentation complète en une seule étape. Planifie ET code la fonctionnalité.
**Quand l'utiliser :** Quand tu veux aller directement au résultat sans passer par une étape de validation intermédiaire.
**Exemple :** `/impeccable craft page d'accueil`

#### `/impeccable document`
**À quoi ça sert :** Lit le code existant et génère automatiquement un `DESIGN.md` qui documente le système de design en place (couleurs, polices, composants, tokens).
**Quand l'utiliser :** Sur un projet déjà existant pour lequel il n'y a pas encore de documentation design.

#### `/impeccable extract [cible]`
**À quoi ça sert :** Identifie les éléments réutilisables dans le code (boutons, cartes, couleurs…) et les isole dans un système de design structuré.
**Quand l'utiliser :** Quand ton code répète les mêmes styles à plusieurs endroits et que tu veux les centraliser.

---

### ÉVALUER

#### `/impeccable critique [fichier]`
**À quoi ça sert :** Audit UX complet basé sur les 10 heuristiques de Nielsen. Donne un score sur 40, identifie les problèmes prioritaires (P0 bloquants / P1 importants / P2 améliorations).
**Quand l'utiliser :** Pour avoir une vue d'ensemble de la qualité d'une interface avant ou après des modifications.
**Ce que ça produit :** Un rapport détaillé avec score, liste de problèmes classés, et recommandations concrètes.
**Exemple :** `/impeccable critique app.html`

#### `/impeccable audit [fichier]`
**À quoi ça sert :** Vérifications techniques automatisables — accessibilité (ARIA, contraste, zoom), performance (poids des fonts, render-blocking), responsive (overflow, touch targets).
**Différence avec critique :** `critique` évalue l'expérience utilisateur, `audit` vérifie la conformité technique.
**Quand l'utiliser :** Avant de mettre en production, ou après des modifications importantes.

---

### AFFINER

#### `/impeccable polish [fichier]`
**À quoi ça sert :** Passage de finition avant livraison. Vérifie que chaque composant fonctionne dans tous ses états (survol, focus, chargement, erreur, vide), que la copie est précise, que rien n'est cassé dans les cas limites.
**Quand l'utiliser :** Juste avant de déployer. C'est le "dernier regard".

#### `/impeccable bolder [fichier]`
**À quoi ça sert :** Amplifie un design trop sage, trop timide, trop générique. Ajoute du caractère, de la présence visuelle, de la personnalité.
**Quand l'utiliser :** Quand le résultat est techniquement correct mais manque d'impact, de personnalité.

#### `/impeccable quieter [fichier]`
**À quoi ça sert :** Inverse de `bolder`. Calme un design surchargé, trop coloré, trop agité. Retire le bruit visuel.
**Quand l'utiliser :** Quand il y a trop d'éléments qui attirent l'attention en même temps.

#### `/impeccable distill [fichier]`
**À quoi ça sert :** Réduit à l'essentiel. Supprime tout ce qui n'est pas indispensable — éléments décoratifs, fonctionnalités secondaires, complexité inutile.
**Quand l'utiliser :** Quand l'interface est devenue trop complexe au fil des ajouts.

#### `/impeccable harden [fichier]`
**À quoi ça sert :** Rend le code prêt pour la production — gestion des erreurs, des cas limites, de l'internationalisation (textes longs, langues RTL), des états de chargement manquants.
**Quand l'utiliser :** Sur une interface qui "fonctionne" en conditions normales mais qui casse dans les cas limites.

#### `/impeccable onboard [fichier]`
**À quoi ça sert :** Conçoit l'expérience du premier lancement : états vides, messages d'accueil, premiers pas guidés, activation de l'utilisateur.
**Quand l'utiliser :** Quand ton app n'a pas encore d'expérience "première utilisation" — l'état vide montre juste… du vide.

---

### ENRICHIR

#### `/impeccable animate [fichier]`
**À quoi ça sert :** Ajoute des animations intentionnelles (transitions d'état, révélations, feedback visuel). Respecte automatiquement `prefers-reduced-motion` pour les utilisateurs sensibles aux animations.
**Quand l'utiliser :** Quand l'interface est fonctionnelle mais statique et manque de fluidité.

#### `/impeccable colorize [fichier]`
**À quoi ça sert :** Ajoute de la couleur stratégique à une interface monochrome ou trop neutre. Définit une palette cohérente avec le contexte.
**Quand l'utiliser :** Sur une interface en gris/noir/blanc qui a besoin d'identité visuelle.

#### `/impeccable typeset [fichier]`
**À quoi ça sert :** Améliore la typographie — choix des polices, hiérarchie des tailles, interlignage, `tabular-nums` pour les chiffres, `font-optical-sizing`, espacement des lettres.
**Quand l'utiliser :** Quand les textes manquent de lisibilité ou de hiérarchie claire.
**Note :** Pour une app-outil desktop, les polices système (`-apple-system`, `Segoe UI`) sont souvent le meilleur choix — chargement instantané, rendu natif.

#### `/impeccable layout [fichier]`
**À quoi ça sert :** Corrige l'espacement, le rythme visuel, la hiérarchie spatiale. Aligne ce qui doit l'être, respire ce qui doit respirer.
**Quand l'utiliser :** Quand les éléments semblent "mal placés" sans qu'on sache exactement pourquoi.

#### `/impeccable delight [fichier]`
**À quoi ça sert :** Ajoute des touches de personnalité mémorables — micro-interactions, détails qui surprennent, moments qui font sourire. Au-delà du fonctionnel.
**Quand l'utiliser :** Sur une interface déjà solide, pour la rendre attachante.

#### `/impeccable overdrive [fichier]`
**À quoi ça sert :** Pousse le design au-delà des conventions. Résultats non-conformistes, audacieux, parfois risqués. Dépasse les limites habituelles du "raisonnable".
**Quand l'utiliser :** Quand tu veux voir ce que l'interface pourrait être si on levait toutes les contraintes. Expérimental.

---

### CORRIGER

#### `/impeccable clarify [fichier]`
**À quoi ça sert :** Améliore tous les textes de l'interface — labels, messages d'erreur, boutons, tooltips, états vides. Rend chaque mot plus précis et utile.
**Quand l'utiliser :** Quand les utilisateurs ne comprennent pas ce que font les boutons, ou quand les messages d'erreur ne disent rien d'actionnable.

#### `/impeccable adapt [fichier]`
**À quoi ça sert :** Adapte l'interface à différentes tailles d'écran et appareils. Responsive design, touch targets, comportements mobiles.
**Quand l'utiliser :** Quand l'interface est parfaite sur desktop mais cassée sur mobile ou tablette.

#### `/impeccable optimize [fichier]`
**À quoi ça sert :** Diagnostique et corrige les problèmes de performance visuelle — layout shifts, fonts qui bloquent le rendu, animations qui rament, images non optimisées.
**Quand l'utiliser :** Quand l'interface est lente à s'afficher ou "saute" au chargement.

---

### MODE INTERACTIF

#### `/impeccable live`
**À quoi ça sert :** Mode de variation visuelle en temps réel dans le navigateur. Tu sélectionnes un élément, Claude génère des alternatives visuelles directement dans la page.
**Quand l'utiliser :** Quand tu veux explorer des options visuelles rapidement sans modifier le code source.
**Prérequis :** Le serveur de dev doit être actif.

---

## Commandes de gestion

#### `/impeccable hooks on/off`
Active ou désactive le détecteur automatique de patterns problématiques. Quand il est actif, chaque fois que tu modifies un fichier HTML/CSS, il scanne automatiquement et signale les problèmes (contrastes insuffisants, polices surutilisées, patterns bannis…).

#### `/impeccable hooks ignore-value [règle] [valeur]`
Demande au détecteur d'ignorer une valeur spécifique pour une règle. Par exemple, si tu utilises Inter intentionnellement sur une app desktop Chrome, tu peux ignorer l'alerte "police surutilisée" pour cette valeur : `/impeccable hooks ignore-value overused-font Inter`

#### `/impeccable pin [commande]`
Crée un raccourci `/[commande]` dans le projet. Par exemple `/impeccable pin critique` te permet ensuite de taper simplement `/critique` au lieu de `/impeccable critique`.

#### `/impeccable unpin [commande]`
Supprime un raccourci créé avec `pin`.

---

## Ordre recommandé pour un projet

| Étape | Commande | Quand |
|---|---|---|
| 1. Cadrage | `init` | Nouveau projet |
| 2. Planification | `shape` | Avant de coder une fonctionnalité |
| 3. Construction | `craft` | Pour construire directement |
| 4. Diagnostic | `critique` | Pour mesurer la qualité |
| 5. Corrections ciblées | `typeset`, `layout`, `colorize`… | Selon les problèmes identifiés |
| 6. Vérification technique | `audit` | Avant mise en production |
| 7. Finition | `polish` | Dernier regard avant déploiement |

---

## Ce que /impeccable ne fait pas

- Il ne touche pas à la logique métier (base de données, API, authentification)
- Il ne déploie pas
- Il ne génère pas de tests
- Il ne gère pas les migrations de données

Son périmètre est exclusivement **l'interface utilisateur** : HTML, CSS, JavaScript côté présentation.

---

*Document généré le 25 juin 2026 — Projet Heures Hebdo*
