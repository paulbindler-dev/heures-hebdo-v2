// Heures Hebdo — Widget iOS
// App : Scriptable (gratuite, App Store)
// ─────────────────────────────────────────────────────────────────
// INSTALLATION :
//   1. Copier ce script dans Scriptable
//   2. Ajouter un widget Scriptable sur l'écran d'accueil (taille Small)
//   3. Long press → Modifier le widget → Paramètre → entrer ton slug
//      ex : "paul-notaire-67"
//   4. Taper sur le widget ouvre l'app dans Safari
// ─────────────────────────────────────────────────────────────────
// Affiche l'heure d'arrivée du lendemain matin.
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

// ── Helpers ──────────────────────────────────────────────────────

// Reproduit exactement le weekKey() de l'app :
// retourne la date du lundi de la semaine courante (YYYY-MM-DD)
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

// Retourne le nom du jour de demain (en français, comme dans la BDD)
// et un flag useTemplate = true si demain est lundi (vendredi soir)
function tomorrowInfo() {
  const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
  const today = new Date().getDay(); // 0=dim, 1=lun … 5=ven, 6=sam
  if (today === 5) return { name: 'lundi', useTemplate: true };
  // Lun(1)→mardi=index1, Mar(2)→mercredi=index2 … Jeu(4)→vendredi=index4
  return { name: DAY_NAMES[today], useTemplate: false };
}

// Prochaine date de rafraîchissement : lendemain ouvré à 19h15
// Vendredi → lundi suivant à 19h15
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

  // Slug non configuré
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

    const weekData = weeksRes[0]?.data   || {};
    const template = usersRes[0]?.template || {};
    const { name: dayName, useTemplate } = tomorrowInfo();

    // Priorité : données semaine → semaine type → rien
    let time = null;
    if (!useTemplate) time = weekData[dayName]?.a1 || null;
    if (!time)        time = template[dayName]?.a1  || null;

    w.addSpacer();
    const txt = w.addText(time || '—');
    txt.font                = Font.boldSystemFont(36);
    txt.textColor           = new Color('#FFFFFF');
    txt.minimumScaleFactor  = 0.6;
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
