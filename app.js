/* ============================================================
   CACOU — Registre cartographique des commissions
   Toute la logique tient ici. Aucune donnée ne quitte le navigateur.
   ============================================================ */

"use strict";

/* ---------- Référentiels ---------- */

const BRISTOL = [
  { n: 1, short: "Type I",   desc: "Billes dures et séparées, tel un chapelet rompu.", verdict: "constipation sévère" },
  { n: 2, short: "Type II",  desc: "En forme de saucisse, mais grumeleuse.", verdict: "constipation légère" },
  { n: 3, short: "Type III", desc: "Saucisse craquelée en surface.", verdict: "tout à fait honorable" },
  { n: 4, short: "Type IV",  desc: "Lisse et souple, tel un serpent débonnaire.", verdict: "l'idéal du genre" },
  { n: 5, short: "Type V",   desc: "Morceaux mous aux bords nets.", verdict: "tendance pressée" },
  { n: 6, short: "Type VI",  desc: "Morceaux duveteux, bords déchiquetés.", verdict: "légère diarrhée" },
  { n: 7, short: "Type VII", desc: "Entièrement liquide, sans pièce solide.", verdict: "situation préoccupante" },
];

const DUREES = [
  { id: "eclair",        label: "Éclair (< 2 min)" },
  { id: "reglementaire", label: "Réglementaire" },
  { id: "contemplative", label: "Contemplative" },
  { id: "sabbatique",    label: "Sabbatique (téléphone déchargé)" },
];

const CONTEXTES = [
  { id: "domicile",  label: "Domicile" },
  { id: "travail",   label: "Travail" },
  { id: "ami",       label: "Chez un tiers" },
  { id: "nature",    label: "Pleine nature" },
  { id: "public",    label: "Édifice public" },
  { id: "voyage",    label: "En voyage" },
];

const DISCRETIONS = [
  { id: "silencieux", label: "Silence monacal" },
  { id: "discret",    label: "Discret" },
  { id: "notable",    label: "Notable" },
  { id: "sismique",   label: "Sismique" },
];

const REACTIONS = ["Félicitations", "Courage", "Splendide", "Quelle santé"];

const BADGES = [
  { id: "premiere",  name: "Première pierre",    desc: "Consigner son tout premier événement.", test: (s) => s.entries.length >= 1 },
  { id: "decathlon", name: "Décathlon",          desc: "Dix événements portés au registre.", test: (s) => s.entries.length >= 10 },
  { id: "globe",     name: "Globe-trotteur",     desc: "Officier dans cinq contextes différents.", test: (s) => new Set(s.entries.map((e) => e.contexte)).size >= 5 },
  { id: "aurore",    name: "Chant de l'aurore",  desc: "Un événement avant sept heures du matin.", test: (s) => s.entries.some((e) => new Date(e.date).getHours() < 7) },
  { id: "noctambule", name: "Noctambule",        desc: "Un événement après minuit, avant quatre heures.", test: (s) => s.entries.some((e) => { const h = new Date(e.date).getHours(); return h >= 0 && h < 4; }) },
  { id: "bristol",   name: "Bristol complet",    desc: "Les sept types de l'échelle, tous documentés.", test: (s) => new Set(s.entries.map((e) => e.bristol)).size >= 7 },
  { id: "esthete",   name: "Esthète",            desc: "Attribuer cinq étoiles à un moment de grâce.", test: (s) => s.entries.some((e) => e.note === 5) },
  { id: "telegraphiste", name: "Télégraphiste",  desc: "Aviser le Cercle à dix reprises.", test: (s) => (s.telegramCount || 0) >= 10 },
];

/* ---------- État civil intestinal (création de personnage) ---------- */

const LIGNEES = [
  { id: "colon",   name: "Colon Nordique",      desc: "Peuple des fjords intérieurs. Entrailles de granit, ponctualité de glacier.", trait: "Imperturbable — aucun Type I ne saurait l'émouvoir." },
  { id: "elfe",    name: "Elfe des Sous-Bois",  desc: "Ne s'épanouit qu'à l'air libre, de préférence adossé à un chêne centenaire.", trait: "Communion — en pleine nature, sa prestance est sans égale." },
  { id: "nain",    name: "Nain des Faïences",   desc: "Bâtisseur des trônes ancestraux. Ne quitte le domicile qu'à contrecœur.", trait: "Forteresse — chez lui, nul ne l'attend, nul ne le presse." },
  { id: "gobelin", name: "Gobelin de Bureau",   desc: "Opportuniste des heures ouvrées, rémunéré pour ce qu'il fait de mieux.", trait: "Salarié — chaque séance au travail est une victoire sociale." },
  { id: "ondin",   name: "Ondin des Marais",    desc: "Lignée fluide, forgée par mille tempêtes intestines.", trait: "Écume — les Types VI et VII ne lui inspirent aucune crainte." },
];

const VOCATIONS = [
  { id: "chevalier",  name: "Chevalier de la Faïence",    desc: "L'honneur, la tenue, le panache. Jamais un procès-verbal bâclé." },
  { id: "alchimiste", name: "Alchimiste des Entrailles",  desc: "Observe, classe, conclut. L'échelle de Bristol est son grimoire." },
  { id: "barde",      name: "Barde du Trône",             desc: "Rien ne reste secret : tout finit en télégramme, puis en chanson." },
  { id: "moine",      name: "Moine du Silence",           desc: "Vœu de discrétion perpétuelle. Empreinte sonore : monacale, toujours." },
  { id: "rodeur",     name: "Rôdeur des Latrines",        desc: "Cartographe de l'inconnu. Aucun édifice public ne lui résiste." },
];

const GUILDES = [
  { id: "aube",       name: "Confrérie de l'Aube",     desc: "Officie avant le chant du coq. Le monde entier lui appartient." },
  { id: "zenith",     name: "Ordre du Zénith",          desc: "Midi sonnant. La régularité érigée en dogme sacré." },
  { id: "crepuscule", name: "Cercle du Crépuscule",     desc: "Quand le jour décline, la confrérie s'éveille." },
  { id: "minuit",     name: "Loge de Minuit",           desc: "Société très discrète. Il ne s'y passe rien d'avouable." },
];

const BLASON_SYMBOLS = ["❦", "⚜", "♜", "♞", "☾", "✶"];

const BLASON_COLORS = [
  { id: "sceau",     hex: "#a33d2c", name: "Rouge de sceau" },
  { id: "encre",     hex: "#2b2620", name: "Encre" },
  { id: "bronze",    hex: "#8b5e3c", name: "Bronze" },
  { id: "bouteille", hex: "#3d5a3d", name: "Vert bouteille" },
  { id: "nuit",      hex: "#2e3a55", name: "Bleu de nuit" },
  { id: "prune",     hex: "#5a3550", name: "Prune" },
];

const NIVEAUX = [
  { xp: 0,    titre: "Novice du Trône" },
  { xp: 50,   titre: "Apprenti Greffier" },
  { xp: 120,  titre: "Compagnon de Selle" },
  { xp: 220,  titre: "Sergent des Commodités" },
  { xp: 360,  titre: "Maître des Lieux d'Aisance" },
  { xp: 540,  titre: "Baron de la Faïence" },
  { xp: 780,  titre: "Vicomte des Vapeurs" },
  { xp: 1080, titre: "Duc du Bristol" },
  { xp: 1450, titre: "Archiduc des Entrailles" },
  { xp: 1900, titre: "Légende Vivante du Trône" },
];

/* ---------- Emblèmes gravés (un par lignée, vocation, guilde) ---------- */

const EMBLEMES = {
  colon:      '<path d="M3 40 L17 14 L25 28 L31 18 L45 40 Z"/><path d="M13 22 l4 -4 l4 5"/><circle cx="38" cy="10" r="1"/><circle cx="9" cy="9" r="1"/><circle cx="24" cy="6" r="1"/>',
  elfe:       '<path d="M24 42 V26"/><path d="M24 26 C10 26 10 8 24 8 C38 8 38 26 24 26 Z"/><path d="M24 34 l-6 -6"/><path d="M24 30 l5 -5"/><path d="M18 42 h12"/>',
  nain:       '<path d="M12 42 V14 h4 v-4 h4 v4 h8 v-4 h4 v4 h4 v28"/><path d="M10 42 h28"/><path d="M20 42 v-10 h8 v10"/>',
  gobelin:    '<path d="M16 40 C18 24 30 10 42 6 C38 20 28 34 20 38 Z"/><path d="M16 40 l-6 4"/><path d="M24 30 C28 24 32 18 36 14"/>',
  ondin:      '<path d="M4 16 q6 -8 12 0 t12 0 t12 0"/><path d="M4 27 q6 -8 12 0 t12 0 t12 0"/><path d="M4 38 q6 -8 12 0 t12 0 t12 0"/>',
  chevalier:  '<path d="M24 5 l13 4 v12 c0 10 -7 17 -13 21 c-6 -4 -13 -11 -13 -21 v-12 Z"/><path d="M24 13 v18"/><path d="M17 20 h14"/>',
  alchimiste: '<path d="M20 5 h8"/><path d="M22 5 v10 L12 36 a4 4 0 0 0 4 6 h16 a4 4 0 0 0 4 -6 L26 15 V5"/><path d="M17 31 h14"/><circle cx="22" cy="36" r="1"/><circle cx="27" cy="34" r="1"/>',
  barde:      '<path d="M14 7 c-2 10 0 20 10 24 c10 -4 12 -14 10 -24"/><path d="M20 11 v16"/><path d="M24 12 v16"/><path d="M28 11 v16"/><path d="M18 41 h12"/><path d="M24 31 v10"/>',
  moine:      '<path d="M24 5 a2 2 0 0 1 2 2 c8 2 8 12 8 18 l4 6 H10 l4 -6 c0 -6 0 -16 8 -18 a2 2 0 0 1 2 -2 Z"/><path d="M20 37 a4 4 0 0 0 8 0"/>',
  rodeur:     '<circle cx="24" cy="24" r="16"/><path d="M24 8 v4 M24 36 v4 M8 24 h4 M36 24 h4"/><path d="M30 18 L26 26 L18 30 L22 22 Z"/>',
  aube:       '<path d="M6 33 h36"/><path d="M14 33 a10 10 0 0 1 20 0"/><path d="M24 16 v-6 M12 20 l-4 -4 M36 20 l4 -4"/>',
  zenith:     '<circle cx="24" cy="24" r="9"/><path d="M24 6 v6 M24 36 v6 M6 24 h6 M36 24 h6 M11 11 l4 4 M33 33 l4 4 M37 11 l-4 4 M15 33 l-4 4"/>',
  crepuscule: '<path d="M6 30 h36"/><path d="M14 30 a10 10 0 0 1 20 0"/><path d="M10 36 h8 M22 36 h8 M34 36 h5"/><path d="M16 42 h10"/>',
  minuit:     '<path d="M28 7 a14 14 0 1 0 12 20 a11 11 0 0 1 -12 -20 Z"/><path d="M12 9 v6 M9 12 h6"/><path d="M39 33 v5 M36.5 35.5 h5"/>',
};

function emblemSvg(id, size) {
  const inner = EMBLEMES[id] || "";
  return `<svg viewBox="0 0 48 48"${size ? ` width="${size}" height="${size}"` : ""} aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
}

/* ---------- Effigie (portrait personnalisable) ---------- */

const COIFFES = [
  { id: "nu",       name: "Tête nue",        svg: '<path d="M36 30 a14 14 0 0 1 28 0" />' },
  { id: "hautform", name: "Haut-de-forme",   svg: '<rect x="37" y="6" width="26" height="20"/><path d="M29 26 h42"/><path d="M37 20 h26"/>' },
  { id: "capuche",  name: "Capuche",         svg: '<path d="M33 42 C29 14 50 5 50 5 C50 5 71 14 67 42"/><path d="M33 42 q17 6 34 0"/>' },
  { id: "heaume",   name: "Heaume",          svg: '<path d="M36 46 v-14 a14 14 0 0 1 28 0 v14"/><path d="M36 37 h28"/><path d="M50 32 v14"/>' },
  { id: "couronne", name: "Couronne",        svg: '<path d="M35 29 L38 15 L44 22 L50 12 L56 22 L62 15 L65 29 Z"/>' },
  { id: "beret",    name: "Béret à plume",   svg: '<path d="M34 28 q16 -14 32 0"/><path d="M60 22 q8 -10 13 -13"/><circle cx="50" cy="17" r="1.5"/>' },
];

const VISAGES = [
  { id: "glabre",    name: "Visage glabre",  svg: "" },
  { id: "moustache", name: "Moustache cirée", svg: '<path d="M42 52 q8 6 16 0"/><path d="M41 52 q-3 2 -5 0"/><path d="M59 52 q3 2 5 0"/>' },
  { id: "barbe",     name: "Barbe de sage",  svg: '<path d="M39 48 q0 17 11 17 q11 0 11 -17"/><path d="M44 52 q6 4 12 0"/>' },
  { id: "monocle",   name: "Monocle",        svg: '<circle cx="57" cy="43" r="5"/><path d="M57 48 v9"/>' },
  { id: "lunettes",  name: "Bésicles",       svg: '<circle cx="43" cy="43" r="5"/><circle cx="57" cy="43" r="5"/><path d="M48 43 h4"/><path d="M38 43 h-4 M62 43 h4"/>' },
];

function portraitSvg(coiffe, visage, color) {
  const c = COIFFES.find((x) => x.id === coiffe) || COIFFES[0];
  const v = VISAGES.find((x) => x.id === visage) || VISAGES[0];
  const col = esc(color || "#2b2620");
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="47" fill="#fffdf7" stroke="${col}" stroke-width="2.5"/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="${col}" stroke-width="1" opacity="0.4"/>
    <g fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 88 c3 -15 13 -20 28 -20 s25 5 28 20"/>
      <circle cx="50" cy="42" r="15"/>
      <circle cx="44.5" cy="42" r="0.8" fill="${col}"/>
      <circle cx="55.5" cy="42" r="0.8" fill="${col}"/>
      ${c.svg}${v.svg}
    </g>
  </svg>`;
}

function profilePortraitSvg() {
  const p = state.profile || {};
  const port = p.portrait || {};
  const color = (p.blason && p.blason.c) || "#2b2620";
  return portraitSvg(port.coiffe, port.visage, color);
}

/* ---------- Compétences clés ---------- */

const SKILLS = [
  { id: "regularite",   name: "Régularité",   desc: "La constance du métronome suisse." },
  { id: "discretion",   name: "Discrétion",   desc: "L'art de passer inaperçu, même en pleine action." },
  { id: "endurance",    name: "Endurance",    desc: "Tenir le siège, sans faiblir ni se plaindre." },
  { id: "cartographie", name: "Cartographie", desc: "Conquérir sans relâche de nouveaux territoires." },
  { id: "eloquence",    name: "Éloquence",    desc: "L'art du télégramme bien troussé." },
];

function skillBonus(id) {
  const e = state.entries;
  let b = 0;
  if (id === "regularite") b = Math.floor(e.length / 5);
  if (id === "discretion") b = Math.floor(e.filter((x) => x.discretion === "silencieux").length / 3);
  if (id === "endurance") b = Math.floor(e.filter((x) => x.duree === "contemplative" || x.duree === "sabbatique").length / 3);
  if (id === "cartographie") b = Math.floor(new Set(e.map((x) => x.place).filter(Boolean)).size / 3);
  if (id === "eloquence") b = Math.floor((state.telegramCount || 0) / 4);
  return b;
}

function effectiveSkill(id) {
  const base = (state.profile && state.profile.skills && state.profile.skills[id]) || 1;
  return { base, bonus: skillBonus(id), total: Math.min(10, base + skillBonus(id)) };
}

function pips(total, max) {
  let s = "";
  for (let i = 0; i < max; i++) s += i < total ? "◆" : '<span class="pip-off">◇</span>';
  return s;
}

/* ---------- Quête du jour ---------- */

const QUESTS = [
  { id: "aurore",       name: "L'Heure du Coq",      desc: "Consigner un événement avant neuf heures.", xp: 15, test: (e) => new Date(e.date).getHours() < 9 },
  { id: "ideal",        name: "La Quête de l'Idéal", desc: "Obtenir un Type IV, l'idéal du genre.", xp: 15, test: (e) => e.bristol === 4 },
  { id: "fantome",      name: "Le Fantôme",          desc: "Une empreinte sonore de silence monacal.", xp: 15, test: (e) => e.discretion === "silencieux" },
  { id: "chroniqueur",  name: "Le Chroniqueur",      desc: "Joindre une observation au procès-verbal.", xp: 10, test: (e) => !!e.comment },
  { id: "grandchemin",  name: "Le Grand Chemin",     desc: "Officier hors du domicile.", xp: 15, test: (e) => e.contexte !== "domicile" },
  { id: "grace",        name: "L'Instant de Grâce",  desc: "Vivre une séance cinq étoiles.", xp: 10, test: (e) => e.note === 5 },
  { id: "veille",       name: "La Longue Veille",    desc: "Une séance contemplative, ou mieux : sabbatique.", xp: 15, test: (e) => e.duree === "contemplative" || e.duree === "sabbatique" },
];

function todayQuest() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return QUESTS[dayOfYear % QUESTS.length];
}

function renderQuest() {
  const box = $("#quest-card");
  if (!box) return;
  const q = todayQuest();
  const done = state.questDoneOn === new Date().toDateString();
  box.className = "quest-card" + (done ? " is-done" : "");
  box.innerHTML = `
    <span class="quest-glyph">${done ? "✓" : "❖"}</span>
    <span><span class="quest-name">Quête du jour — ${esc(q.name)}</span><br>
    <span class="quest-desc">${done ? "Quête accomplie. Le Grand Greffe est satisfait." : esc(q.desc)}</span></span>
    <span class="quest-xp">+${q.xp} XP</span>`;
}

function checkQuest(entry) {
  const q = todayQuest();
  if (state.questDoneOn === new Date().toDateString()) return;
  if (q.test(entry)) {
    state.questDoneOn = new Date().toDateString();
    addXp(q.xp);
    setTimeout(() => toast(`QUÊTE ACCOMPLIE — ${q.name} (+${q.xp} XP). Le Grand Greffe est satisfait.`), 400);
  }
}

/* ---------- Le Cercle (correspondants de démonstration) ---------- */

const FRIENDS = [
  { id: "marguerite", name: "Marguerite F.", title: "Doyenne du Cercle", count: 342, style: "Type IV, invariablement. Une horloge suisse." },
  { id: "anselme",    name: "Anselme R.",    title: "Correspondant en Bretagne", count: 127, style: "Adepte de la séance contemplative en bord de mer." },
  { id: "victoire",   name: "Victoire L.",   title: "Attachée aux affaires urgentes", count: 89, style: "Spécialiste du Type V entre deux réunions." },
  { id: "gustave",    name: "Gustave M.",    title: "Explorateur de terrain", count: 214, style: "Ne consigne qu'en pleine nature. Un puriste." },
];

const FRIEND_FEED_SEED = [
  { friend: "marguerite", hoursAgo: 2,  text: "a consigné un événement à Lyon 2ᵉ.", quote: "Type IV, cinq étoiles. La perfection n'attend pas.", telegram: false },
  { friend: "gustave",    hoursAgo: 5,  text: "a émis un télégramme depuis le massif des Écrins.", quote: null, telegram: true, tg: "SOMMET ATTEINT STOP ÉVÉNEMENT CONSIGNÉ À 2 800 M STOP PANORAMA EXCEPTIONNEL STOP GUSTAVE" },
  { friend: "victoire",   hoursAgo: 9,  text: "a consigné un événement — contexte : travail.", quote: "Empreinte sonore : notable. On assumera.", telegram: false },
  { friend: "anselme",    hoursAgo: 26, text: "a consigné un événement à Saint-Malo.", quote: "Séance sabbatique face à la marée montante. Type III.", telegram: false },
  { friend: "marguerite", hoursAgo: 31, text: "a décerné une réaction « Splendide » à Gustave M.", quote: null, telegram: false },
];

/* ---------- État ---------- */

const STORAGE_KEY = "cacou-state-v1";

const state = loadState();

function loadState() {
  let s = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) s = JSON.parse(raw);
  } catch (e) { /* registre corrompu : on repart à neuf */ }
  if (!s) s = { profile: null, entries: [], reactions: {}, telegramCount: 0, incomingSeen: false };
  /* migrations douces */
  if (!Array.isArray(s.realFriends)) s.realFriends = [];
  if (!Array.isArray(s.receivedTelegrams)) s.receivedTelegrams = [];
  if (!s.theme) s.theme = "jour";
  if (s.profile && !s.profile.id) s.profile.id = newId("u");
  if (typeof s.xp !== "number") {
    /* attribution rétroactive : le passé compte aussi */
    s.xp = (s.entries ? s.entries.length * 10 : 0) + (s.telegramCount || 0) * 5;
  }
  return s;
}

function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- Utilitaires ---------- */

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function stars(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function roman(n) {
  return ["I", "II", "III", "IV", "V", "VI", "VII"][n - 1] || "?";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function relTime(hoursAgo) {
  if (hoursAgo < 1) return "à l'instant";
  if (hoursAgo < 24) return `il y a ${Math.round(hoursAgo)} h`;
  return `il y a ${Math.round(hoursAgo / 24)} j`;
}

function labelOf(list, id) {
  const found = list.find((x) => x.id === id);
  return found ? found.label : id;
}

/* ---------- Niveaux, expérience & blason ---------- */

function levelInfo(xp) {
  let idx = 0;
  for (let i = 0; i < NIVEAUX.length; i++) if (xp >= NIVEAUX[i].xp) idx = i;
  return {
    niveau: idx + 1,
    titre: NIVEAUX[idx].titre,
    floor: NIVEAUX[idx].xp,
    next: NIVEAUX[idx + 1] || null,
  };
}

function currentTitle() {
  return levelInfo(state.xp || 0).titre;
}

function addXp(amount) {
  const before = levelInfo(state.xp || 0).niveau;
  state.xp = (state.xp || 0) + amount;
  const after = levelInfo(state.xp);
  if (after.niveau > before) {
    setTimeout(() => {
      $("#levelup-crest").innerHTML = profilePortraitSvg();
      $("#levelup-title").textContent = after.titre;
      $("#levelup-niveau").textContent = `Niveau ${after.niveau} — ${state.xp} points d'expérience`;
      $("#modal-levelup").hidden = false;
    }, 1000);
  }
}

function crestSvg(symbol, colorHex) {
  const s = esc(symbol) + "︎"; /* force le rendu gravure, pas emoji */
  const c = esc(colorHex);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="#fffdf7" stroke="${c}" stroke-width="3.5"/>
    <circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>
    <text x="50" y="54" text-anchor="middle" dominant-baseline="middle" font-size="40"
      font-family="Georgia, 'DejaVu Serif', serif" fill="${c}">${s}</text>
  </svg>`;
}

function profileCrestSvg() {
  const b = (state.profile && state.profile.blason) || { s: "❦", c: "#a33d2c" };
  return crestSvg(b.s, b.c);
}

/* codes portables (base64url d'un JSON) pour cartes de visite et télégrammes */

function encodeCode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return JSON.parse(decodeURIComponent(escape(atob(s))));
}

function appUrl() {
  return location.origin + location.pathname;
}

async function shareOrCopy(url, title) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return true;
    } catch (e) { /* partage annulé : on retombe sur la copie */ }
  }
  return copyText(url);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copié. Confiez-le à qui vous voudrez.");
    return true;
  } catch (e) {
    toast("Copie impossible — sélectionnez le texte à la main.");
    return false;
  }
}

let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

/* ---------- Carte ---------- */

const map = L.map("map", { zoomControl: true, attributionControl: true })
  .setView([46.6, 2.4], 6); // douce France

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

function dotIcon() {
  return L.divIcon({ className: "dot-marker", html: "<span></span>", iconSize: [14, 14], iconAnchor: [7, 7] });
}

function popupHtml(entry) {
  const b = BRISTOL.find((x) => x.n === entry.bristol);
  return `
    <div class="popup-date">${esc(fmtDate(entry.date))} — ${esc(fmtTime(entry.date))}</div>
    <div class="popup-bristol">Bristol ${roman(entry.bristol)} <em>(${esc(b ? b.verdict : "")})</em></div>
    <div class="popup-stars">${stars(entry.note)}</div>
    <div>${esc(labelOf(CONTEXTES, entry.contexte))} · ${esc(labelOf(DUREES, entry.duree))}</div>
    ${entry.comment ? `<div><em>« ${esc(entry.comment)} »</em></div>` : ""}
  `;
}

function renderMarkers() {
  markersLayer.clearLayers();
  state.entries.forEach((entry) => {
    L.marker([entry.lat, entry.lng], { icon: dotIcon() })
      .bindPopup(popupHtml(entry))
      .addTo(markersLayer);
  });
}

/* mode placement */
let placing = false;

function startPlacement() {
  placing = true;
  $("#map-banner").hidden = false;
  $("#btn-new-entry").disabled = true;
  map.getContainer().style.cursor = "crosshair";
}

function stopPlacement() {
  placing = false;
  $("#map-banner").hidden = true;
  $("#btn-new-entry").disabled = false;
  map.getContainer().style.cursor = "";
}

map.on("click", (e) => {
  if (!placing) return;
  stopPlacement();
  openEntryModal(e.latlng.lat, e.latlng.lng);
});

$("#btn-new-entry").addEventListener("click", () => {
  showView("carte");
  startPlacement();
});

$("#cancel-placement").addEventListener("click", stopPlacement);

$("#btn-locate").addEventListener("click", () => {
  if (!navigator.geolocation) return toast("Votre navigateur refuse de vous situer. Mystère.");
  navigator.geolocation.getCurrentPosition(
    (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
    () => toast("Localisation refusée. Le registre respecte votre pudeur.")
  );
});

/* ---------- Nom de lieu (meilleur effort, sans garantie) ---------- */

async function guessPlaceName(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&accept-language=fr`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("nominatim");
    const data = await res.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county;
    const zone = a.suburb || a.neighbourhood || a.city_district;
    if (city && zone) return `${zone}, ${city}`;
    if (city) return city;
    return data.name || null;
  } catch (e) {
    return null;
  }
}

/* ---------- Modale de saisie ---------- */

const draft = { lat: null, lng: null, place: null, bristol: null, note: null, duree: null, contexte: null, discretion: null };

function buildSeg(containerId, items, key, renderLabel) {
  const box = $(containerId);
  box.innerHTML = "";
  items.forEach((item) => {
    const btn = el("button", null, renderLabel(item));
    btn.type = "button";
    btn.addEventListener("click", () => {
      draft[key] = item.n !== undefined ? item.n : item.id;
      [...box.children].forEach((c) => c.classList.remove("is-on"));
      btn.classList.add("is-on");
      if (key === "bristol") {
        const b = BRISTOL.find((x) => x.n === item.n);
        $("#bristol-hint").textContent = `${b.desc} — Verdict : ${b.verdict}.`;
      }
    });
    box.appendChild(btn);
  });
}

function openEntryModal(lat, lng) {
  draft.lat = lat; draft.lng = lng; draft.place = null;
  draft.bristol = null; draft.note = null; draft.duree = null;
  draft.contexte = null; draft.discretion = null;

  buildSeg("#seg-bristol", BRISTOL, "bristol", (b) => roman(b.n));
  buildSeg("#seg-note", [1, 2, 3, 4, 5].map((n) => ({ id: n })), "note", (x) => stars(x.id));
  buildSeg("#seg-duree", DUREES, "duree", (d) => d.label);
  buildSeg("#seg-contexte", CONTEXTES, "contexte", (c) => c.label);
  buildSeg("#seg-discretion", DISCRETIONS, "discretion", (d) => d.label);

  $("#bristol-hint").textContent = "Choisissez le type correspondant.";
  $("#entry-comment").value = "";
  $("#entry-telegram").checked = true;
  $("#entry-number").textContent = String(state.entries.length + 1).padStart(3, "0");
  $("#entry-place").textContent = `Coordonnées : ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  $("#modal-entry").hidden = false;

  guessPlaceName(lat, lng).then((name) => {
    if (name) {
      draft.place = name;
      $("#entry-place").textContent = `Lieu présumé : ${name}`;
    }
  });
}

$("#entry-cancel").addEventListener("click", () => { $("#modal-entry").hidden = true; });

$("#entry-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!draft.bristol) return toast("L'échelle de Bristol n'est pas une option, c'est un devoir.");
  if (!draft.note) return toast("Une appréciation est requise. Soyez juste, mais notez.");
  if (!draft.duree || !draft.contexte || !draft.discretion) return toast("Le procès-verbal est incomplet.");

  const entry = {
    id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
    lat: draft.lat,
    lng: draft.lng,
    place: draft.place,
    bristol: draft.bristol,
    note: draft.note,
    duree: draft.duree,
    contexte: draft.contexte,
    discretion: draft.discretion,
    comment: $("#entry-comment").value.trim(),
  };
  const before = earnedBadgeIds();
  state.entries.unshift(entry);

  const sendTelegram = $("#entry-telegram").checked;
  if (sendTelegram) state.telegramCount = (state.telegramCount || 0) + 1;

  const after = earnedBadgeIds();
  const fresh = after.filter((id) => !before.includes(id));
  addXp(10 + (sendTelegram ? 5 : 0) + fresh.length * 25);
  checkQuest(entry);

  saveState();
  renderAll();
  $("#modal-entry").hidden = true;

  if (sendTelegram) {
    const text = outgoingTelegramText(entry);
    showTelegram(text, telegramShareLink(text));
  } else {
    toast("Procès-verbal scellé. Le registre vous remercie.");
  }
  if (fresh.length) {
    const names = fresh.map((id) => BADGES.find((b) => b.id === id).name).join(", ");
    setTimeout(() => toast(`Distinction obtenue : ${names}. Toutes nos félicitations.`), 3600);
  }
});

/* ---------- Télégrammes ---------- */

function circleSize() {
  return FRIENDS.length + state.realFriends.length;
}

function outgoingTelegramText(entry) {
  const lieu = entry.place ? entry.place.toUpperCase() : "POSITION CLASSIFIÉE";
  const b = BRISTOL.find((x) => x.n === entry.bristol);
  return [
    `À : LE CERCLE (${circleSize()} CORRESPONDANTS)`,
    ``,
    `FAIT ACCOMPLI STOP`,
    `LIEU : ${lieu} STOP`,
    `BRISTOL ${roman(entry.bristol)} — ${b.verdict.toUpperCase()} STOP`,
    `APPRÉCIATION : ${entry.note} ÉTOILE${entry.note > 1 ? "S" : ""} SUR CINQ STOP`,
    `AUCUNE RÉPONSE ATTENDUE STOP`,
    `SIGNÉ : ${state.profile.name.toUpperCase()}, ${currentTitle().toUpperCase()} STOP FIN`,
  ].join("\n");
}

function telegramShareLink(text) {
  const payload = { v: 1, id: newId("t"), from: { id: state.profile.id, name: state.profile.name }, text, date: new Date().toISOString() };
  return appUrl() + "?tg=" + encodeCode(payload);
}

function cardShareLink() {
  const b = state.profile.blason;
  const p = state.profile.portrait;
  return appUrl() + "?ami=" + encodeCode({
    v: 1, id: state.profile.id, name: state.profile.name,
    t: currentTitle(), b: b ? [b.s, b.c] : undefined,
    p: p ? [p.coiffe, p.visage] : undefined,
  });
}

function pokeTelegramText(friend, me) {
  return [
    `À : ${friend.name.toUpperCase()}`,
    ``,
    `PENSÉE ÉMUE DEPUIS LE TRÔNE STOP`,
    `VOUS SAUREZ QUOI FAIRE STOP`,
    `SIGNÉ : ${me.toUpperCase()}, ${currentTitle().toUpperCase()} STOP FIN`,
  ].join("\n");
}

function incomingTelegramText(me) {
  return [
    `À : ${me.toUpperCase()}`,
    ``,
    `BIENVENUE AU REGISTRE STOP`,
    `LE CERCLE VOUS OBSERVE AVEC BIENVEILLANCE STOP`,
    `CONSIGNEZ SANS HONTE STOP`,
    `SIGNÉ : MARGUERITE F. DOYENNE STOP FIN`,
  ].join("\n");
}

let currentShareUrl = null;

function showTelegram(text, shareUrl) {
  $("#telegram-body").textContent = text;
  currentShareUrl = shareUrl || null;
  $("#telegram-share-row").hidden = !shareUrl;
  $("#modal-telegram").hidden = false;
}

$("#telegram-close").addEventListener("click", () => { $("#modal-telegram").hidden = true; });
$("#telegram-share").addEventListener("click", () => {
  if (currentShareUrl) shareOrCopy(currentShareUrl, "Télégramme Cacou");
});
$("#telegram-copy").addEventListener("click", () => {
  if (currentShareUrl) copyText(currentShareUrl);
});

/* ---------- Journal ---------- */

function renderJournal() {
  const box = $("#journal-list");
  box.innerHTML = "";
  if (!state.entries.length) {
    box.appendChild(el("p", "empty-note", "Le registre est vierge. Cela ne saurait durer."));
    return;
  }
  let lastMonth = null;
  state.entries.forEach((entry, i) => {
    const month = new Date(entry.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    if (month !== lastMonth) {
      lastMonth = month;
      box.appendChild(el("div", "journal-month", esc(month)));
    }
    const num = state.entries.length - i;
    const b = BRISTOL.find((x) => x.n === entry.bristol);
    const row = el("div", "journal-entry");
    row.appendChild(el("div", "je-num", `N<sup>o</sup> ${String(num).padStart(3, "0")}`));
    const main = el("div", "je-main",
      `<strong>${esc(fmtDate(entry.date))}, ${esc(fmtTime(entry.date))}</strong> — ${esc(entry.place || "lieu non identifié")}<br>
       <span class="je-meta">Bristol ${roman(entry.bristol)} (${esc(b ? b.verdict : "")}) · ${esc(labelOf(CONTEXTES, entry.contexte))} · ${esc(labelOf(DUREES, entry.duree))} · ${esc(labelOf(DISCRETIONS, entry.discretion))}</span>`);
    row.appendChild(main);
    row.appendChild(el("div", "je-stars", stars(entry.note)));
    if (entry.comment) {
      row.appendChild(el("div", "je-comment", `« ${esc(entry.comment)} »`));
    }
    const actions = el("div", "je-actions");
    const viewBtn = el("button", "btn btn-ghost btn-small", "Voir sur la carte");
    viewBtn.addEventListener("click", () => {
      showView("carte");
      map.setView([entry.lat, entry.lng], 16);
    });
    const delBtn = el("button", "btn btn-ghost btn-small btn-danger", "Rayer du registre");
    delBtn.style.marginLeft = "0.5rem";
    delBtn.addEventListener("click", () => {
      if (!confirm("Rayer définitivement cet événement du registre ?")) return;
      state.entries = state.entries.filter((x) => x.id !== entry.id);
      saveState();
      renderAll();
      toast("L'événement a été rayé. L'Histoire l'oubliera.");
    });
    actions.appendChild(viewBtn);
    actions.appendChild(delBtn);
    row.appendChild(actions);
    box.appendChild(row);
  });
}

/* ---------- Cercle : amis & gazette ---------- */

function renderFriends() {
  const box = $("#friends-list");
  box.innerHTML = "";
  FRIENDS.forEach((f) => {
    const card = el("div", "friend-card");
    card.appendChild(el("div", "friend-name", esc(f.name)));
    card.appendChild(el("div", "friend-title", esc(f.title)));
    card.appendChild(el("div", "friend-stat", `${f.count} événements consignés<br><em>${esc(f.style)}</em>`));
    const btn = el("button", "btn btn-ghost btn-small", "Adresser un télégramme");
    btn.addEventListener("click", () => {
      state.telegramCount = (state.telegramCount || 0) + 1;
      addXp(5);
      saveState();
      renderBadges();
      showTelegram(pokeTelegramText(f, state.profile ? state.profile.name : "UN ANONYME"));
    });
    card.appendChild(btn);
    box.appendChild(card);
  });
}

function renderRealFriends() {
  const box = $("#real-friends-list");
  box.innerHTML = "";
  if (!state.realFriends.length) {
    box.appendChild(el("p", "empty-note",
      "Aucun correspondant véritable pour l'heure. Partagez votre carte de visite ci-dessus : c'est ainsi que les grandes amitiés commencent."));
    return;
  }
  state.realFriends.forEach((f) => {
    const card = el("div", "friend-card is-real");
    if (f.portrait) {
      card.appendChild(el("div", "friend-crest", portraitSvg(f.portrait[0], f.portrait[1], f.blason ? f.blason[1] : null)));
    } else if (f.blason) {
      card.appendChild(el("div", "friend-crest", crestSvg(f.blason[0], f.blason[1])));
    }
    card.appendChild(el("div", "friend-seal", "Correspondant certifié"));
    card.appendChild(el("div", "friend-name", esc(f.name)));
    if (f.titre) card.appendChild(el("div", "friend-title", esc(f.titre)));
    card.appendChild(el("div", "friend-stat", `Au registre depuis le ${esc(fmtDate(f.addedAt))}.`));
    const btn = el("button", "btn btn-ghost btn-small", "Adresser un télégramme");
    btn.addEventListener("click", () => {
      state.telegramCount = (state.telegramCount || 0) + 1;
      addXp(5);
      saveState();
      renderBadges();
      const text = pokeTelegramText(f, state.profile ? state.profile.name : "UN ANONYME");
      showTelegram(text, telegramShareLink(text));
    });
    card.appendChild(btn);
    const del = el("button", "btn btn-ghost btn-small btn-danger", "Rompre la correspondance");
    del.style.marginTop = "0.4rem";
    del.addEventListener("click", () => {
      if (!confirm(`Rayer ${f.name} de vos correspondants ?`)) return;
      state.realFriends = state.realFriends.filter((x) => x.id !== f.id);
      saveState();
      renderRealFriends();
      toast("Correspondance rompue. Sans rancune, espérons-le.");
    });
    card.appendChild(del);
    box.appendChild(card);
  });
}

function addFriendFromCode(raw) {
  let code = String(raw || "").trim();
  if (!code) return toast("Le champ est vide, comme votre carnet d'adresses.");
  const m = code.match(/[?&]ami=([A-Za-z0-9_-]+)/);
  if (m) code = m[1];
  code = code.replace(/^CACOU-/, "");
  let data;
  try {
    data = decodeCode(code);
    if (!data || !data.id || !data.name) throw new Error("invalide");
  } catch (e) {
    return toast("Ce code est illisible. Vérifiez la copie.");
  }
  if (state.profile && data.id === state.profile.id) {
    return toast("S'ajouter soi-même ? L'introspection a ses limites.");
  }
  if (state.realFriends.some((f) => f.id === data.id)) {
    return toast(`${data.name} figure déjà parmi vos correspondants.`);
  }
  state.realFriends.push({
    id: data.id,
    name: String(data.name).slice(0, 24),
    titre: data.t ? String(data.t).slice(0, 40) : null,
    blason: Array.isArray(data.b) && data.b.length === 2 ? [String(data.b[0]).slice(0, 4), String(data.b[1]).slice(0, 12)] : null,
    portrait: Array.isArray(data.p) && data.p.length === 2 ? [String(data.p[0]).slice(0, 12), String(data.p[1]).slice(0, 12)] : null,
    addedAt: new Date().toISOString(),
  });
  saveState();
  renderRealFriends();
  toast(`${data.name} rejoint votre Cercle. Qu'on lui porte l'estime due.`);
}

function renderVisite() {
  if (!state.profile) return;
  $("#visite-name").innerHTML =
    `<span class="visite-crest">${profilePortraitSvg()}</span>` +
    `<span>${esc(state.profile.name)}<br><span class="profil-titre">${esc(currentTitle())}</span></span>`;
  const link = cardShareLink();
  const qrBox = $("#qr-box");
  qrBox.innerHTML = "";
  try {
    const qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();
    qrBox.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0 });
  } catch (e) {
    qrBox.textContent = "QR indisponible";
  }
}

$("#btn-share-card").addEventListener("click", () => shareOrCopy(cardShareLink(), "Ma carte de visite Cacou"));
$("#btn-copy-card").addEventListener("click", () => copyText(cardShareLink()));
$("#btn-add-friend").addEventListener("click", () => {
  addFriendFromCode($("#friend-code-input").value);
  $("#friend-code-input").value = "";
});
$("#friend-code-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("#btn-add-friend").click(); }
});

function feedItems() {
  const items = [];
  FRIEND_FEED_SEED.forEach((seed, i) => {
    const f = FRIENDS.find((x) => x.id === seed.friend);
    items.push({
      id: "f" + i,
      hoursAgo: seed.hoursAgo,
      author: f.name,
      text: seed.text,
      quote: seed.quote,
      tg: seed.telegram ? seed.tg : null,
      reactable: true,
    });
  });
  state.receivedTelegrams.forEach((t) => {
    const hoursAgo = (Date.now() - new Date(t.receivedAt).getTime()) / 3600000;
    items.push({
      id: "rt-" + t.id,
      hoursAgo,
      author: t.from,
      text: "vous a adressé un télégramme.",
      quote: null,
      tg: t.text,
      reactable: true,
    });
  });
  state.entries.slice(0, 3).forEach((entry) => {
    const hoursAgo = (Date.now() - new Date(entry.date).getTime()) / 3600000;
    items.push({
      id: "own-" + entry.id,
      hoursAgo,
      author: state.profile ? state.profile.name : "Vous",
      text: `a consigné un événement — ${entry.place ? esc(entry.place) : "lieu non identifié"}.`,
      quote: `Bristol ${roman(entry.bristol)}, ${stars(entry.note)}.`,
      tg: null,
      reactable: false,
      own: true,
    });
  });
  items.sort((a, b) => a.hoursAgo - b.hoursAgo);
  return items;
}

function renderFeed() {
  const box = $("#feed-list");
  box.innerHTML = "";
  feedItems().forEach((item) => {
    const row = el("div", "feed-item");
    row.appendChild(el("div", "feed-time", relTime(item.hoursAgo)));
    const body = el("div", "feed-body");
    body.appendChild(el("div", null, `<strong>${esc(item.author)}</strong> ${item.text}`));
    if (item.quote) body.appendChild(el("div", "feed-quote", `« ${item.quote} »`));
    if (item.tg) body.appendChild(el("div", "feed-telegram", esc(item.tg)));
    if (item.reactable) {
      const reactions = el("div", "feed-reactions");
      REACTIONS.forEach((r) => {
        const btn = el("button", "reaction-btn", esc(r));
        const isOn = state.reactions[item.id] === r;
        if (isOn) btn.classList.add("is-on");
        btn.addEventListener("click", () => {
          state.reactions[item.id] = isOn ? null : r;
          saveState();
          renderFeed();
          if (!isOn) toast(`Réaction « ${r} » apposée au tampon rouge.`);
        });
        reactions.appendChild(btn);
      });
      body.appendChild(reactions);
    }
    row.appendChild(body);
    box.appendChild(row);
  });
}

/* ---------- Statistiques ---------- */

function computeStreak() {
  if (!state.entries.length) return 0;
  const days = new Set(state.entries.map((e) => new Date(e.date).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderStats() {
  const tiles = $("#stat-tiles");
  tiles.innerHTML = "";
  const total = state.entries.length;
  const avg = total ? (state.entries.reduce((s, e) => s + e.note, 0) / total).toFixed(1) : "—";
  const places = new Set(state.entries.map((e) => e.place).filter(Boolean));
  const streak = computeStreak();

  const data = [
    { v: total, l: "événements" },
    { v: avg, l: "note moyenne" },
    { v: places.size, l: "lieux distincts" },
    { v: streak, l: streak > 1 ? "jours de suite" : "jour de suite" },
  ];
  data.forEach((d) => {
    const tile = el("div", "stat-tile");
    tile.appendChild(el("div", "stat-value", String(d.v)));
    tile.appendChild(el("div", "stat-label", d.l));
    tiles.appendChild(tile);
  });

  const chart = $("#bristol-chart");
  chart.innerHTML = "";
  const counts = BRISTOL.map((b) => state.entries.filter((e) => e.bristol === b.n).length);
  const max = Math.max(1, ...counts);
  BRISTOL.forEach((b, i) => {
    const row = el("div", "bristol-bar-row");
    row.appendChild(el("div", "bristol-bar-label", `Type ${roman(b.n)}`));
    const track = el("div", "bristol-bar-track");
    const fill = el("div", "bristol-bar-fill");
    fill.style.width = counts[i] ? `${(counts[i] / max) * 100}%` : "0";
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el("div", "bristol-bar-count", String(counts[i])));
    chart.appendChild(row);
  });

  const wkChart = $("#weekday-chart");
  wkChart.innerHTML = "";
  const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const wkCounts = dayOrder.map((d) => state.entries.filter((e) => new Date(e.date).getDay() === d).length);
  const wkMax = Math.max(1, ...wkCounts);
  dayNames.forEach((name, i) => {
    const row = el("div", "bristol-bar-row");
    row.appendChild(el("div", "bristol-bar-label", name));
    const track = el("div", "bristol-bar-track");
    const fill = el("div", "bristol-bar-fill");
    fill.style.width = wkCounts[i] ? `${(wkCounts[i] / wkMax) * 100}%` : "0";
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el("div", "bristol-bar-count", String(wkCounts[i])));
    wkChart.appendChild(row);
  });
}

function earnedBadgeIds() {
  return BADGES.filter((b) => b.test(state)).map((b) => b.id);
}

function renderBadges() {
  const grid = $("#badges-grid");
  grid.innerHTML = "";
  const earned = earnedBadgeIds();
  BADGES.forEach((b) => {
    const card = el("div", "badge" + (earned.includes(b.id) ? " is-earned" : ""));
    card.appendChild(el("div", "badge-name", esc(b.name)));
    card.appendChild(el("div", "badge-desc", esc(b.desc)));
    grid.appendChild(card);
  });
}

/* ---------- Export & réinitialisation ---------- */

$("#btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cacou-registre.json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Le registre a été exporté. Conservez-le en lieu sûr.");
});

$("#btn-reset").addEventListener("click", () => {
  if (!confirm("Brûler l'intégralité des archives ? Cette décision est irrévocable.")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

/* ---------- Légende Bristol ---------- */

function renderBristolLegend() {
  const list = $("#bristol-legend");
  list.innerHTML = "";
  BRISTOL.forEach((b) => {
    const li = el("li");
    li.appendChild(el("span", "bl-type", `Type ${roman(b.n)}`));
    li.appendChild(el("span", "bl-desc", `${esc(b.desc)} <em>— ${esc(b.verdict)}.</em>`));
    list.appendChild(li);
  });
}

$("#bristol-help").addEventListener("click", () => { $("#modal-bristol").hidden = false; });
$("#bristol-close").addEventListener("click", () => { $("#modal-bristol").hidden = true; });

/* ---------- Navigation ---------- */

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
  document.querySelectorAll(".nav-link").forEach((n) => n.classList.remove("is-active"));
  $(`#view-${name}`).classList.add("is-active");
  document.querySelector(`.nav-link[data-view="${name}"]`).classList.add("is-active");
  if (name === "carte") setTimeout(() => map.invalidateSize(), 50);
  if (name === "cercle") {
    $("#cercle-badge").hidden = true;
  }
}

document.querySelectorAll(".nav-link[data-view]").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

/* fermeture des modales au clic sur le fond */
document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop && backdrop.id !== "modal-onboard") backdrop.hidden = true;
  });
});

/* ---------- L'Acte d'enregistrement (assistant de création) ---------- */

const wizard = {
  step: 0, name: "", lignee: null, vocation: null, guilde: null,
  symbol: null, color: null, coiffe: null, visage: null, skills: null,
};

const WIZARD_STEPS = [
  { title: "Acte d'enregistrement", sub: "Avant toute chose, sous quel nom la postérité doit-elle vous connaître ?" },
  { title: "Votre lignée", sub: "Faites défiler les maisons. On ne choisit pas ses entrailles ; on choisit d'en être fier." },
  { title: "Votre vocation", sub: "Tout personnage a une classe. La vôtre ne fait pas exception." },
  { title: "Votre guilde", sub: "Dites-moi à quelle heure vous officiez, je vous dirai qui vous êtes." },
  { title: "Vos compétences", sub: "Évaluez-vous avec honnêteté. L'expérience fera le reste." },
  { title: "Votre effigie", sub: "Le portrait officiel qui ornera vos actes et votre correspondance." },
];

/* carrousel façon écran de sélection de personnage : flèches, points, glissement */
function carousel(items, startId, renderSlide, onChange) {
  let idx = Math.max(0, items.findIndex((i) => i.id === startId));
  const box = el("div", "carousel-box");
  const row = el("div", "carousel");
  const prev = el("button", "car-arrow", "‹"); prev.type = "button"; prev.setAttribute("aria-label", "Précédent");
  const next = el("button", "car-arrow", "›"); next.type = "button"; next.setAttribute("aria-label", "Suivant");
  const stage = el("div", "car-stage");
  const dots = el("div", "car-dots");
  items.forEach(() => dots.appendChild(el("span", "car-dot")));
  function update(dir) {
    stage.innerHTML = "";
    const slide = renderSlide(items[idx]);
    if (dir > 0) slide.classList.add("slide-left");
    if (dir < 0) slide.classList.add("slide-right");
    stage.appendChild(slide);
    [...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === idx));
    onChange(items[idx].id);
  }
  prev.addEventListener("click", () => { idx = (idx - 1 + items.length) % items.length; update(-1); });
  next.addEventListener("click", () => { idx = (idx + 1) % items.length; update(1); });
  let x0 = null;
  stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (dx > 40) prev.click(); else if (dx < -40) next.click();
    x0 = null;
  }, { passive: true });
  row.appendChild(prev); row.appendChild(stage); row.appendChild(next);
  box.appendChild(row); box.appendChild(dots);
  update(0);
  return box;
}

function characterSlide(item, withTrait) {
  const slide = el("div", "car-slide");
  slide.appendChild(el("div", "car-emblem", emblemSvg(item.id)));
  slide.appendChild(el("div", "choice-name", esc(item.name)));
  slide.appendChild(el("div", "choice-desc", esc(item.desc)));
  if (withTrait && item.trait) slide.appendChild(el("div", "choice-trait", esc(item.trait)));
  return slide;
}

function renderWizardStep() {
  const stepDef = WIZARD_STEPS[wizard.step];
  $("#wizard-title").textContent = stepDef.title;
  $("#wizard-sub").textContent = stepDef.sub;
  $("#wizard-back").style.visibility = wizard.step === 0 ? "hidden" : "visible";
  $("#wizard-next").textContent = wizard.step === WIZARD_STEPS.length - 1 ? "Parapher l'acte" : "Continuer";

  const body = $("#wizard-body");
  body.innerHTML = "";

  if (wizard.step === 0) {
    const input = el("input");
    input.type = "text"; input.id = "onboard-name"; input.maxLength = 24;
    input.placeholder = "Ex. : A. de Selle"; input.autocomplete = "off";
    input.value = wizard.name;
    input.addEventListener("input", () => { wizard.name = input.value; });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#wizard-next").click(); } });
    body.appendChild(input);
    setTimeout(() => input.focus(), 50);
  } else if (wizard.step === 1) {
    body.appendChild(carousel(LIGNEES, wizard.lignee || LIGNEES[0].id, (i) => characterSlide(i, true), (id) => { wizard.lignee = id; }));
  } else if (wizard.step === 2) {
    body.appendChild(carousel(VOCATIONS, wizard.vocation || VOCATIONS[0].id, (i) => characterSlide(i), (id) => { wizard.vocation = id; }));
  } else if (wizard.step === 3) {
    body.appendChild(carousel(GUILDES, wizard.guilde || GUILDES[0].id, (i) => characterSlide(i), (id) => { wizard.guilde = id; }));
  } else if (wizard.step === 4) {
    if (!wizard.skills) {
      wizard.skills = {};
      SKILLS.forEach((s) => { wizard.skills[s.id] = 2; });
    }
    SKILLS.forEach((s) => {
      const row = el("div", "skill-row");
      const label = el("div", "skill-label");
      label.appendChild(el("div", "skill-name", esc(s.name)));
      label.appendChild(el("div", "skill-desc", esc(s.desc)));
      row.appendChild(label);
      const picker = el("div", "pip-picker");
      const refresh = () => {
        [...picker.children].forEach((b, i) => {
          b.textContent = i < wizard.skills[s.id] ? "◆" : "◇";
          b.classList.toggle("is-on", i < wizard.skills[s.id]);
        });
      };
      for (let i = 1; i <= 5; i++) {
        const b = el("button", "pip-btn");
        b.type = "button"; b.setAttribute("aria-label", `${s.name} : ${i} sur 5`);
        b.addEventListener("click", () => { wizard.skills[s.id] = i; refresh(); });
        picker.appendChild(b);
      }
      refresh();
      row.appendChild(picker);
      body.appendChild(row);
    });
  } else {
    if (!wizard.symbol) wizard.symbol = BLASON_SYMBOLS[0];
    if (!wizard.color) wizard.color = BLASON_COLORS[0].hex;
    if (!wizard.coiffe) wizard.coiffe = COIFFES[0].id;
    if (!wizard.visage) wizard.visage = VISAGES[0].id;

    const shop = el("div", "effigie-shop");
    const preview = el("div", "effigie-preview");
    const refreshPreview = () => { preview.innerHTML = portraitSvg(wizard.coiffe, wizard.visage, wizard.color); };
    const rows = el("div", "effigie-rows");

    const cycleRow = (kind, options, get, set) => {
      const row = el("div", "opt-row");
      row.appendChild(el("span", "opt-kind", kind));
      const left = el("button", "opt-arrow", "‹"); left.type = "button";
      const value = el("span", "opt-value");
      const right = el("button", "opt-arrow", "›"); right.type = "button";
      const refresh = () => {
        const cur = options.find((o) => o.id === get());
        value.textContent = cur ? cur.name : "—";
        refreshPreview();
      };
      const move = (d) => {
        const i = options.findIndex((o) => o.id === get());
        set(options[(i + d + options.length) % options.length].id);
        refresh();
      };
      left.addEventListener("click", () => move(-1));
      right.addEventListener("click", () => move(1));
      row.appendChild(left); row.appendChild(value); row.appendChild(right);
      refresh();
      return row;
    };

    rows.appendChild(cycleRow("Couvre-chef", COIFFES, () => wizard.coiffe, (v) => { wizard.coiffe = v; }));
    rows.appendChild(cycleRow("Visage", VISAGES, () => wizard.visage, (v) => { wizard.visage = v; }));

    const symRow = el("div", "opt-row");
    symRow.appendChild(el("span", "opt-kind", "Sceau"));
    const symGrid = el("div", "symbol-grid");
    symGrid.style.marginBottom = "0";
    BLASON_SYMBOLS.forEach((s) => {
      const b = el("button", "symbol-btn" + (wizard.symbol === s ? " is-on" : ""), esc(s) + "︎");
      b.type = "button";
      b.addEventListener("click", () => {
        wizard.symbol = s;
        [...symGrid.children].forEach((c) => c.classList.remove("is-on"));
        b.classList.add("is-on");
      });
      symGrid.appendChild(b);
    });
    symRow.appendChild(symGrid);
    rows.appendChild(symRow);

    const colRow = el("div", "opt-row");
    colRow.appendChild(el("span", "opt-kind", "Encre"));
    const colGrid = el("div", "color-grid");
    colGrid.style.marginBottom = "0";
    BLASON_COLORS.forEach((c) => {
      const b = el("button", "color-btn" + (wizard.color === c.hex ? " is-on" : ""));
      b.type = "button"; b.title = c.name; b.style.background = c.hex;
      b.addEventListener("click", () => {
        wizard.color = c.hex;
        [...colGrid.children].forEach((x) => x.classList.remove("is-on"));
        b.classList.add("is-on");
        refreshPreview();
      });
      colGrid.appendChild(b);
    });
    colRow.appendChild(colGrid);
    rows.appendChild(colRow);

    const lig = LIGNEES.find((x) => x.id === wizard.lignee);
    const voc = VOCATIONS.find((x) => x.id === wizard.vocation);
    const gui = GUILDES.find((x) => x.id === wizard.guilde);
    rows.appendChild(el("p", "wizard-summary",
      `${esc(wizard.name || "?")}, ${esc(lig ? lig.name : "?")}, ${esc(voc ? voc.name : "?")}, membre de ${esc(gui ? gui.name : "?")}.`));

    refreshPreview();
    shop.appendChild(preview);
    shop.appendChild(rows);
    body.appendChild(shop);
  }
}

function openWizard() {
  if (state.profile) {
    wizard.name = state.profile.name || "";
    wizard.lignee = state.profile.lignee || null;
    wizard.vocation = state.profile.vocation || null;
    wizard.guilde = state.profile.guilde || null;
    if (state.profile.blason) { wizard.symbol = state.profile.blason.s; wizard.color = state.profile.blason.c; }
    if (state.profile.portrait) { wizard.coiffe = state.profile.portrait.coiffe; wizard.visage = state.profile.portrait.visage; }
    if (state.profile.skills) wizard.skills = Object.assign({}, state.profile.skills);
  }
  wizard.step = 0;
  renderWizardStep();
  $("#modal-onboard").hidden = false;
}

$("#wizard-back").addEventListener("click", () => {
  if (wizard.step > 0) { wizard.step--; renderWizardStep(); }
});

$("#wizard-next").addEventListener("click", () => {
  if (wizard.step === 0 && !wizard.name.trim()) return toast("Un nom, je vous prie. L'anonymat n'a pas cours ici.");
  if (wizard.step < WIZARD_STEPS.length - 1) {
    wizard.step++;
    renderWizardStep();
    return;
  }
  /* paraphe final */
  const isNew = !state.profile;
  state.profile = {
    id: (state.profile && state.profile.id) || newId("u"),
    name: wizard.name.trim(),
    lignee: wizard.lignee,
    vocation: wizard.vocation,
    guilde: wizard.guilde,
    blason: { s: wizard.symbol, c: wizard.color },
    portrait: { coiffe: wizard.coiffe, visage: wizard.visage },
    skills: Object.assign({}, wizard.skills),
  };
  saveState();
  $("#modal-onboard").hidden = true;
  renderAll();
  handleIncomingLinks();
  if (isNew) {
    toast(`Bienvenue, ${state.profile.name}, ${currentTitle()}. Le registre vous attendait.`);
    setTimeout(() => {
      if (!state.incomingSeen && $("#modal-entry").hidden) {
        state.incomingSeen = true;
        saveState();
        $("#cercle-badge").hidden = false;
        showTelegram(incomingTelegramText(state.profile.name));
      }
    }, 900);
  } else {
    toast("L'acte a été mis à jour. Le greffe vous salue.");
  }
});

/* ---------- Fiche de personnage ---------- */

function renderProfil() {
  const box = $("#profil-card");
  if (!box) return;
  box.innerHTML = "";
  if (!state.profile) return;
  const p = state.profile;
  const info = levelInfo(state.xp || 0);

  const head = el("div", "profil-head");
  head.appendChild(el("div", "profil-crest", profilePortraitSvg()));
  const idBlock = el("div");
  idBlock.appendChild(el("div", "profil-name", esc(p.name)));
  idBlock.appendChild(el("div", "profil-titre", esc(info.titre)));
  idBlock.appendChild(el("div", "profil-niveau",
    `Niveau ${info.niveau} — ${state.xp || 0} points d'expérience`));
  const track = el("div", "xp-track");
  const fill = el("div", "xp-fill");
  if (info.next) {
    const span = info.next.xp - info.floor;
    fill.style.width = `${Math.min(100, Math.round((((state.xp || 0) - info.floor) / span) * 100))}%`;
  } else {
    fill.style.width = "100%";
  }
  track.appendChild(fill);
  idBlock.appendChild(track);
  idBlock.appendChild(el("div", "xp-caption", info.next
    ? `Encore ${info.next.xp - (state.xp || 0)} points avant le rang de ${esc(info.next.titre)}.`
    : "Le sommet est atteint. Il ne reste qu'à régner."));
  head.appendChild(idBlock);
  box.appendChild(head);

  const attrs = el("div", "profil-attrs");
  const lig = LIGNEES.find((x) => x.id === p.lignee);
  const voc = VOCATIONS.find((x) => x.id === p.vocation);
  const gui = GUILDES.find((x) => x.id === p.guilde);
  [["Lignée", lig, true], ["Vocation", voc, false], ["Guilde", gui, false]].forEach(([kind, item, withTrait]) => {
    const card = el("div", "attr-card");
    if (item) {
      const kindRow = el("div", "attr-kind",
        `<span style="float:right;color:var(--accent-deep)">${emblemSvg(item.id, 26)}</span>${kind}`);
      card.appendChild(kindRow);
    } else {
      card.appendChild(el("div", "attr-kind", kind));
    }
    card.appendChild(el("div", "attr-name", esc(item ? item.name : "Non renseigné")));
    if (item) card.appendChild(el("div", "attr-desc", esc(item.desc)));
    if (withTrait && item && item.trait) card.appendChild(el("div", "attr-trait", esc(item.trait)));
    attrs.appendChild(card);
  });
  const feats = el("div", "attr-card");
  feats.appendChild(el("div", "attr-kind", "Hauts faits"));
  feats.appendChild(el("div", "attr-name", `${earnedBadgeIds().length} distinction${earnedBadgeIds().length > 1 ? "s" : ""} sur ${BADGES.length}`));
  feats.appendChild(el("div", "attr-desc", `${state.entries.length} événement${state.entries.length > 1 ? "s" : ""} consignés, ${state.realFriends.length} correspondant${state.realFriends.length > 1 ? "s" : ""} certifiés.`));
  attrs.appendChild(feats);
  box.appendChild(attrs);

  /* compétences : auto-évaluation + acquis de l'expérience */
  box.appendChild(el("h3", "sheet-h3", "Compétences clés"));
  const skillsBox = el("div");
  SKILLS.forEach((s) => {
    const eff = effectiveSkill(s.id);
    const row = el("div", "skill-row");
    const label = el("div", "skill-label");
    label.appendChild(el("div", "skill-name", esc(s.name)));
    label.appendChild(el("div", "skill-desc",
      `Auto-évaluation : ${eff.base}/5${eff.bonus ? ` — acquis sur le terrain : +${eff.bonus}` : ""}`));
    row.appendChild(label);
    const pipsEl = el("div", "pips", pips(eff.total, 10));
    if (eff.bonus) pipsEl.appendChild(el("span", "pip-bonus", `+${eff.bonus}`));
    row.appendChild(pipsEl);
    skillsBox.appendChild(row);
  });
  box.appendChild(skillsBox);

  const actions = el("div", "profil-actions");
  const editBtn = el("button", "btn btn-ghost", "Modifier l'acte");
  editBtn.addEventListener("click", openWizard);
  actions.appendChild(editBtn);
  box.appendChild(actions);
}

/* ---------- Édition de nuit ---------- */

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#theme-toggle").textContent = state.theme === "nuit" ? "☀ Jour" : "☾ Nuit";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === "nuit" ? "#211c15" : "#f4efe4";
}

$("#theme-toggle").addEventListener("click", () => {
  state.theme = state.theme === "nuit" ? "jour" : "nuit";
  saveState();
  applyTheme();
  toast(state.theme === "nuit" ? "Édition de nuit. On baisse la lampe." : "Édition du jour. Bonjour à vous.");
});

/* ---------- Courrier entrant (liens ?ami= et ?tg=) ---------- */

function handleIncomingLinks() {
  const params = new URLSearchParams(location.search);
  let touched = false;

  const ami = params.get("ami");
  if (ami) {
    touched = true;
    addFriendFromCode(ami);
    showView("cercle");
  }

  const tg = params.get("tg");
  if (tg) {
    touched = true;
    try {
      const data = decodeCode(tg);
      if (data && data.text && data.from && data.from.id !== (state.profile && state.profile.id)) {
        if (!state.receivedTelegrams.some((t) => t.id === data.id)) {
          state.receivedTelegrams.unshift({
            id: data.id || newId("t"),
            from: String(data.from.name || "Expéditeur inconnu").slice(0, 24),
            fromId: data.from.id,
            text: String(data.text).slice(0, 600),
            receivedAt: new Date().toISOString(),
          });
          /* l'expéditeur devient correspondant, si ce n'est déjà fait */
          if (data.from.id && data.from.name && !state.realFriends.some((f) => f.id === data.from.id)) {
            state.realFriends.push({ id: data.from.id, name: String(data.from.name).slice(0, 24), addedAt: new Date().toISOString() });
          }
          saveState();
          renderRealFriends();
          renderFeed();
        }
        showTelegram(String(data.text).slice(0, 600));
        $("#cercle-badge").hidden = false;
      }
    } catch (e) {
      toast("Un télégramme est arrivé illisible. Les Postes s'en excusent.");
    }
  }

  if (touched) history.replaceState(null, "", location.pathname);
}

/* ---------- Démarrage ---------- */

function renderAll() {
  renderMarkers();
  renderJournal();
  renderFriends();
  renderRealFriends();
  renderVisite();
  renderFeed();
  renderStats();
  renderBadges();
  renderProfil();
  renderQuest();
}

$("#levelup-close").addEventListener("click", () => { $("#modal-levelup").hidden = true; });

renderBristolLegend();
applyTheme();
renderAll();

if (!state.profile || !state.profile.lignee || !state.profile.skills || !state.profile.portrait) {
  /* nouvel arrivant, ou profil d'avant la grande réforme du greffe */
  openWizard();
} else {
  handleIncomingLinks();
  if (state.entries.length && state.entries[0].lat) {
    map.setView([state.entries[0].lat, state.entries[0].lng], 12);
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* hors ligne indisponible, tant pis */ });
}
