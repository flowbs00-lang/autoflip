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
    a = letter(random); b = letter(random, [a]);
    return a + digitsNoPair(random) + b + letter(random, [a, b]);
  }
  if (rarity === "unusual") {
    a = letter(random); b = letter(random, [a]);
    if (random() < 0.5) return a + pick(random, ["001","112","223","334","445","556","667","778","889"]) + b + letter(random, [a, b]);
    return a + digitsNoPair(random) + b + b;
  }
  if (rarity === "rare") {
    const pair = pick(random, ["00","11","22","33","44","55","66","77","88","99"]);
    a = letter(random); b = letter(random, [a]);
    if (random() < 0.55) return a + pair + index(random, 10) + b + b;
    return a + pick(random, [pair + index(random, 10), index(random, 10) + pair]) + b + a;
  }
  if (rarity === "ultra") {
    if (random() < 0.62) {
      a = pick(random, ["А", "Е"]);
      return a + pick(random, ["013","070","101","114","202","303"]) + (a === "Е" ? "КХ" : "МР");
    }
    a = letter(random); b = letter(random, [a]);
    return a + pick(random, ["010","020","030","040","050","060","070","080","090"]) + b + a;
  }
  if (rarity === "secret") {
    const digits = pick(random, ["111","222","333","444","555","666","888","999"]);
    if (random() < 0.55) {
      a = pick(random, ["А", "Е"]);
      return a + digits + (a === "Е" ? "КХ" : "МР");
    }
    a = letter(random);
    return a + digits + a + a;
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
