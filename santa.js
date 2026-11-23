// =====================================================================
//  Secret Santa 2026 – settings and the draw.
//  Every page (index.html, tree.html, tree-3d.html, gift.html, letter.html,
//  night.html) loads this file, so they all show exactly the same pairs.
//  Edit the settings here only.
// =====================================================================

// Budget per present in euros (15 or 20 – change when decided).
const BUDGET_EUR = 20;

// Everyone taking part, with their wishlist.
// Leave [] if the person has no wishes, e.g.  Ana: ["A good book", "Warm socks"],
// Adding wishes is safe at any time. Renaming, adding, removing or reordering
// people creates a completely new draw.
const WISHLISTS = {
  Primoz: [],
  Ana:    [],
  Tina:   [],
  Miran:  [],
  Jozica: [],
  Jure:   [],
  Mateja: [],
  Nejc:   [],
  Gaja:   [],
  Nela:   [],
};

// Each name in the accusative, as the letter uses it after "za":
// "ti boš Skrivni Božiček za Ano". Add a line here for every new person.
const ACCUSATIVE = {
  Primoz: "Primoža",
  Ana:    "Ano",
  Tina:   "Tino",
  Miran:  "Mirana",
  Jozica: "Jožico",
  Jure:   "Jureta",
  Mateja: "Matejo",
  Nejc:   "Nejca",
  Gaja:   "Gajo",
  Nela:   "Nelo",
};

// Božiček's secret codes. Send each person only their own code in a private
// message: their bauble opens the letter only with that code (upper or lower
// case both work). Anyone who opens this file can read them, so keep it quiet.
const CODES = {
  Primoz: "BNBD",
  Ana:    "MTCV",
  Tina:   "PZGU",
  Miran:  "SZUP",
  Jozica: "DADP",
  Jure:   "BUPV",
  Mateja: "VHDH",
  Nejc:   "DNDP",
  Gaja:   "EPSM",
  Nela:   "NFSF",
};

// Pairs who never draw each other: neither of the two buys a present for the
// other. Use the names exactly as in WISHLISTS. Changing this list can change
// the draw.
const KEEP_APART = [
  ["Primoz", "Ana"],
  ["Tina",   "Nejc"],
  ["Miran",  "Jozica"],
  ["Jure",   "Mateja"],
];

// The draw is fully determined by this text: same text = same pairs on every
// visit and every device. Change it only if you want a completely new draw.
const SEED = "santa-2026-43b13fe2172d5ab3";

// ---------------- The draw (no need to edit below) ----------------

// FNV-1a: turns the seed text into a 32-bit number.
function hashString(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32: small seeded random generator (same seed -> same numbers).
function seededRandom(seed) {
  let a = seed;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle everyone into one big circle: each person gives to the next one,
// and the last gives to the first. With 3+ people this guarantees nobody
// draws themselves and no two people give to each other. A shuffle that puts
// a `keepApart` pair side by side is thrown away and the next one is tried.
function drawGiftCircle(names, seed, keepApart) {
  for (const name of keepApart.flat()) {
    if (!names.includes(name)) throw new Error(`KEEP_APART: "${name}" is not in WISHLISTS.`);
  }
  const apart = (a, b) => keepApart.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const random = seededRandom(hashString(seed));
  const circle = [...names];
  const nextAfter = (i) => circle[(i + 1) % circle.length];
  for (let attempt = 1; ; attempt++) {
    for (let i = circle.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [circle[i], circle[j]] = [circle[j], circle[i]];
    }
    if (circle.every((giver, i) => !apart(giver, nextAfter(i)))) break;
    // Safety stop: with this many failed shuffles the list most likely
    // allows no circle at all.
    if (attempt === 10000) throw new Error("KEEP_APART allows no gift circle. Remove a pair.");
  }
  const giftFor = {};
  circle.forEach((giver, i) => {
    giftFor[giver] = nextAfter(i);
  });
  return giftFor;
}

const PARTICIPANTS = Object.keys(WISHLISTS);
const GIFT_FOR = drawGiftCircle(PARTICIPANTS, SEED, KEEP_APART);

// Who `giver` buys a present for, that name in the accusative ("za Ano"),
// and that person's wishes.
function secretSantaFor(giver) {
  const recipient = GIFT_FOR[giver];
  return {
    recipient,
    recipientAccusative: accusative(recipient),
    wishes: WISHLISTS[recipient],
  };
}

// A name in the accusative ("Ana" → "Ano"); names missing from ACCUSATIVE stay as they are.
function accusative(name) {
  return ACCUSATIVE[name] ?? name;
}

// Whether `code` is `giver`'s secret code. Spaces and upper/lower case don't matter.
function isSecretCode(giver, code) {
  return code.replace(/\s/g, "").toUpperCase() === CODES[giver];
}
