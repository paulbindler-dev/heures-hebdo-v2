# Tampermonkey Auto-sync Factorial → Heures Hebdo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un userscript Tampermonkey qui synchronise automatiquement les pointages Factorial vers Supabase (Heures Hebdo) à chaque clockIn/clockOut, sans aucun geste manuel.

**Architecture:** Un seul fichier JS installé dans Tampermonkey sur `app.factorialhr.com`. Il intercepte `window.fetch` pour détecter les mutations GraphQL de pointage, puis réutilise la logique éprouvée du `bookmarklet.js` existant pour récupérer les shifts et faire l'upsert dans Supabase. Un toast discret confirme la sync.

**Tech Stack:** JavaScript pur (ES2020), Tampermonkey API (@grant none), Supabase REST API, Factorial GraphQL API.

## Global Constraints

- `@grant none` — le script s'exécute dans le contexte de la page Factorial, hérite des cookies de session
- `@match https://app.factorialhr.com/*` — s'active sur toutes les pages Factorial
- Supabase URL : `https://hmznrhoxeptkmstyavbc.supabase.co`
- Supabase anon key : `sb_publishable_pWEsnpJBGmTpF-3HSqpSxg_fufOVNrF`
- Employee ID Factorial : `2275641`
- Slug stocké dans `localStorage` de `app.factorialhr.com` sous la clé `hh_slug`
- Aucun framework, aucun build step, aucune dépendance externe
- Fichier produit : `tampermonkey-factorial-autosync.js` à la racine du repo
- Pas de TDD automatisé possible (script navigateur sans runner) — chaque tâche se termine par une vérification manuelle ciblée

---

## Fichiers

| Action | Chemin | Rôle |
|--------|--------|------|
| Créer | `tampermonkey-factorial-autosync.js` | Script complet à copier dans Tampermonkey |
| Lire (référence) | `bookmarklet.js` | Source de la logique sync à réutiliser |

---

### Task 1 : Scaffold + constantes + gestion du slug

**Files:**
- Create: `tampermonkey-factorial-autosync.js`

**Interfaces:**
- Produces: fonction `getSlug()` → `string | null`

- [ ] **Étape 1 : Créer le fichier avec le header Tampermonkey et les constantes**

Contenu complet de `tampermonkey-factorial-autosync.js` :

```javascript
// ==UserScript==
// @name         Heures Hebdo — Auto-sync Factorial
// @namespace    https://heures-hebdo.vercel.app
// @version      1.0
// @description  Sync automatique des pointages Factorial vers Heures Hebdo
// @author       Paul Bindler
// @match        https://app.factorialhr.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const SUPABASE_URL = 'https://hmznrhoxeptkmstyavbc.supabase.co';
  const ANON_KEY     = 'sb_publishable_pWEsnpJBGmTpF-3HSqpSxg_fufOVNrF';
  const EMP_ID       = '2275641';
  const DAYS         = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

  function getSlug() {
    let slug = localStorage.getItem('hh_slug');
    if (!slug) {
      slug = prompt('Heures Hebdo — Identifiant ? (ex: paulb)');
      if (!slug) return null;
      localStorage.setItem('hh_slug', slug.trim());
    }
    return slug.trim();
  }

})();
```

- [ ] **Étape 2 : Vérification manuelle**

1. Ouvrir Tampermonkey → "Créer un nouveau script"
2. Coller le contenu du fichier, sauvegarder (Ctrl+S)
3. Naviguer sur `https://app.factorialhr.com`
4. Ouvrir la console DevTools (F12 → Console)
5. Taper : `localStorage.getItem('hh_slug')`
6. Résultat attendu : `null` (ou ton slug si déjà défini depuis le bookmarklet)
7. Le script ne doit produire aucune erreur dans la console

- [ ] **Étape 3 : Commit**

```bash
git add tampermonkey-factorial-autosync.js
git commit -m "Tampermonkey : scaffold + constantes + gestion slug"
```

---

### Task 2 : Toast de notification

**Files:**
- Modify: `tampermonkey-factorial-autosync.js`

**Interfaces:**
- Consumes: DOM (`document.body`)
- Produces: fonction `showToast(message: string, isError?: boolean) → void`

- [ ] **Étape 1 : Ajouter la fonction `showToast` après `getSlug`**

Insérer ce bloc juste avant la ligne `})();` finale :

```javascript
  function showToast(message, isError = false) {
    const existing = document.getElementById('hh-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'hh-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position:        'fixed',
      bottom:          '20px',
      right:           '20px',
      padding:         '10px 16px',
      borderRadius:    '8px',
      backgroundColor: isError ? '#fee2e2' : '#dcfce7',
      color:           isError ? '#991b1b' : '#166534',
      fontSize:        '13px',
      fontFamily:      'system-ui, sans-serif',
      boxShadow:       '0 2px 8px rgba(0,0,0,0.15)',
      zIndex:          '999999',
      opacity:         '1',
      transition:      'opacity 0.3s',
    });
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, isError ? 5000 : 2000);
  }
```

- [ ] **Étape 2 : Vérification manuelle**

1. Sauvegarder le script dans Tampermonkey (Ctrl+S)
2. Recharger `app.factorialhr.com`
3. Dans la console DevTools, taper :
   ```javascript
   // Simuler un toast succès
   document.dispatchEvent(new CustomEvent('hh-test-toast'));
   ```
   Non, plus simple — appeler directement depuis la console :
   ```javascript
   // Le script est dans le contexte de la page, tester via la console
   // Chercher la div hh-toast après l'avoir injecté manuellement :
   const t = document.createElement('div');
   t.id='hh-toast'; t.textContent='✓ Test'; t.style.cssText='position:fixed;bottom:20px;right:20px;padding:10px 16px;border-radius:8px;background:#dcfce7;color:#166534;font-size:13px;z-index:999999';
   document.body.appendChild(t);
   ```
4. Résultat attendu : toast vert visible en bas à droite pendant 2 secondes

- [ ] **Étape 3 : Commit**

```bash
git add tampermonkey-factorial-autosync.js
git commit -m "Tampermonkey : fonction toast succès/erreur"
```

---

### Task 3 : Logique de synchronisation (portée depuis bookmarklet.js)

**Files:**
- Modify: `tampermonkey-factorial-autosync.js`
- Reference (lecture seule): `bookmarklet.js`

**Interfaces:**
- Consumes: `getSlug()`, `showToast()`, constantes globales
- Produces: fonction `syncToSupabase() → Promise<void>`

- [ ] **Étape 1 : Ajouter la fonction `syncToSupabase` après `showToast`**

```javascript
  async function syncToSupabase() {
    const slug = getSlug();
    if (!slug) return;

    // Lundi de la semaine courante
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow + (dow === 0 ? -6 : 1));
    mon.setHours(0, 0, 0, 0);
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    const pad = n => String(n).padStart(2, '0');
    const weekKey = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;

    // Année/mois depuis l'URL Factorial (ex: /attendance/clock-in/daily/2026/6/19)
    const um = location.pathname.match(/\/(\d{4})\/(\d+)\//);
    const yr = um ? +um[1] : mon.getFullYear();
    const mo = um ? +um[2] : mon.getMonth() + 1;

    // 1. Récupérer les shifts Factorial pour le mois
    let shifts;
    try {
      const r = await fetch('https://api.factorialhr.com/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            attendance {
              employee(employeeId:"${EMP_ID}") {
                attendanceShiftsConnection(year:${yr},month:${mo}) {
                  nodes { clockIn clockOut referenceDate workable }
                }
              }
            }
          }`
        })
      });
      const j = await r.json();
      shifts = j?.data?.attendance?.employee?.attendanceShiftsConnection?.nodes;
      if (!shifts) throw new Error(JSON.stringify(j));
    } catch (e) {
      showToast('Heures Hebdo — Erreur Factorial : ' + e.message, true);
      return;
    }

    // 2. Filtrer sur la semaine courante, regrouper par jour
    const hhmm = iso => iso ? iso.substring(11, 16) : '';
    const byDay = {};
    shifts.forEach(s => {
      if (!s.workable || !s.referenceDate) return;
      const d = new Date(s.referenceDate + 'T12:00:00');
      if (d < mon || d > fri) return;
      const idx = d.getDay() - 1;
      if (idx < 0 || idx > 4) return;
      const name = DAYS[idx];
      (byDay[name] = byDay[name] || []).push(s);
    });

    // 3. Récupérer les données existantes Supabase (préserver fériés, extras)
    let existing = {};
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?slug=eq.${encodeURIComponent(slug)}&week_key=eq.${weekKey}&select=data`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY } }
      );
      existing = (await r.json())[0]?.data || {};
    } catch (_) { }

    // 4. Fusionner (shifts Factorial → a1/d1/a2/d2, reste préservé)
    const merged = { ...existing };
    for (const [name, ss] of Object.entries(byDay)) {
      ss.sort((a, b) => a.clockIn.localeCompare(b.clockIn));
      const [s1, s2] = ss;
      merged[name] = {
        ...(merged[name] || {}),
        a1: hhmm(s1?.clockIn),
        d1: hhmm(s1?.clockOut),
        a2: hhmm(s2?.clockIn) || '',
        d2: hhmm(s2?.clockOut) || '',
      };
    }

    // 5. Upsert dans Supabase
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?on_conflict=slug,week_key`,
        {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': 'Bearer ' + ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ slug, week_key: weekKey, data: merged })
        }
      );
      if (!r.ok) throw new Error(await r.text());
      showToast('✓ Heures Hebdo synchronisé');
    } catch (e) {
      showToast('Heures Hebdo — Erreur Supabase : ' + e.message, true);
    }
  }
```

- [ ] **Étape 2 : Vérification manuelle — appel direct**

1. Sauvegarder le script dans Tampermonkey
2. Recharger `app.factorialhr.com`
3. Dans la console DevTools, appeler manuellement la sync :
   ```javascript
   // Le script s'exécute dans un IIFE — accès indirect via une variable globale temporaire.
   // Pour tester, ajouter temporairement window._hhSync = syncToSupabase; juste avant })();
   // Puis dans la console : window._hhSync()
   ```
4. Résultat attendu :
   - Toast vert "✓ Heures Hebdo synchronisé" si des shifts existent cette semaine
   - Ou toast rouge avec message d'erreur précis si problème
5. Vérifier dans Supabase (Table Editor → `weeks`, filtrer sur `slug = paulb`) que les données sont à jour

> **Note :** Ajouter `window._hhSync = syncToSupabase;` TEMPORAIREMENT avant `})();` pour ce test, le retirer avant le commit final de la tâche 4.

- [ ] **Étape 3 : Commit (sans `window._hhSync`)**

```bash
git add tampermonkey-factorial-autosync.js
git commit -m "Tampermonkey : logique syncToSupabase (portée depuis bookmarklet)"
```

---

### Task 4 : Intercepteur fetch + assemblage final

**Files:**
- Modify: `tampermonkey-factorial-autosync.js`

**Interfaces:**
- Consumes: `syncToSupabase()`, `window.fetch` (global navigateur)
- Produces: script complet et fonctionnel

- [ ] **Étape 1 : Ajouter l'intercepteur fetch après `syncToSupabase`, avant `})();`**

```javascript
  // --- Intercepteur fetch ---
  // Remplace window.fetch pour détecter les mutations de pointage Factorial
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const body = typeof args[1]?.body === 'string' ? args[1].body : '';

      const isClockMutation =
        url.includes('api.factorialhr.com/graphql') &&
        (body.includes('clockIn') || body.includes('clockOut'));

      if (isClockMutation && response.ok) {
        // Cloner la réponse avant de la lire (un body ne peut être consommé qu'une fois)
        response.clone().json().then(json => {
          if (json?.data && !json?.errors) {
            syncToSupabase();
          }
        }).catch(() => {
          // En cas de réponse non-JSON, déclencher quand même
          syncToSupabase();
        });
      }
    } catch (_) {
      // Ne jamais bloquer la requête originale
    }

    return response;
  };
```

- [ ] **Étape 2 : Vérifier l'état final complet du fichier**

Le fichier `tampermonkey-factorial-autosync.js` doit contenir dans cet ordre :
1. Header `==UserScript==` … `==/UserScript==`
2. IIFE `(function () { 'use strict';`
3. Constantes (`SUPABASE_URL`, `ANON_KEY`, `EMP_ID`, `DAYS`)
4. `function getSlug()`
5. `function showToast()`
6. `async function syncToSupabase()`
7. Intercepteur `window.fetch`
8. `})();`

Vérifier qu'il n'y a **pas** de `window._hhSync` résiduel du test Task 3.

- [ ] **Étape 3 : Installer la version finale dans Tampermonkey**

1. Ouvrir Tampermonkey → icône → Tableau de bord
2. Éditer le script existant (ou en créer un nouveau en supprimant l'ancien)
3. Remplacer entièrement le contenu par le fichier `tampermonkey-factorial-autosync.js`
4. Sauvegarder (Ctrl+S)
5. Vérifier que le script apparaît comme "Activé" dans le tableau de bord Tampermonkey

- [ ] **Étape 4 : Test end-to-end réel**

1. Naviguer sur `https://app.factorialhr.com/attendance/clock-in` (ou équivalent)
2. Ouvrir la console DevTools (F12) — onglet Network, filtrer sur `graphql`
3. Cliquer "Pointer" (ou "Dépointer")
4. Dans Network : observer la requête GraphQL de Factorial
5. Immédiatement après : observer une **deuxième** requête GraphQL vers `api.factorialhr.com/graphql` (celle de notre script qui récupère les shifts)
6. Puis observer une requête POST vers `hmznrhoxeptkmstyavbc.supabase.co/rest/v1/weeks`
7. Toast vert "✓ Heures Hebdo synchronisé" visible en bas à droite
8. Vérifier dans Heures Hebdo (`heures-hebdo.vercel.app/paulb`) que l'heure du jour est bien mise à jour

**En cas d'échec :** vérifier la console (onglet Console) pour les messages d'erreur du toast ou d'éventuelles exceptions JS.

- [ ] **Étape 5 : Commit final**

```bash
git add tampermonkey-factorial-autosync.js
git commit -m "Tampermonkey : intercepteur fetch + script complet et fonctionnel"
```

---

## Contenu final attendu de `tampermonkey-factorial-autosync.js`

Pour référence, le fichier complet assemblé :

```javascript
// ==UserScript==
// @name         Heures Hebdo — Auto-sync Factorial
// @namespace    https://heures-hebdo.vercel.app
// @version      1.0
// @description  Sync automatique des pointages Factorial vers Heures Hebdo
// @author       Paul Bindler
// @match        https://app.factorialhr.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const SUPABASE_URL = 'https://hmznrhoxeptkmstyavbc.supabase.co';
  const ANON_KEY     = 'sb_publishable_pWEsnpJBGmTpF-3HSqpSxg_fufOVNrF';
  const EMP_ID       = '2275641';
  const DAYS         = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

  function getSlug() {
    let slug = localStorage.getItem('hh_slug');
    if (!slug) {
      slug = prompt('Heures Hebdo — Identifiant ? (ex: paulb)');
      if (!slug) return null;
      localStorage.setItem('hh_slug', slug.trim());
    }
    return slug.trim();
  }

  function showToast(message, isError = false) {
    const existing = document.getElementById('hh-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'hh-toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position:        'fixed',
      bottom:          '20px',
      right:           '20px',
      padding:         '10px 16px',
      borderRadius:    '8px',
      backgroundColor: isError ? '#fee2e2' : '#dcfce7',
      color:           isError ? '#991b1b' : '#166534',
      fontSize:        '13px',
      fontFamily:      'system-ui, sans-serif',
      boxShadow:       '0 2px 8px rgba(0,0,0,0.15)',
      zIndex:          '999999',
      opacity:         '1',
      transition:      'opacity 0.3s',
    });
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, isError ? 5000 : 2000);
  }

  async function syncToSupabase() {
    const slug = getSlug();
    if (!slug) return;

    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow + (dow === 0 ? -6 : 1));
    mon.setHours(0, 0, 0, 0);
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    const pad = n => String(n).padStart(2, '0');
    const weekKey = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;

    const um = location.pathname.match(/\/(\d{4})\/(\d+)\//);
    const yr = um ? +um[1] : mon.getFullYear();
    const mo = um ? +um[2] : mon.getMonth() + 1;

    let shifts;
    try {
      const r = await fetch('https://api.factorialhr.com/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            attendance {
              employee(employeeId:"${EMP_ID}") {
                attendanceShiftsConnection(year:${yr},month:${mo}) {
                  nodes { clockIn clockOut referenceDate workable }
                }
              }
            }
          }`
        })
      });
      const j = await r.json();
      shifts = j?.data?.attendance?.employee?.attendanceShiftsConnection?.nodes;
      if (!shifts) throw new Error(JSON.stringify(j));
    } catch (e) {
      showToast('Heures Hebdo — Erreur Factorial : ' + e.message, true);
      return;
    }

    const hhmm = iso => iso ? iso.substring(11, 16) : '';
    const byDay = {};
    shifts.forEach(s => {
      if (!s.workable || !s.referenceDate) return;
      const d = new Date(s.referenceDate + 'T12:00:00');
      if (d < mon || d > fri) return;
      const idx = d.getDay() - 1;
      if (idx < 0 || idx > 4) return;
      const name = DAYS[idx];
      (byDay[name] = byDay[name] || []).push(s);
    });

    let existing = {};
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?slug=eq.${encodeURIComponent(slug)}&week_key=eq.${weekKey}&select=data`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY } }
      );
      existing = (await r.json())[0]?.data || {};
    } catch (_) { }

    const merged = { ...existing };
    for (const [name, ss] of Object.entries(byDay)) {
      ss.sort((a, b) => a.clockIn.localeCompare(b.clockIn));
      const [s1, s2] = ss;
      merged[name] = {
        ...(merged[name] || {}),
        a1: hhmm(s1?.clockIn),
        d1: hhmm(s1?.clockOut),
        a2: hhmm(s2?.clockIn) || '',
        d2: hhmm(s2?.clockOut) || '',
      };
    }

    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?on_conflict=slug,week_key`,
        {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': 'Bearer ' + ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ slug, week_key: weekKey, data: merged })
        }
      );
      if (!r.ok) throw new Error(await r.text());
      showToast('✓ Heures Hebdo synchronisé');
    } catch (e) {
      showToast('Heures Hebdo — Erreur Supabase : ' + e.message, true);
    }
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      const body = typeof args[1]?.body === 'string' ? args[1].body : '';

      const isClockMutation =
        url.includes('api.factorialhr.com/graphql') &&
        (body.includes('clockIn') || body.includes('clockOut'));

      if (isClockMutation && response.ok) {
        response.clone().json().then(json => {
          if (json?.data && !json?.errors) {
            syncToSupabase();
          }
        }).catch(() => {
          syncToSupabase();
        });
      }
    } catch (_) { }

    return response;
  };

})();
```
