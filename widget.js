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
// Affiche l'heure d'arrivée du lendemain matin.
// Couleur : vert si semaine ok, bleu si +30min bonus, rouge si déficit.
// Se rafraîchit une fois par jour ouvré après 19h15.
// Vendredi soir → affiche l'heure du lundi (semaine type).
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

// Retourne la couleur du texte selon le delta de la semaine
// Couleurs dark-mode (fond sombre) : vert clair, rouge clair, bleu clair
function deltaColor(weekData) {
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
  if (!hasSomeData) return new Color('#FFFFFF');
  const delta = total - objective;
  if (delta >= 30)  return new Color('#60A5FA'); // bleu  : +30min bonus
  if (delta >= 0)   return new Color('#4ADE80'); // vert  : objectif atteint
  return new Color('#F87171');                    // rouge : déficit
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

function tomorrowInfo() {
  const today = new Date().getDay();
  if (today === 5) return { name: 'lundi', useTemplate: true };
  return { name: DAY_NAMES[today], useTemplate: false };
}

function nextRefreshDate() {
  const today     = new Date().getDay();
  const daysAhead = today === 5 ? 3 : 1;
  const next      = new Date();
  next.setDate(next.getDate() + daysAhead);
  next.setHours(19, 15, 0, 0);
  return next;
}

async function fetchJSON(path) {
  const req = new Request(`${SUPABASE_URL}/rest/v1/${path}`);
  req.headers = {
    'apikey'        : ANON_KEY,
    'Authorization' : `Bearer ${ANON_KEY}`,
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
    const { name: dayName, useTemplate }  = tomorrowInfo();

    let time = null;
    if (!useTemplate) time = weekData[dayName]?.a1 || null;
    if (!time)        time = template[dayName]?.a1  || null;

    const color = deltaColor(weekData);

    w.addSpacer();
    const txt = w.addText(time || '—');
    txt.font               = Font.boldSystemFont(36);
    txt.textColor          = time ? color : new Color('#A09E98');
    txt.minimumScaleFactor = 0.6;
    txt.centerAlignText();
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
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}
Script.complete();
