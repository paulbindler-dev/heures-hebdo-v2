# Heures Hebdo v2 — Contexte de migration

## Utilisateur
- **Prénom** : Paul, travaille dans une étude notariale
- **Profil** : Veut être complètement drivé — expliquer les concepts au moment où ils sont utiles
- **Design** : Très exigeant. Montre des mockups AVANT de coder. Pas de fond sombre. Pas de violet.
- **Environnement** : Souvent en vue fractionnée Chrome
- **Communication** : Direct — si ça ne marche pas, il le dit cash, il attend une solution immédiate

## Contexte
App timesheet HTML autonome (localStorage) déployée sur Netlify, utilisée par ~20 collaborateurs.
Problème : pas de synchronisation multi-appareils (Mac, PC boulot, iPhone).

## Fonctionnalités actuelles (à conserver intactes)
- Tableau hebdomadaire : Arrivée matin / Départ midi / Pause auto / Arrivée après-midi / Départ soir
- Semaine type configurable jour par jour
- Jours fériés (bouton F par jour, recalcul objectif 35h)
- Copier/coller multi-jours
- Sessions supplémentaires rares (+)
- Menu contextuel ⋯ par jour (copier, férié, ajouter session, effacer)
- Stats : Total semaine vs objectif (vert/rouge) + Delta (bleu si +30min)
- Calcul intelligent : matin seul = total matin
- Vendredi objectif 3h (lundi-jeudi 8h)
- Plages picker adaptées par jour et par champ

## Règle absolue
**Ne rien changer au design ni aux fonctionnalités sans demande explicite.**
Migrer, pas améliorer.

## Objectif de la migration
Vercel + Supabase — chaque utilisateur a ses données synchronisées sur tous ses appareils, sans login.

## Système d'URL secrète
- Première visite → écran de bienvenue, l'utilisateur choisit un slug unique (ex: `paul-notaire-67`)
- L'app vérifie la disponibilité du slug
- L'URL `heures-hebdo.vercel.app/paul-notaire-67` = son espace personnel, synchronisé partout
- Sécurité par obscurité — suffisant pour usage pro entre collègues
- Zéro friction, même expérience qu'un fichier bookmarqué

## Stack cible
- **Vercel** — hébergement statique (remplace Netlify)
- **Supabase** — PostgreSQL + API REST (remplace localStorage)
- **HTML/CSS/JS pur** — pas de framework

## Plan de migration — TERMINÉ ✓
1. ✅ Projet Supabase créé — tables `users` + `weeks`
2. ✅ Écran de bienvenue (`index.html`) — choix du slug, validation format
3. ✅ App migrée (`app.html`) — localStorage → Supabase async
4. ✅ Déployé sur Vercel — `heures-hebdo.vercel.app`
5. ✅ Testé multi-appareils — synchronisation confirmée

## Schéma Supabase (à affiner après analyse du HTML)
```sql
create table timesheets (
  slug text primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## V2.1 — Scope validé

### Fonctionnalités app
- Vrai check slug disponible en temps réel (requête Supabase depuis index.html)
- Navigation Tab entre les champs du tableau
- Jours fériés France automatiques
- Clic sur un champ → sélectionne tout le contenu
- Responsive mobile soigné

### Écran post-création (index.html)
- Après validation du slug : écran "Épingle cette URL"
- URL personnelle bien visible + bouton copier
- Instructions : ajouter en favori + "Ajouter à l'écran d'accueil" iPhone

## Post-V2.1
- **Vue mobile jour par jour** : sur petit écran, afficher un seul jour à la fois avec flèches gauche/droite. Plus élégant, plus de travail — à designer ensemble avant de coder.
- **Widget iOS** : afficher l'heure d'arrivée prévue le lendemain depuis Supabase. Paul très intéressé. Nécessite Scriptable ou une app native — chantier séparé.
- **Couper Netlify** quand tous les collègues sont migrés sur la V2.

## Règles de session
- Montrer le plan complet AVANT de commencer à coder
- Valider avec Paul avant chaque étape
- Ne pas tout faire dans le chat — travailler dans Claude Code
- **Auto-accept** : toujours accepter les modifications de fichiers et les commandes shell sans demander de confirmation
- **Commits automatiques** : après chaque modification significative, créer un commit git avec un message descriptif en français

## Stack en prod
- **Vercel** : `heures-hebdo.vercel.app` — repo GitHub `heures-hebdo-v2`
- **Supabase** : projet `hmznrhoxeptkmstyavbc` — tables `users` (slug PK, template jsonb) + `weeks` (slug+week_key PK composite, data jsonb)
- **Fichiers** : `index.html` (welcome), `app.html` (app), `vercel.json` (routing)

## Points techniques à retenir
- La table `weeks` utilise `(slug, week_key)` comme clé primaire composite — sans ça, `upsert` échouait silencieusement
- Le rôle `anon` Supabase nécessite un `GRANT ALL` explicite sur les tables créées via SQL Editor
- `saveWeek` est async fire-and-forget — les erreurs s'affichent en toast
- Le slug est lu depuis `window.location.pathname` dans `app.html`

## À faire (V2.1)
- Vrai check disponibilité du slug sur l'écran de bienvenue (requête Supabase)
- Navigation Tab fonctionnelle
- Jours fériés France automatiques
- Clic sur un champ → sélectionne tout le contenu
