import type { AllergenId } from "./allergens";

// Text for the allergy card travelers show to restaurant staff. Translations
// are built in so the card works instantly and without AI.
//
// NEEDS REVIEW: these were written without a native-speaker check. Because
// people will rely on them at restaurants, have a native speaker of each
// language review its entry before relying on the card widely.

export interface CardLanguage {
  code: string;
  /** Name in the language itself, for the picker. */
  nativeName: string;
  /** Name in English, for the picker. */
  englishName: string;
  title: string;
  /** Introduces the list of allergens. */
  intro: string;
  /** Explains that small amounts and cross-contact matter. */
  warning: string;
  closing: string;
  allergens: Record<AllergenId, string>;
}

export const CARD_LANGUAGES: CardLanguage[] = [
  {
    code: "en",
    nativeName: "English",
    englishName: "English",
    title: "Food allergy",
    intro: "I have a serious food allergy. I cannot eat:",
    warning:
      "Even small amounts, or food prepared with the same utensils, oil or surfaces, can cause a serious reaction.",
    closing: "Please check with the kitchen. Thank you!",
    allergens: {
      milk: "milk and dairy products",
      eggs: "eggs",
      peanuts: "peanuts",
      "tree-nuts": "tree nuts (almonds, walnuts, cashews, hazelnuts, etc.)",
      soy: "soy (including soy sauce and tofu)",
      wheat: "wheat",
      gluten: "gluten (wheat, barley, rye)",
      fish: "fish (including fish sauce)",
      shellfish: "shellfish (shrimp, crab, clams, mussels, squid, etc.)",
      sesame: "sesame",
    },
  },
  {
    code: "es",
    nativeName: "Español",
    englishName: "Spanish",
    title: "Alergia alimentaria",
    intro: "Tengo una alergia alimentaria grave. No puedo comer:",
    warning:
      "Incluso pequeñas cantidades, o comida preparada con los mismos utensilios, aceite o superficies, pueden causarme una reacción grave.",
    closing: "Por favor, consulte con la cocina. ¡Gracias!",
    allergens: {
      milk: "leche y productos lácteos",
      eggs: "huevo",
      peanuts: "cacahuetes (maní)",
      "tree-nuts": "frutos secos (almendras, nueces, anacardos, avellanas, etc.)",
      soy: "soja (incluida la salsa de soja y el tofu)",
      wheat: "trigo",
      gluten: "gluten (trigo, cebada, centeno)",
      fish: "pescado (incluida la salsa de pescado)",
      shellfish: "mariscos (gambas, cangrejo, almejas, mejillones, calamares, etc.)",
      sesame: "sésamo (ajonjolí)",
    },
  },
  {
    code: "fr",
    nativeName: "Français",
    englishName: "French",
    title: "Allergie alimentaire",
    intro: "J'ai une allergie alimentaire grave. Je ne peux pas manger :",
    warning:
      "Même de petites quantités, ou des aliments préparés avec les mêmes ustensiles, la même huile ou les mêmes surfaces, peuvent provoquer une réaction grave.",
    closing: "Pourriez-vous vérifier auprès de la cuisine ? Merci !",
    allergens: {
      milk: "lait et produits laitiers",
      eggs: "œufs",
      peanuts: "arachides (cacahuètes)",
      "tree-nuts": "fruits à coque (amandes, noix, noix de cajou, noisettes, etc.)",
      soy: "soja (y compris la sauce soja et le tofu)",
      wheat: "blé",
      gluten: "gluten (blé, orge, seigle)",
      fish: "poisson (y compris la sauce de poisson)",
      shellfish: "crustacés et mollusques (crevettes, crabe, palourdes, moules, calamars, etc.)",
      sesame: "sésame",
    },
  },
  {
    code: "de",
    nativeName: "Deutsch",
    englishName: "German",
    title: "Lebensmittelallergie",
    intro: "Ich habe eine schwere Lebensmittelallergie. Ich darf Folgendes nicht essen:",
    warning:
      "Schon kleine Mengen oder Speisen, die mit denselben Utensilien, demselben Öl oder auf denselben Flächen zubereitet wurden, können eine schwere Reaktion auslösen.",
    closing: "Bitte fragen Sie in der Küche nach. Vielen Dank!",
    allergens: {
      milk: "Milch und Milchprodukte",
      eggs: "Eier",
      peanuts: "Erdnüsse",
      "tree-nuts": "Schalenfrüchte (Mandeln, Walnüsse, Cashewkerne, Haselnüsse usw.)",
      soy: "Soja (auch Sojasoße und Tofu)",
      wheat: "Weizen",
      gluten: "Gluten (Weizen, Gerste, Roggen)",
      fish: "Fisch (auch Fischsoße)",
      shellfish: "Krebs- und Weichtiere (Garnelen, Krabben, Muscheln, Tintenfisch usw.)",
      sesame: "Sesam",
    },
  },
  {
    code: "it",
    nativeName: "Italiano",
    englishName: "Italian",
    title: "Allergia alimentare",
    intro: "Ho una grave allergia alimentare. Non posso mangiare:",
    warning:
      "Anche piccole quantità, o cibi preparati con gli stessi utensili, lo stesso olio o le stesse superfici, possono causarmi una reazione grave.",
    closing: "Per favore, chieda in cucina. Grazie!",
    allergens: {
      milk: "latte e latticini",
      eggs: "uova",
      peanuts: "arachidi",
      "tree-nuts": "frutta a guscio (mandorle, noci, anacardi, nocciole, ecc.)",
      soy: "soia (compresi salsa di soia e tofu)",
      wheat: "frumento (grano)",
      gluten: "glutine (frumento, orzo, segale)",
      fish: "pesce (compresa la salsa di pesce)",
      shellfish: "crostacei e molluschi (gamberi, granchio, vongole, cozze, calamari, ecc.)",
      sesame: "sesamo",
    },
  },
  {
    code: "pt",
    nativeName: "Português",
    englishName: "Portuguese",
    title: "Alergia alimentar",
    intro: "Tenho uma alergia alimentar grave. Não posso comer:",
    warning:
      "Mesmo pequenas quantidades, ou comida preparada com os mesmos utensílios, óleo ou superfícies, podem causar uma reação grave.",
    closing: "Por favor, confirme com a cozinha. Obrigado!",
    allergens: {
      milk: "leite e laticínios",
      eggs: "ovo",
      peanuts: "amendoim",
      "tree-nuts": "frutos secos e castanhas (amêndoas, nozes, caju, avelãs, etc.)",
      soy: "soja (incluindo molho de soja e tofu)",
      wheat: "trigo",
      gluten: "glúten (trigo, cevada, centeio)",
      fish: "peixe (incluindo molho de peixe)",
      shellfish: "marisco e frutos do mar (camarão, caranguejo, mexilhões, lula, etc.)",
      sesame: "sésamo (gergelim)",
    },
  },
  {
    code: "ja",
    nativeName: "日本語",
    englishName: "Japanese",
    title: "食物アレルギー",
    intro: "私は重い食物アレルギーがあります。次のものを食べることができません：",
    warning:
      "少量でも、また同じ調理器具・油・調理台で調理されたものでも、重い症状が出ることがあります。",
    closing: "厨房にご確認いただけますか。よろしくお願いします。",
    allergens: {
      milk: "乳・乳製品",
      eggs: "卵",
      peanuts: "落花生（ピーナッツ）",
      "tree-nuts": "ナッツ類（アーモンド、くるみ、カシューナッツ、ヘーゼルナッツなど）",
      soy: "大豆（醤油・豆腐を含む）",
      wheat: "小麦",
      gluten: "グルテン（小麦・大麦・ライ麦）",
      fish: "魚（魚醤を含む）",
      shellfish: "甲殻類・貝類（えび、かに、貝、いか、たこなど）",
      sesame: "ごま",
    },
  },
  {
    code: "zh-Hans",
    nativeName: "简体中文",
    englishName: "Chinese (Simplified)",
    title: "食物过敏",
    intro: "我有严重的食物过敏，不能吃：",
    warning: "即使是少量，或用同一器具、同一油锅、同一台面制作的食物，也可能引起严重过敏反应。",
    closing: "请向厨房确认。谢谢！",
    allergens: {
      milk: "牛奶和乳制品",
      eggs: "鸡蛋",
      peanuts: "花生",
      "tree-nuts": "坚果（杏仁、核桃、腰果、榛子等）",
      soy: "大豆（包括酱油和豆腐）",
      wheat: "小麦",
      gluten: "麸质（小麦、大麦、黑麦）",
      fish: "鱼（包括鱼露）",
      shellfish: "甲壳类和贝类海鲜（虾、蟹、蛤蜊、青口、鱿鱼等，包括蚝油）",
      sesame: "芝麻",
    },
  },
  {
    code: "zh-Hant",
    nativeName: "繁體中文",
    englishName: "Chinese (Traditional)",
    title: "食物過敏",
    intro: "我有嚴重的食物過敏，不能吃：",
    warning: "即使是少量，或用同一器具、同一油鍋、同一檯面製作的食物，也可能引起嚴重過敏反應。",
    closing: "請向廚房確認。謝謝！",
    allergens: {
      milk: "牛奶和乳製品",
      eggs: "雞蛋",
      peanuts: "花生",
      "tree-nuts": "堅果（杏仁、核桃、腰果、榛果等）",
      soy: "大豆（包括醬油和豆腐）",
      wheat: "小麥",
      gluten: "麩質（小麥、大麥、黑麥）",
      fish: "魚（包括魚露）",
      shellfish: "甲殼類和貝類海鮮（蝦、蟹、蛤蜊、淡菜、魷魚等，包括蠔油）",
      sesame: "芝麻",
    },
  },
  {
    code: "ko",
    nativeName: "한국어",
    englishName: "Korean",
    title: "식품 알레르기",
    intro: "저는 심한 식품 알레르기가 있습니다. 다음 음식을 먹을 수 없습니다:",
    warning:
      "아주 적은 양이나, 같은 조리도구·기름·조리대에서 만든 음식도 심각한 반응을 일으킬 수 있습니다.",
    closing: "주방에 확인해 주시겠어요? 감사합니다!",
    allergens: {
      milk: "우유 및 유제품",
      eggs: "달걀(계란)",
      peanuts: "땅콩",
      "tree-nuts": "견과류(아몬드, 호두, 캐슈넛, 헤이즐넛 등)",
      soy: "대두(간장, 두부 포함)",
      wheat: "밀",
      gluten: "글루텐(밀, 보리, 호밀)",
      fish: "생선(액젓 포함)",
      shellfish: "갑각류 및 조개류(새우, 게, 조개, 홍합, 오징어 등)",
      sesame: "참깨",
    },
  },
  {
    code: "th",
    nativeName: "ภาษาไทย",
    englishName: "Thai",
    title: "แพ้อาหาร",
    intro: "ฉันแพ้อาหารอย่างรุนแรง ไม่สามารถกินสิ่งต่อไปนี้ได้:",
    warning:
      "แม้เพียงเล็กน้อย หรืออาหารที่ทำด้วยอุปกรณ์ น้ำมัน หรือพื้นที่เดียวกัน ก็อาจทำให้เกิดอาการแพ้รุนแรงได้",
    closing: "กรุณาสอบถามทางครัวด้วย ขอบคุณมาก",
    allergens: {
      milk: "นมและผลิตภัณฑ์จากนม",
      eggs: "ไข่",
      peanuts: "ถั่วลิสง",
      "tree-nuts": "ถั่วเปลือกแข็ง (อัลมอนด์ วอลนัท เม็ดมะม่วงหิมพานต์ เฮเซลนัท ฯลฯ)",
      soy: "ถั่วเหลือง (รวมถึงซีอิ๊วและเต้าหู้)",
      wheat: "ข้าวสาลี",
      gluten: "กลูเตน (ข้าวสาลี ข้าวบาร์เลย์ ข้าวไรย์)",
      fish: "ปลา (รวมถึงน้ำปลา)",
      shellfish: "กุ้ง ปู หอย ปลาหมึก (รวมถึงกะปิและน้ำมันหอย)",
      sesame: "งา",
    },
  },
  {
    code: "vi",
    nativeName: "Tiếng Việt",
    englishName: "Vietnamese",
    title: "Dị ứng thực phẩm",
    intro: "Tôi bị dị ứng thực phẩm nghiêm trọng. Tôi không thể ăn:",
    warning:
      "Dù chỉ một lượng nhỏ, hoặc món ăn được chế biến bằng cùng dụng cụ, dầu ăn hay mặt bếp, cũng có thể gây phản ứng nghiêm trọng.",
    closing: "Xin vui lòng hỏi lại nhà bếp. Cảm ơn!",
    allergens: {
      milk: "sữa và các sản phẩm từ sữa",
      eggs: "trứng",
      peanuts: "đậu phộng (lạc)",
      "tree-nuts": "các loại hạt (hạnh nhân, óc chó, hạt điều, hạt phỉ, v.v.)",
      soy: "đậu nành (kể cả nước tương và đậu phụ)",
      wheat: "lúa mì",
      gluten: "gluten (lúa mì, lúa mạch, lúa mạch đen)",
      fish: "cá (kể cả nước mắm)",
      shellfish: "hải sản có vỏ (tôm, cua, nghêu, sò, mực, v.v., kể cả mắm tôm)",
      sesame: "mè (vừng)",
    },
  },
];
