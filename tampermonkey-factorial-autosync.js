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
    // Note : bug Factorial — les timestamps clockIn/clockOut ont toujours la date d'aujourd'hui.
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

    // 3. Récupérer les données existantes Supabase (préserver fériés, extras)
    let existing = {};
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/weeks?slug=eq.${encodeURIComponent(slug)}&week_key=eq.${weekKey}&select=data`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY } }
      );
      existing = (await r.json())[0]?.data || {};
    } catch (_) { }

    // 4. Fusionner : shifts Factorial écrasent a1/d1/a2/d2, le reste est préservé
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

    // 5. Upsert dans Supabase (PK composite slug + week_key)
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

})();
