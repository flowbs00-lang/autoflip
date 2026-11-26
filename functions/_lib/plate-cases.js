export const PLATE_RARITIES = Object.freeze({
  ordinary: Object.freeze({ value: 1_000 }),
  unusual: Object.freeze({ value: 5_000 }),
  rare: Object.freeze({ value: 20_000 }),
  ultra: Object.freeze({ value: 100_000 }),
  secret: Object.freeze({ value: 500_000 }),
  priceless: Object.freeze({ value: 10_000_000 })
});

export const PLATE_CASES = Object.freeze([
  Object.freeze({ id: "standard", price: 3_000, level: 1, weights: Object.freeze([["ordinary", 70], ["unusual", 25], ["rare", 5]]) }),
  Object.freeze({ id: "rare", price: 10_000, level: 3, weights: Object.freeze([["ordinary", 45], ["unusual", 38], ["rare", 14], ["ultra", 3]]) }),
  Object.freeze({ id: "secret", price: 30_000, level: 6, weights: Object.freeze([["ordinary", 25], ["unusual", 38], ["rare", 27], ["ultra", 9], ["secret", 1]]) }),
  Object.freeze({ id: "collector", price: 70_000, level: 8, weights: Object.freeze([["ordinary", 10], ["unusual", 30], ["rare", 35], ["ultra", 20], ["secret", 5]]) }),
  Object.freeze({ id: "legend", price: 150_000, level: 10, weights: Object.freeze([["ordinary", 5], ["unusual", 20], ["rare", 35], ["ultra", 28], ["secret", 11.9], ["priceless", 0.1]]) })
]);

const LETTERS = [..."АВЕКМНОРСТУХ"];
const PRICELESS = ["А777МР", "Е777КХ", "А777АА", "В777ОР", "О777ОО"];
// Keep the very recognizable ЕКХ/АМР combinations genuinely scarce.  The
// regular case pool is intentionally broad so players see different letter
// combinations instead of ООО/ААА/ЕЕЕ on every roll.
const COMMON_COMBOS = Object.freeze(Array.from({ length: LETTERS.length ** 3 }, (_, value) => {
  const first = LETTERS[Math.floor(value / (LETTERS.length ** 2)) % LETTERS.length];
  const second = LETTERS[Math.floor(value / LETTERS.length) % LETTERS.length];
  const third = LETTERS[value % LETTERS.length];
  return first + second + third;
}).filter((value) => new Set(value).size > 1));
const FEATURED_COMBOS = Object.freeze([
  "ЕТР", "АВР", "ЕТХ", "ТОА", "АВЕ", "ВЕА", "ВЕР", "РЕВ", "РЕА", "РОТ", "ТОР", "ТРО", "ТЕА", "ОТА",
  "КЕВ", "МЕТ", "МОР", "НЕТ", "СТА", "СТР", "СЕР", "ТЕР", "УРА", "ХОР", "ХЕТ", "АРТ", "ВЕТ", "ВОР",
  "РАК", "КАТ", "КОТ", "КОР", "МАТ", "МАР", "МЕР", "МАК", "НАР", "НОТ", "ОРТ", "ОРА", "РУС", "САМ",
  "СЕТ", "ТАМ", "ТЕМ", "ТУА", "УХА", "ХРА", "АЕК", "ЕКА", "КВА"
]);
const SIGNATURE_COMBOS = Object.freeze(["ЕКХ", "АМР", "МРЕ", "КХЕ", "ОРЕ", "РМТ", "АХМ", "ЕСР"]);
const REGION_CITIES = Object.freeze({
  "77":"Москва","97":"Москва","799":"Москва","78":"Санкт-Петербург","98":"Санкт-Петербург","178":"Санкт-Петербург",
  "52":"Нижний Новгород","152":"Нижний Новгород","66":"Екатеринбург","96":"Екатеринбург","196":"Екатеринбург","43":"Киров",
  "23":"Краснодар","93":"Краснодар","123":"Краснодар","59":"Пермь","81":"Пермь","159":"Пермь","39":"Калининград","91":"Калининград",
  "86":"Сургут","186":"Сургут","75":"Чита","80":"Чита","16":"Казань","116":"Казань","716":"Казань","25":"Владивосток","125":"Владивосток","76":"Ярославль",
  "61":"Ростов","161":"Ростов","761":"Ростов","05":"Махачкала","02":"Уфа","102":"Уфа","702":"Уфа","36":"Воронеж","136":"Воронеж","56":"Оренбург","69":"Тверь","63":"Самара","163":"Самара","763":"Самара"
});
const REGIONS = Object.freeze(Object.entries(REGION_CITIES));

function secureRandom() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 0x1_0000_0000;
}

function index(random, length) {
  return Math.min(length - 1, Math.floor(random() * length));
}

function pick(random, items) {
  return items[index(random, items.length)];
}

function letterCombo(random, pool = COMMON_COMBOS) {
  return pick(random, pool);
}

function formatCombo(combo, digits) {
  return combo[0] + digits + combo.slice(1);
}

function letter(random, excluded = []) {
  const allowed = LETTERS.filter((value) => !excluded.includes(value));
  return pick(random, allowed);
}

function digitsNoPair(random) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = `${index(random, 10)}${index(random, 10)}${index(random, 10)}`;
    if (new Set(value).size === 3 && value[0] !== value[2]) return value;
  }
  return "123";
}

export function rollPlateRarity(weights, randomValue) {
  const roll = Math.max(0, Math.min(0.999999999, Number(randomValue))) * 100;
  let edge = 0;
  for (const [rarity, chance] of weights) {
    edge += Number(chance);
    if (roll < edge) return rarity;
  }
  return weights.at(-1)[0];
}

function plateNumber(rarity, random) {
  let a;
  let b;
  if (rarity === "ordinary") {
    return formatCombo(letterCombo(random), digitsNoPair(random));
  }
  if (rarity === "unusual") {
    return formatCombo(letterCombo(random, random() < 0.7 ? FEATURED_COMBOS : COMMON_COMBOS), pick(random, ["001","112","223","334","445","556","667","778","889"]));
  }
  if (rarity === "rare") {
    const pair = pick(random, ["00","11","22","33","44","55","66","77","88","99"]);
    return formatCombo(letterCombo(random, FEATURED_COMBOS), pair + index(random, 10));
  }
  if (rarity === "ultra") {
    return formatCombo(letterCombo(random, random() < 0.08 ? SIGNATURE_COMBOS : FEATURED_COMBOS), pick(random, ["013","070","101","114","202","303"]));
  }
  if (rarity === "secret") {
    const digits = pick(random, ["111","222","333","444","555","666","888","999"]);
    const combo = letterCombo(random, random() < 0.12 ? SIGNATURE_COMBOS : FEATURED_COMBOS);
    return formatCombo(combo, digits);
  }
  return pick(random, PRICELESS);
}

export function generatePlate(caseConfig, openingId, now = Date.now(), random = secureRandom) {
  const rarity = rollPlateRarity(caseConfig.weights, random());
  const [regionCode, city] = pick(random, REGIONS);
  return {
    id: `plate-${openingId}`,
    openingId,
    number: plateNumber(rarity, random),
    region: { code: regionCode, city, country: "Россия" },
    rarity,
    value: PLATE_RARITIES[rarity].value,
    createdAt: now,
    attachedCarId: null,
    premium: false,
    tradable: true
  };
}

export function plateCaseById(id) {
  return PLATE_CASES.find((item) => item.id === id) || null;
}

export function plateIntegritySignature(plate) {
  return JSON.stringify({
    id: plate?.id,
    openingId: plate?.openingId,
    number: plate?.number,
    region: plate?.region,
    rarity: plate?.rarity,
    value: plate?.value,
    createdAt: plate?.createdAt,
    attachedCarId: plate?.attachedCarId ?? null,
    premium: plate?.premium === true,
    tradable: plate?.tradable !== false
  });
}
