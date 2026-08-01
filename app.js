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
  state.entries.unshift(entry);

  const sendTelegram = $("#entry-telegram").checked;
  if (sendTelegram) state.telegramCount = (state.telegramCount || 0) + 1;

  const before = earnedBadgeIds();
  saveState();
  renderAll();
  $("#modal-entry").hidden = true;

  const after = earnedBadgeIds();
  const fresh = after.filter((id) => !before.includes(id));

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
    `AUCUNE RÉPONSE ATTENDUE STOP FIN`,
  ].join("\n");
}

function telegramShareLink(text) {
  const payload = { v: 1, id: newId("t"), from: { id: state.profile.id, name: state.profile.name }, text, date: new Date().toISOString() };
  return appUrl() + "?tg=" + encodeCode(payload);
}

function cardShareLink() {
  return appUrl() + "?ami=" + encodeCode({ v: 1, id: state.profile.id, name: state.profile.name });
}

function pokeTelegramText(friend, me) {
  return [
    `À : ${friend.name.toUpperCase()}`,
    ``,
    `PENSÉE ÉMUE DEPUIS LE TRÔNE STOP`,
    `VOUS SAUREZ QUOI FAIRE STOP`,
    `SIGNÉ : ${me.toUpperCase()} STOP FIN`,
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
    card.appendChild(el("div", "friend-seal", "Correspondant certifié"));
    card.appendChild(el("div", "friend-name", esc(f.name)));
    card.appendChild(el("div", "friend-stat", `Au registre depuis le ${esc(fmtDate(f.addedAt))}.`));
    const btn = el("button", "btn btn-ghost btn-small", "Adresser un télégramme");
    btn.addEventListener("click", () => {
      state.telegramCount = (state.telegramCount || 0) + 1;
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
  state.realFriends.push({ id: data.id, name: String(data.name).slice(0, 24), addedAt: new Date().toISOString() });
  saveState();
  renderRealFriends();
  toast(`${data.name} rejoint votre Cercle. Qu'on lui porte l'estime due.`);
}

function renderVisite() {
  if (!state.profile) return;
  $("#visite-name").textContent = state.profile.name;
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

/* ---------- Onboarding ---------- */

$("#onboard-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#onboard-name").value.trim();
  if (!name) return;
  state.profile = { name, id: newId("u") };
  saveState();
  $("#modal-onboard").hidden = true;
  renderAll();
  handleIncomingLinks();
  toast(`Bienvenue, ${name}. Le registre vous attendait.`);
  setTimeout(() => {
    if (!state.incomingSeen && $("#modal-entry").hidden) {
      state.incomingSeen = true;
      saveState();
      $("#cercle-badge").hidden = false;
      showTelegram(incomingTelegramText(name));
    }
  }, 900);
});

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
}

renderBristolLegend();
applyTheme();
renderAll();

if (!state.profile) {
  $("#modal-onboard").hidden = false;
} else {
  handleIncomingLinks();
  if (state.entries.length && state.entries[0].lat) {
    map.setView([state.entries[0].lat, state.entries[0].lng], 12);
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* hors ligne indisponible, tant pis */ });
}
