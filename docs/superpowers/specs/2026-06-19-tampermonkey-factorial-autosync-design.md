# Design — Tampermonkey auto-sync Factorial → Heures Hebdo

**Date :** 2026-06-19  
**Statut :** Approuvé  
**Auteur :** Paul Bindler + Claude

---

## Contexte

Paul utilise deux outils en parallèle :
- **Factorial HR** (`app.factorialhr.com`) pour pointer/dépointer chaque jour
- **Heures Hebdo** (`heures-hebdo.vercel.app/paulb`) pour suivre ses heures semaine par semaine

Un bookmarklet existant (`bookmarklet.js`) synchronise manuellement les pointages Factorial vers Supabase. Il fonctionne techniquement mais exige un clic manuel après chaque pointage. L'objectif est de supprimer ce geste.

**Contraintes :**
- Paul est simple employé dans Factorial (pas d'accès admin → pas de webhooks Factorial natifs)
- Il pointe uniquement sur Chrome, sur son PC du boulot, 07h–19h lun–ven
- Tampermonkey est déjà installé et autorisé sur ce Chrome

---

## Solution retenue : Tampermonkey userscript avec interception fetch

### Principe

Un userscript Tampermonkey s'exécute automatiquement sur `app.factorialhr.com`. Il remplace `window.fetch` par une version instrumentée. Quand Factorial appelle son API GraphQL pour enregistrer un pointage (`clockIn` ou `clockOut`), l'intercepteur détecte cet appel, laisse Factorial opérer normalement, puis déclenche la sync vers Supabase en arrière-plan.

### Pourquoi l'interception fetch

Surveiller le DOM (boutons, classes CSS) est fragile : Factorial peut redéployer à tout moment et casser la détection. L'appel GraphQL est l'acte fondateur du pointage — il ne peut pas disparaître sans casser Factorial lui-même. C'est la cible la plus stable.

---

## Architecture

```
[Utilisateur clique "Pointer" dans Factorial]
        ↓
[Factorial JS appelle POST api.factorialhr.com/graphql]
        ↓
[Intercepteur window.fetch détecte mutation clockIn/clockOut]
        ↓
[Laisse passer la requête → attend réponse HTTP 200]
        ↓
[Appel GraphQL shifts semaine courante (même logique bookmarklet)]
        ↓
[Fetch données existantes Supabase (préserve ferie/extras)]
        ↓
[Merge + upsert dans table weeks (slug=paulb, week_key=YYYY-MM-DD)]
        ↓
[Toast discret 2s : "✓ Heures Hebdo synchronisé"]
```

---

## Détail d'implémentation

### Détection de l'action de pointage

L'intercepteur analyse le corps de chaque requête POST vers `api.factorialhr.com/graphql`. Il recherche les mots-clés `clockIn` ou `clockOut` dans la chaîne JSON. Si détecté et que la réponse est un succès (HTTP 2xx), il déclenche la sync.

```js
// Pseudo-code de l'intercepteur
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const result = await originalFetch.apply(this, args);
  if (isClockMutation(args)) {
    if (result.ok) syncToSupabase(); // fire-and-forget
  }
  return result;
};
```

### Logique métier (réutilisée depuis bookmarklet.js)

- Récupération des shifts de la semaine via GraphQL Factorial (avec `credentials: 'include'`)
- Mapping shifts → `{ a1, d1, a2, d2 }` par jour
- Fetch des données existantes Supabase pour préserver les jours fériés et extras
- Upsert dans `weeks` avec clé composite `(slug, week_key)`

### Slug

Stocké dans `localStorage` de `app.factorialhr.com` sous la clé `hh_slug`. S'il n'existe pas, le script demande le slug une seule fois via `prompt` au premier pointage, puis le mémorise.

### Notifications

- **Succès :** toast discret en bas à droite, fond vert très léger, texte "✓ Heures Hebdo synchronisé", disparaît après 2 secondes
- **Erreur :** toast rouge, message d'erreur concis, reste 5 secondes

### Metadata Tampermonkey

```js
// @name         Heures Hebdo — Auto-sync Factorial
// @match        https://app.factorialhr.com/*
// @grant        none
// @run-at       document-idle
```

`@grant none` suffit car le script tourne dans le contexte de la page Factorial — il hérite des cookies de session et peut appeler l'API Supabase directement.

---

## Ce qui ne change pas

- Le schéma Supabase (`weeks` avec PK composite `(slug, week_key)`)
- La logique de mapping shifts (bug Factorial sur les timestamps → on utilise `referenceDate`)
- L'app Heures Hebdo (`app.html`) — aucune modification

---

## Fichier produit

Un seul fichier : `tampermonkey-factorial-autosync.js` à la racine du repo. L'utilisateur le copie-colle dans Tampermonkey. Pas de build, pas de dépendances.

---

## Hors scope

- Sync depuis iPhone ou autre appareil (Paul pointe uniquement sur Chrome PC)
- Déploiement pour les collègues (usage solo pour l'instant)
- Gestion des semaines passées (sync uniquement la semaine courante au moment du pointage)
