// ==UserScript==
// @name         Heures Hebdo — Auto-sync Factorial
// @namespace    https://heures-hebdo.vercel.app
// @version      2.4
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

  const log = (...args) => console.log('[factorial-sync]', ...args);

  function getSlug() {
    let slug = localStorage.getItem('heures_slug');
    if (!slug) {
      slug = prompt('Heures Hebdo — Identifiant ? (ex: paulb)');
      if (!slug) return null;
      localStorage.setItem('heures_slug', slug.trim());
    }
    return slug.trim();
  }

  function showToast(message, isError = false) {
    const existing = document.getElementById('heures-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'heures-toast';
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
    }, isError ? 5000 : 2500);
  }

  function getWeekRange() {
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow + (dow === 0 ? -6 : 1));
    mon.setHours(0, 0, 0, 0);
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { mon, fri, weekKey: fmt(mon), startOn: fmt(mon), endOn: fmt(fri) };
  }

  async function syncToSupabase() {
    const slug = getSlug();
    if (!slug) return;

    log('Sync déclenchée pour slug:', slug);

    const { mon, fri, weekKey, startOn, endOn } = getWeekRange();

    // 1. Récupérer les shifts Factorial pour la semaine
    let shifts;
    try {
      const r = await fetch('https://api.factorialhr.com/graphql?SyncShifts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'SyncShifts',
          query: `
            query SyncShifts($employeeId: Int!, $startOn: ISO8601Date!, $endOn: ISO8601Date!) {
              attendance {
                employee(id: $employeeId) {
                  attendanceShiftsConnection(startOn: $startOn, endOn: $endOn) {
                    nodes {
                      clockIn
                      clockOut
                      referenceDate
                      workable
                    }
                  }
                }
              }
            }
          `,
          variables: { employeeId: EMP_ID, startOn, endOn },
        })
      });
      const j = await r.json();
      shifts = j?.data?.attendance?.employee?.attendanceShiftsConnection?.nodes;
      if (!shifts) throw new Error(JSON.stringify(j?.errors || j));
      log('Shifts reçus de Factorial:', shifts.length, 'entrée(s)', shifts);
    } catch (e) {
      log('ERREUR Factorial:', e.message);
      showToast('Heures Hebdo — Erreur Factorial : ' + e.message, true);
      return;
    }

    // 2. Regrouper par jour de semaine
    // Note : bug Factorial — clockIn/clockOut ont toujours la date d'aujourd'hui en partie date.
    // On utilise referenceDate pour la vraie date, et on extrait seulement HH:MM des timestamps.
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
    log('Données par jour:', byDay);

    // 3. Lire les données Supabase existantes (pour préserver fériés, extras, etc.)
    let existing = {};
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?slug=eq.${encodeURIComponent(slug)}&week_key=eq.${weekKey}&select=data`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY } }
      );
      existing = (await r.json())[0]?.data || {};
      log('Données Supabase existantes:', existing);
    } catch (_) {}

    // 4. Fusionner : Factorial écrase a1/d1/a2/d2, tout le reste est préservé
    const merged = { ...existing };
    for (const [name, ss] of Object.entries(byDay)) {
      ss.sort((a, b) => (a.clockIn || '').localeCompare(b.clockIn || ''));
      const [s1, s2] = ss;
      merged[name] = {
        ...(merged[name] || {}),
        a1: hhmm(s1?.clockIn),
        d1: hhmm(s1?.clockOut),
        a2: hhmm(s2?.clockIn) || '',
        d2: hhmm(s2?.clockOut) || '',
      };
    }
    log('Données fusionnées à envoyer:', merged);

    // 5. Upsert Supabase (PK composite slug + week_key)
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?on_conflict=slug,week_key`,
        {
          method: 'POST',
          headers: {
            'apikey': ANON_KEY,
            'Authorization': 'Bearer ' + ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ slug, week_key: weekKey, data: merged }),
        }
      );
      if (!r.ok) throw new Error(await r.text());
      log('Supabase upsert OK — semaine:', weekKey);
      showToast('✓ Heures Hebdo synchronisé');
    } catch (e) {
      log('ERREUR Supabase:', e.message);
      showToast('Heures Hebdo — Erreur Supabase : ' + e.message, true);
    }
  }

  // Intercepte window.fetch et déclenche la sync sur ClockIn et ClockOut.
  // Opérations confirmées depuis F12 le 2026-06-22 : graphql?ClockOut (et graphql?ClockIn par symétrie).
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

      if (url.includes('factorialhr.com/graphql') && !url.includes('SyncShifts')) {
        log('GraphQL Factorial intercepté:', url);
      }

      const isClockMutation =
        url.includes('factorialhr.com/graphql') &&
        (url.endsWith('?ClockOut') || url.endsWith('?ClockIn'));

      if (isClockMutation && response.ok) {
        log('Pointage détecté →', url.endsWith('?ClockOut') ? 'ClockOut' : 'ClockIn', '→ lancement sync dans 1s');
        setTimeout(syncToSupabase, 1000);
      }
    } catch (_) {}

    return response;
  };

  log('Script chargé — en attente de pointage Factorial');

})();
