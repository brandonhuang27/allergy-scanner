// Reference list of allergens the user can pick from, with the other names
// each one appears under on ingredient labels. This list is sent to Claude with
// every scan so matching is grounded in known names rather than guesswork.
//
// Safety bias: when in doubt, a name goes in `possible` rather than being left
// out. A false alarm is an inconvenience; a missed allergen can be dangerous.

export type AllergenId =
  | "milk"
  | "eggs"
  | "peanuts"
  | "tree-nuts"
  | "soy"
  | "wheat"
  | "gluten"
  | "fish"
  | "shellfish"
  | "sesame";

export type LanguageCode = "es" | "fr" | "de" | "it" | "pt" | "ja" | "zh" | "ko";

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
};

export interface Allergen {
  id: AllergenId;
  label: string;
  emoji: string;
  /** English names that mean the label definitely contains this allergen. */
  names: string[];
  /** The same, in other languages. Not exhaustive: Claude also translates. */
  translations: Partial<Record<LanguageCode, string[]>>;
  /** Ingredients that may or may not contain it, depending on the source. */
  possible: string[];
  /** Another allergen whose names all count for this one too. */
  includes?: AllergenId[];
  /** Caveats Claude should keep in mind when matching. */
  notes?: string;
}

export const ALLERGENS: Allergen[] = [
  {
    id: "milk",
    label: "Milk",
    emoji: "🥛",
    names: [
      "milk", "skim milk", "milk powder", "milk solids", "condensed milk",
      "evaporated milk", "buttermilk", "cream", "sour cream", "butter",
      "butterfat", "butter oil", "ghee", "cheese", "curd", "yogurt", "kefir",
      "paneer", "quark", "casein", "caseinate", "sodium caseinate",
      "calcium caseinate", "whey", "whey protein", "lactose", "lactalbumin",
      "lactoglobulin", "milk protein", "lactitol (E966)",
    ],
    translations: {
      es: ["leche", "lácteos", "leche en polvo", "nata", "crema", "mantequilla", "queso", "suero de leche", "lactosa", "caseína"],
      fr: ["lait", "lait en poudre", "crème", "beurre", "fromage", "lactosérum", "petit-lait", "lactose", "caséine"],
      de: ["Milch", "Milchpulver", "Magermilch", "Sahne", "Rahm", "Butter", "Butterreinfett", "Käse", "Molke", "Laktose", "Milchzucker", "Kasein"],
      it: ["latte", "latte in polvere", "panna", "burro", "formaggio", "siero di latte", "lattosio", "caseina"],
      pt: ["leite", "leite em pó", "nata", "creme de leite", "manteiga", "queijo", "soro de leite", "lactose", "caseína"],
      ja: ["乳", "牛乳", "乳成分", "乳製品", "脱脂粉乳", "生クリーム", "バター", "チーズ", "ホエイ", "乳糖"],
      zh: ["牛奶", "奶", "乳", "奶粉", "乳粉", "奶油", "黄油", "奶酪", "乳清", "乳糖"],
      ko: ["우유", "유제품", "분유", "버터", "치즈", "유청", "유당"],
    },
    possible: [
      "margarine", "chocolate", "caramel", "nougat", "natural flavor",
      "lactic acid starter culture", "high-protein flavoring",
    ],
    notes:
      "Cocoa butter, coconut milk and calcium lactate are not milk. Lactic acid is usually not dairy-derived.",
  },
  {
    id: "eggs",
    label: "Eggs",
    emoji: "🥚",
    names: [
      "egg", "eggs", "egg white", "egg yolk", "dried egg", "powdered egg",
      "albumin", "albumen", "ovalbumin", "ovomucoid", "ovovitellin", "livetin",
      "lysozyme (E1105)", "mayonnaise", "meringue",
    ],
    translations: {
      es: ["huevo", "huevos", "clara de huevo", "yema", "albúmina", "ovoproductos"],
      fr: ["œuf", "oeuf", "œufs", "blanc d'œuf", "jaune d'œuf", "albumine"],
      de: ["Ei", "Eier", "Hühnerei", "Vollei", "Eigelb", "Eidotter", "Eiklar", "Eiweiß"],
      it: ["uovo", "uova", "tuorlo", "albume", "albumina"],
      pt: ["ovo", "ovos", "gema", "clara de ovo", "albumina"],
      ja: ["卵", "鶏卵", "たまご", "卵白", "卵黄", "全卵"],
      zh: ["鸡蛋", "蛋", "蛋白", "蛋黄", "全蛋粉"],
      ko: ["계란", "달걀", "난백", "난황", "전란"],
    },
    possible: ["lecithin (E322)", "egg wash", "glaze", "fresh pasta", "binder"],
    notes:
      'German "Eiweiß" means egg white in an ingredient list, but just "protein" in a nutrition table; ignore it in nutrition tables.',
  },
  {
    id: "peanuts",
    label: "Peanuts",
    emoji: "🥜",
    names: [
      "peanut", "peanuts", "peanut butter", "peanut flour", "peanut oil",
      "groundnut", "groundnuts", "arachis oil", "arachis hypogaea",
      "monkey nuts", "beer nuts",
    ],
    translations: {
      es: ["cacahuete", "cacahuate", "maní", "aceite de cacahuete"],
      fr: ["arachide", "arachides", "cacahuète", "huile d'arachide"],
      de: ["Erdnuss", "Erdnüsse", "Erdnussöl"],
      it: ["arachidi", "arachide", "olio di arachidi"],
      pt: ["amendoim", "óleo de amendoim"],
      ja: ["落花生", "ピーナッツ", "らっかせい"],
      zh: ["花生", "花生油", "花生酱"],
      ko: ["땅콩", "땅콩버터"],
    },
    possible: ["vegetable oil", "mixed nuts", "satay sauce", "mole sauce", "nut butter"],
  },
  {
    id: "tree-nuts",
    label: "Tree nuts",
    emoji: "🌰",
    names: [
      "almond", "cashew", "walnut", "pecan", "hazelnut", "filbert", "pistachio",
      "macadamia", "brazil nut", "pine nut", "chestnut", "praline", "marzipan",
      "almond paste", "gianduja", "frangipane", "nut butter", "nut oil",
    ],
    translations: {
      es: ["almendra", "anacardo", "nuez", "nueces", "nuez pecana", "avellana", "pistacho", "piñón", "castaña", "frutos de cáscara"],
      fr: ["amande", "noix de cajou", "noix", "noix de pécan", "noisette", "pistache", "pignon", "fruits à coque"],
      de: ["Mandel", "Mandeln", "Cashew", "Walnuss", "Pekannuss", "Haselnuss", "Pistazie", "Macadamia", "Schalenfrüchte", "Nüsse"],
      it: ["mandorla", "mandorle", "anacardo", "noce", "noci", "nocciola", "nocciole", "pistacchio", "pinoli", "frutta a guscio"],
      pt: ["amêndoa", "castanha de caju", "noz", "nozes", "avelã", "pistache", "castanha-do-pará", "frutos de casca rija"],
      ja: ["アーモンド", "カシューナッツ", "くるみ", "クルミ", "ヘーゼルナッツ", "ピスタチオ", "マカダミアナッツ", "ナッツ類"],
      zh: ["杏仁", "腰果", "核桃", "胡桃", "榛子", "开心果", "夏威夷果", "坚果"],
      ko: ["아몬드", "캐슈넛", "호두", "헤이즐넛", "피스타치오", "잣", "견과류"],
    },
    possible: ["natural flavor", "nougat", "pesto", "amaretto", "mixed nuts"],
    notes:
      'Coconut and nutmeg are not usually treated as tree nuts. "杏仁" can mean almond or apricot kernel; flag it either way.',
  },
  {
    id: "soy",
    label: "Soy",
    emoji: "🫘",
    names: [
      "soy", "soya", "soybean", "soy protein", "soy protein isolate",
      "soy flour", "soy lecithin", "soy sauce", "shoyu", "tamari", "miso",
      "tofu", "tempeh", "natto", "edamame", "textured vegetable protein",
      "hydrolyzed soy protein",
    ],
    translations: {
      es: ["soja", "soya", "lecitina de soja", "salsa de soja"],
      fr: ["soja", "lécithine de soja", "sauce soja"],
      de: ["Soja", "Sojabohnen", "Sojalecithin", "Sojasoße"],
      it: ["soia", "lecitina di soia", "salsa di soia"],
      pt: ["soja", "lecitina de soja", "molho de soja"],
      ja: ["大豆", "醤油", "しょうゆ", "味噌", "みそ", "豆腐", "大豆レシチン"],
      zh: ["大豆", "黄豆", "酱油", "豆腐", "大豆卵磷脂"],
      ko: ["대두", "콩", "간장", "된장", "두부"],
    },
    possible: [
      "lecithin (E322)", "vegetable protein", "hydrolyzed vegetable protein",
      "vegetable oil", "natural flavor", "vegetable broth",
    ],
    notes:
      "Highly refined soybean oil is often tolerated, but the user should decide; list it as possible.",
  },
  {
    id: "wheat",
    label: "Wheat",
    emoji: "🌾",
    names: [
      "wheat", "wheat flour", "whole wheat", "durum", "semolina", "spelt",
      "farro", "einkorn", "emmer", "kamut", "khorasan", "bulgur", "couscous",
      "seitan", "wheat germ", "wheat bran", "wheat starch", "graham flour",
      "triticale", "breadcrumbs",
    ],
    translations: {
      es: ["trigo", "harina de trigo", "sémola", "espelta", "pan rallado"],
      fr: ["blé", "froment", "farine de blé", "semoule", "épeautre", "chapelure"],
      de: ["Weizen", "Weizenmehl", "Hartweizengrieß", "Grieß", "Dinkel", "Paniermehl"],
      it: ["frumento", "grano", "farina di frumento", "farina di grano", "semola", "farro", "pangrattato"],
      pt: ["trigo", "farinha de trigo", "sêmola", "espelta"],
      ja: ["小麦", "小麦粉", "こむぎ", "パン粉"],
      zh: ["小麦", "面粉", "小麦粉", "面包糠"],
      ko: ["밀", "밀가루", "소맥분", "빵가루"],
    },
    possible: [
      "flour (unspecified)", "starch", "modified food starch", "glucose syrup",
      "cereal", "hydrolyzed vegetable protein", "soy sauce",
    ],
    notes: "Most soy sauce is brewed with wheat; tamari is often wheat-free but not always.",
  },
  {
    id: "gluten",
    label: "Gluten",
    emoji: "🍞",
    includes: ["wheat"],
    names: [
      "gluten", "barley", "rye", "malt", "malt extract", "malt flavoring",
      "malt vinegar", "brewer's yeast", "beer",
    ],
    translations: {
      es: ["gluten", "cebada", "centeno", "malta", "extracto de malta"],
      fr: ["gluten", "orge", "seigle", "malt", "extrait de malt"],
      de: ["Gluten", "Gerste", "Roggen", "Malz", "Gerstenmalzextrakt"],
      it: ["glutine", "orzo", "segale", "malto", "estratto di malto"],
      pt: ["glúten", "cevada", "centeio", "malte"],
      ja: ["グルテン", "大麦", "ライ麦", "麦芽"],
      zh: ["麸质", "麩質", "面筋", "大麦", "黑麦", "麦芽"],
      ko: ["글루텐", "보리", "호밀", "맥아"],
    },
    possible: ["oats", "oat flour", "avena", "avoine", "Hafer", "燕麦", "귀리", "dextrin", "seasoning"],
    notes:
      "Oats are often cross-contaminated unless labeled gluten-free. Everything listed under wheat also counts as gluten.",
  },
  {
    id: "fish",
    label: "Fish",
    emoji: "🐟",
    names: [
      "fish", "anchovy", "anchovies", "cod", "salmon", "tuna", "tilapia",
      "pollock", "haddock", "sardine", "mackerel", "trout", "bonito",
      "fish sauce", "fish oil", "fish gelatin", "surimi", "roe", "caviar",
    ],
    translations: {
      es: ["pescado", "anchoa", "bacalao", "salmón", "atún", "sardina", "caballa"],
      fr: ["poisson", "anchois", "morue", "cabillaud", "saumon", "thon", "sardine", "maquereau"],
      de: ["Fisch", "Sardelle", "Kabeljau", "Lachs", "Thunfisch", "Sardine", "Makrele"],
      it: ["pesce", "acciughe", "alici", "merluzzo", "salmone", "tonno", "sardine", "sgombro"],
      pt: ["peixe", "anchova", "bacalhau", "salmão", "atum", "sardinha", "cavala"],
      ja: ["魚", "魚介類", "かつお", "かつお節", "さけ", "さば", "いわし", "魚醤"],
      zh: ["鱼", "鱼露", "三文鱼", "金枪鱼", "鳕鱼", "鲣鱼"],
      ko: ["생선", "어류", "멸치", "연어", "고등어", "참치", "액젓"],
    },
    possible: ["worcestershire sauce", "dashi", "caesar dressing", "seafood flavoring", "omega-3", "gelatin"],
  },
  {
    id: "shellfish",
    label: "Shellfish",
    emoji: "🦐",
    names: [
      "shellfish", "crustaceans", "shrimp", "prawn", "crab", "lobster",
      "crayfish", "crawfish", "langoustine", "krill", "mollusks", "clam",
      "mussel", "oyster", "oyster sauce", "scallop", "squid", "calamari",
      "octopus", "cuttlefish", "snail",
    ],
    translations: {
      es: ["marisco", "mariscos", "crustáceos", "camarón", "gamba", "langostino", "cangrejo", "langosta", "almeja", "mejillón", "ostra", "calamar", "pulpo", "moluscos"],
      fr: ["fruits de mer", "crustacés", "crevette", "crabe", "homard", "langouste", "moule", "huître", "coquille Saint-Jacques", "calmar", "poulpe", "mollusques"],
      de: ["Krebstiere", "Garnele", "Krabbe", "Hummer", "Languste", "Muschel", "Auster", "Jakobsmuschel", "Tintenfisch", "Weichtiere"],
      it: ["crostacei", "gamberi", "gamberetti", "granchio", "aragosta", "cozze", "vongole", "ostriche", "calamari", "polpo", "molluschi"],
      pt: ["marisco", "crustáceos", "camarão", "caranguejo", "lagosta", "mexilhão", "ostra", "lula", "polvo", "moluscos"],
      ja: ["甲殻類", "えび", "エビ", "かに", "カニ", "貝", "あさり", "かき", "ほたて", "いか", "たこ"],
      zh: ["甲壳类", "虾", "蟹", "龙虾", "贝", "蚝油", "牡蛎", "扇贝", "鱿鱼", "章鱼"],
      ko: ["갑각류", "새우", "게", "랍스터", "조개", "굴", "홍합", "가리비", "오징어", "문어"],
    },
    possible: ["seafood", "seafood flavoring", "fish sauce", "shrimp paste", "glucosamine", "bouillabaisse"],
    notes:
      'Includes both crustaceans (shrimp, crab) and mollusks (clams, squid). Some people react to only one group; flag both.',
  },
  {
    id: "sesame",
    label: "Sesame",
    emoji: "⚪",
    names: [
      "sesame", "sesame seed", "sesame oil", "sesame paste", "tahini", "tahina",
      "halvah", "gomasio", "benne", "til", "sesamol",
    ],
    translations: {
      es: ["sésamo", "ajonjolí"],
      fr: ["sésame"],
      de: ["Sesam", "Sesamöl"],
      it: ["sesamo"],
      pt: ["sésamo", "gergelim"],
      ja: ["ごま", "ゴマ", "胡麻", "ごま油"],
      zh: ["芝麻", "麻油", "芝麻酱"],
      ko: ["참깨", "깨", "참기름"],
    },
    possible: ["hummus", "spices", "natural flavor", "za'atar", "furikake", "dukkah"],
  },
];

/**
 * Phrases that warn about cross-contact. These never mean "contains", but the
 * matching allergen should be listed as possible.
 */
export const PRECAUTIONARY_PHRASES: Record<"en" | LanguageCode, string[]> = {
  en: ["may contain", "traces of", "made in a facility that", "processed on shared equipment", "produced in a factory that also handles"],
  es: ["puede contener", "trazas de", "elaborado en una planta que"],
  fr: ["peut contenir", "traces de", "fabriqué dans un atelier qui"],
  de: ["kann Spuren von", "Spuren von", "kann enthalten"],
  it: ["può contenere", "tracce di", "prodotto in uno stabilimento che"],
  pt: ["pode conter", "vestígios de", "contém traços de"],
  ja: ["製造工場では", "同じ製造ライン", "混入の可能性"],
  zh: ["可能含有", "同一生产线", "微量"],
  ko: ["같은 제조시설", "혼입 가능성", "함유 가능"],
};

const BY_ID = new Map(ALLERGENS.map((a) => [a.id, a]));

export function getAllergen(id: AllergenId): Allergen {
  const allergen = BY_ID.get(id);
  if (!allergen) throw new Error(`Unknown allergen: ${id}`);
  return allergen;
}

/** All names (English and translated) that mean "contains", including `includes`. */
export function allNamesFor(id: AllergenId): string[] {
  const allergen = getAllergen(id);
  const own = [...allergen.names, ...Object.values(allergen.translations).flat()];
  const inherited = (allergen.includes ?? []).flatMap(allNamesFor);
  return [...new Set([...own, ...inherited])];
}
