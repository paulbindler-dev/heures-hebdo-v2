// Heures Hebdo — Widget iOS
// App : Scriptable (gratuite, App Store)
// ─────────────────────────────────────────────────────────────────
// INSTALLATION :
//   1. Copier ce script dans Scriptable
//   2. Ajouter un widget Scriptable sur l'écran d'accueil (taille Small)
//   3. Long press → Modifier le widget → Paramètre → entrer ton identifiant
//      ex : "paul-67"
//   4. Taper sur le widget ouvre l'app dans Safari
// ─────────────────────────────────────────────────────────────────
// Logique d'affichage selon l'heure :
//   19h–23h59 → heure d'arrivée demain matin (a1)
//   00h–11h59 → heure d'arrivée ce matin (a1)
//   12h–18h59 → heure de retour déjeuner aujourd'hui (a2)
// Couleur : vert si semaine ok, bleu si +30min bonus, rouge si déficit.
// ─────────────────────────────────────────────────────────────────

// ── Config ───────────────────────────────────────────────────────
const SUPABASE_URL = 'https://hmznrhoxeptkmstyavbc.supabase.co';
// Couleur de fond (#111110) — remplacer par la couleur signature quand elle sera choisie
const BG_COLOR    = '#111110';
const ANON_KEY    = 'sb_publishable_pWEsnpJBGmTpF-3HSqpSxg_fufOVNrF';
const APP_URL     = 'https://heures-hebdo.vercel.app';
const SLUG        = args.widgetParameter || null;

// ── Calcul delta semaine ─────────────────────────────────────────
// Même logique que l'app (parse, calcDay, objectif)

const DAY_NAMES   = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
const DAY_TARGET  = [480, 480, 480, 480, 180]; // minutes (lun-jeu=8h, ven=3h)

function parseTime(v) {
  if (!v || !v.trim()) return null;
  v = v.trim().replace(',', ':');
  let h, m;
  if (v.includes(':')) [h, m] = v.split(':').map(Number);
  else if (v.length <= 2) { h = +v; m = 0; }
  else if (v.length === 3) { h = +v[0]; m = +v.slice(1); }
  else { h = +v.slice(0, 2); m = +v.slice(2); }
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59 || h < 0 || m < 0) return null;
  return h * 60 + m;
}

function calcDay(day) {
  if (!day || day.ferie) return null;
  const a1 = parseTime(day.a1), d1 = parseTime(day.d1);
  const a2 = parseTime(day.a2), d2 = parseTime(day.d2);
  if (a1 === null) return null;
  let total = null;
  if (d2 !== null) {
    total = (d1 !== null && a2 !== null) ? (d1 - a1) + (d2 - a2) : d2 - a1;
  } else if (d1 !== null) {
    total = d1 - a1;
  }
  if (total === null) return null;
  (day.extras || []).forEach(ex => {
    const ea = parseTime(ex.a), ed = parseTime(ex.d);
    if (ea !== null && ed !== null && ed > ea) total += ed - ea;
  });
  return total;
}

// Calcule delta + couleurs pour la semaine
function weekStats(weekData) {
  let objective = 35 * 60;
  let total = 0;
  let hasSomeData = false;
  DAY_NAMES.forEach((day, i) => {
    const d = weekData[day];
    if (!d) return;
    if (d.ferie) { objective -= DAY_TARGET[i]; return; }
    const t = calcDay(d);
    if (t !== null) { total += t; hasSomeData = true; }
  });
  if (!hasSomeData) return { delta: null, color: new Color('#A09E98'), dimColor: new Color('#A09E98') };
  const delta = total - objective;
  if (delta >= 30)  return { delta, color: new Color('#60A5FA'), dimColor: new Color('#60A5FA', 0.6) };
  if (delta >= 0)   return { delta, color: new Color('#4ADE80'), dimColor: new Color('#4ADE80', 0.6) };
  return           { delta, color: new Color('#F87171'), dimColor: new Color('#F87171', 0.6) };
}

// Formate le delta en "+47 min" / "−12 min" / "+1h05"
function formatDelta(minutes) {
  if (minutes === null) return null;
  const sign = minutes >= 0 ? '+' : '−'; // signe moins typographique
  const abs  = Math.abs(minutes);
  const h    = Math.floor(abs / 60);
  const m    = abs % 60;
  if (h > 0) return `${sign}${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
  return `${sign}${m} min`;
}

// ── Helpers nav ──────────────────────────────────────────────────

function currentWeekKey() {
  const d   = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  const yy = mon.getFullYear();
  const mm = String(mon.getMonth() + 1).padStart(2, '0');
  const dd = String(mon.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function displayInfo() {
  const now  = new Date();
  const hour = now.getHours();
  const dow  = now.getDay(); // 0=dim, 1=lun … 6=sam

  if (hour >= 19) {
    // Demain matin — vendredi/sam/dim → lundi depuis la semaine type
    if (dow >= 5) return { name: 'lundi', field: 'a1', useTemplate: true };
    return { name: DAY_NAMES[dow], field: 'a1', useTemplate: false }; // DAY_NAMES[dow] = demain (lun→mar, mar→mer…)
  }

  // Ce matin ou retour déjeuner — weekend → lundi depuis la semaine type
  if (dow === 0 || dow === 6) {
    return { name: 'lundi', field: 'a1', useTemplate: true };
  }
  const field = hour >= 12 ? 'a2' : 'a1';
  return { name: DAY_NAMES[dow - 1], field, useTemplate: false }; // DAY_NAMES[dow-1] = aujourd'hui
}

function nextRefreshDate() {
  const now  = new Date();
  const hour = now.getHours();
  const dow  = now.getDay();
  const next = new Date(now);

  // Weekend : prochain refresh lundi à 00h15
  if (dow === 0 || dow === 6) {
    next.setDate(next.getDate() + (dow === 6 ? 2 : 1));
    next.setHours(0, 15, 0, 0);
    return next;
  }

  if (hour >= 19) {
    next.setDate(next.getDate() + 1); // minuit+15 le lendemain
    next.setHours(0, 15, 0, 0);
  } else if (hour >= 12) {
    next.setHours(19, 15, 0, 0);     // 19h15 aujourd'hui
  } else {
    next.setHours(12, 0, 0, 0);      // midi aujourd'hui
  }
  return next;
}

async function fetchJSON(path) {
  const req = new Request(`${SUPABASE_URL}/rest/v1/${path}`);
  req.headers = {
    'apikey'         : ANON_KEY,
    'Authorization'  : `Bearer ${ANON_KEY}`,
    'Cache-Control'  : 'no-cache',
  };
  return req.loadJSON();
}

// ── Widget ───────────────────────────────────────────────────────

async function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor  = new Color(BG_COLOR);
  w.refreshAfterDate = nextRefreshDate();
  if (SLUG) w.url = `${APP_URL}/${SLUG}`;

  if (!SLUG) {
    w.addSpacer();
    const t = w.addText('Configure\nle widget →\nlong press');
    t.textColor    = new Color('#A09E98');
    t.font         = Font.systemFont(12);
    t.centerAlignText();
    w.addSpacer();
    return w;
  }

  try {
    const [weeksRes, usersRes] = await Promise.all([
      fetchJSON(`weeks?slug=eq.${SLUG}&week_key=eq.${currentWeekKey()}&select=data`),
      fetchJSON(`users?slug=eq.${SLUG}&select=template`),
    ]);

    const weekData = weeksRes[0]?.data    || {};
    const template = usersRes[0]?.template || {};
    const { name: dayName, field, useTemplate } = displayInfo();

    let time = null;
    if (!useTemplate) time = weekData[dayName]?.[field] || null;
    if (!time)        time = template[dayName]?.[field]  || null;

    const { color, dimColor, delta } = weekStats(weekData);
    const deltaStr = formatDelta(delta);

    // Layout Option A : bloc serré centré — air en haut et en bas, pas entre les éléments
    w.addSpacer();
    const txt = w.addText(time || '—');
    txt.font               = Font.boldSystemFont(34);
    txt.textColor          = time ? color : new Color('#A09E98');
    txt.minimumScaleFactor = 0.6;
    txt.centerAlignText();
    if (deltaStr) {
      w.addSpacer(3);
      const dTxt = w.addText(deltaStr);
      dTxt.font      = Font.mediumSystemFont(13);
      dTxt.textColor = dimColor;
      dTxt.centerAlignText();
    }
    w.addSpacer();

  } catch (_) {
    w.addSpacer();
    const err = w.addText('—');
    err.font          = Font.boldSystemFont(36);
    err.textColor     = new Color('#A09E98');
    err.centerAlignText();
    w.addSpacer();
  }

  return w;
}

const widget = await buildWidget();
Script.setWidget(widget); // met à jour le widget home screen même depuis un run manuel
if (!config.runsInWidget) {
  await widget.presentSmall();
}
Script.complete();
