// Bookmarklet Factorial → Heures Hebdo
// Coller l'intégralité de ce fichier comme URL d'un favori Chrome (remplacer les sauts de ligne)
// Usage : cliquer sur le favori depuis app.factorialhr.com/attendance/...
//
// Première fois : demande ton slug Heures Hebdo (ex: paul-67), le mémorise.
// Ensuite : synchronise automatiquement la semaine courante (shifts → a1/d1/a2/d2).
//
// Note technique : les clockIn/clockOut ont une date erronée (toujours aujourd'hui)
// dans le timestamp ISO — bug Factorial. On utilise referenceDate pour la date réelle
// et on extrait seulement le HH:MM du clockIn/clockOut (heures locales Paris).

javascript:(async function(){
  const SUPABASE_URL = 'https://hmznrhoxeptkmstyavbc.supabase.co';
  const ANON_KEY     = 'sb_publishable_pWEsnpJBGmTpF-3HSqpSxg_fufOVNrF';
  const EMP_ID       = '2275641';
  const DAYS         = ['lundi','mardi','mercredi','jeudi','vendredi'];

  // Slug mémorisé dans localStorage de Factorial
  let slug = localStorage.getItem('hh_slug');
  if (!slug) {
    slug = prompt('Identifiant Heures Hebdo ? (ex: paul-67)');
    if (!slug) return;
    localStorage.setItem('hh_slug', slug = slug.trim());
  }

  // Lundi de la semaine courante
  const now = new Date();
  const dow = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow + (dow === 0 ? -6 : 1));
  mon.setHours(0,0,0,0);
  const fri = new Date(mon); fri.setDate(mon.getDate()+4);
  const pad = n => String(n).padStart(2,'0');
  const weekKey = `${mon.getFullYear()}-${pad(mon.getMonth()+1)}-${pad(mon.getDate())}`;

  // Année/mois depuis l'URL /attendance/clock-in/daily/YYYY/M/D
  const um = location.pathname.match(/\/(\d{4})\/(\d+)\//);
  const yr = um ? +um[1] : mon.getFullYear();
  const mo = um ? +um[2] : mon.getMonth()+1;

  // 1. Shifts Factorial
  let shifts;
  try {
    const r = await fetch('https://api.factorialhr.com/graphql', {
      method: 'POST', credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ query: `{
        attendance {
          employee(employeeId:"${EMP_ID}") {
            attendanceShiftsConnection(year:${yr},month:${mo}) {
              nodes { clockIn clockOut referenceDate workable }
            }
          }
        }
      }` })
    });
    const j = await r.json();
    shifts = j?.data?.attendance?.employee?.attendanceShiftsConnection?.nodes;
    if (!shifts) throw new Error(JSON.stringify(j));
  } catch(e) { alert('Erreur Factorial : '+e.message); return; }

  // 2. Filtrer sur la semaine + regrouper par jour
  const hhmm = iso => iso ? iso.substring(11,16) : '';
  const byDay = {};
  shifts.forEach(s => {
    if (!s.workable || !s.referenceDate) return;
    const d = new Date(s.referenceDate+'T12:00:00');
    if (d < mon || d > fri) return;
    const idx = d.getDay()-1;
    if (idx < 0 || idx > 4) return;
    const name = DAYS[idx];
    (byDay[name] = byDay[name]||[]).push(s);
  });

  if (!Object.keys(byDay).length) {
    alert('Aucun pointage cette semaine ('+weekKey+')'); return;
  }

  // 3. Données existantes Supabase (pour ne pas écraser ferie, extras…)
  let existing = {};
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/weeks?slug=eq.${encodeURIComponent(slug)}&week_key=eq.${weekKey}&select=data`,
      { headers:{'apikey':ANON_KEY,'Authorization':'Bearer '+ANON_KEY} }
    );
    existing = (await r.json())[0]?.data || {};
  } catch(_){}

  // 4. Fusionner (shifts Factorial override a1/d1/a2/d2, préserve ferie/extras)
  const merged = {...existing};
  for (const [name, ss] of Object.entries(byDay)) {
    ss.sort((a,b) => a.clockIn.localeCompare(b.clockIn));
    const [s1,s2] = ss;
    merged[name] = {
      ...(merged[name]||{}),
      a1: hhmm(s1?.clockIn),  d1: hhmm(s1?.clockOut),
      a2: hhmm(s2?.clockIn)||'', d2: hhmm(s2?.clockOut)||'',
    };
  }

  // 5. Upsert Supabase
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/weeks?on_conflict=slug,week_key`,
      { method:'POST',
        headers:{'apikey':ANON_KEY,'Authorization':'Bearer '+ANON_KEY,
                 'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},
        body: JSON.stringify({slug, week_key:weekKey, data:merged}) }
    );
    if (!r.ok) throw new Error(await r.text());
    alert('✓ Synchronisé ! ('+Object.keys(byDay).join(', ')+')');
  } catch(e) { alert('Erreur Supabase : '+e.message); }
})();
