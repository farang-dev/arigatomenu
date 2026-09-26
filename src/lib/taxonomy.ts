export type Locale = "ja" | "en" | "zh" | "ko";

export type DietaryLabelKey =
  | "vegan"
  | "vegetarian"
  | "halal"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "pork_free"
  | "alcohol_free"
  | "spicy"
  | "organic";

export type AllergenKey =
  | "wheat"
  | "buckwheat"
  | "egg"
  | "milk"
  | "peanut"
  | "shrimp"
  | "crab"
  | "soy"
  | "sesame"
  | "fish"
  | "shellfish"
  | "tree_nut"
  | "mustard"
  | "garlic"
  | "beef"
  | "pork"
  | "chicken"
  | "gelatin"
  | "kiwi"
  | "abalone"
  | "squid"
  | "salmon_roe"
  | "mackerel"
  | "yam"
  | "mushroom"
  | "orange"
  | "banana"
  | "apple";

type Labels = Record<Locale, string>;

/**
 * Single source of truth for the taxonomy, mirrored by the seeded lookup
 * tables (dietary_labels / allergens). Hardcoded here so public routes
 * never depend on anon read access to lookup tables. Labels are
 * locale-aware: the editor always shows Japanese, the public menu shows
 * the label for the currently selected language.
 */
export const DIETARY_LABELS: { key: DietaryLabelKey; label: Labels }[] = [
  { key: "vegan", label: { ja: "ヴィーガン", en: "Vegan", zh: "纯素", ko: "비건" } },
  { key: "vegetarian", label: { ja: "ベジタリアン", en: "Vegetarian", zh: "素食", ko: "채식" } },
  { key: "halal", label: { ja: "ハラル", en: "Halal", zh: "清真", ko: "할랄" } },
  { key: "gluten_free", label: { ja: "グルテンフリー", en: "Gluten Free", zh: "无麸质", ko: "글루텐 프리" } },
  { key: "dairy_free", label: { ja: "乳不使用", en: "Dairy Free", zh: "无乳制品", ko: "유제품 무첨가" } },
  { key: "nut_free", label: { ja: "ナッツ不使用", en: "Nut Free", zh: "无坚果", ko: "견과류 무첨가" } },
  { key: "pork_free", label: { ja: "豚肉不使用", en: "Pork Free", zh: "无猪肉", ko: "돼지고기 무첨가" } },
  { key: "alcohol_free", label: { ja: "ノンアルコール", en: "Alcohol Free", zh: "无酒精", ko: "무알코올" } },
  { key: "spicy", label: { ja: "辛口", en: "Spicy", zh: "辣", ko: "매운맛" } },
  { key: "organic", label: { ja: "オーガニック", en: "Organic", zh: "有机", ko: "유기농" } },
];

export const ALLERGENS: { key: AllergenKey; label: Labels }[] = [
  { key: "wheat", label: { ja: "小麦", en: "Wheat", zh: "小麦", ko: "밀" } },
  { key: "buckwheat", label: { ja: "そば", en: "Buckwheat", zh: "荞麦", ko: "메밀" } },
  { key: "egg", label: { ja: "卵", en: "Egg", zh: "鸡蛋", ko: "계란" } },
  { key: "milk", label: { ja: "乳", en: "Milk", zh: "牛奶", ko: "우유" } },
  { key: "peanut", label: { ja: "落花生", en: "Peanut", zh: "花生", ko: "땅콩" } },
  { key: "shrimp", label: { ja: "えび", en: "Shrimp", zh: "虾", ko: "새우" } },
  { key: "crab", label: { ja: "かに", en: "Crab", zh: "蟹", ko: "게" } },
  { key: "soy", label: { ja: "大豆", en: "Soy", zh: "大豆", ko: "대두" } },
  { key: "sesame", label: { ja: "ごま", en: "Sesame", zh: "芝麻", ko: "참깨" } },
  { key: "fish", label: { ja: "さかな", en: "Fish", zh: "鱼", ko: "생선" } },
  { key: "shellfish", label: { ja: "貝類", en: "Shellfish", zh: "贝类", ko: "조개류" } },
  { key: "tree_nut", label: { ja: "くるみ", en: "Tree Nut", zh: "坚果", ko: "견과류" } },
  { key: "mustard", label: { ja: "からし", en: "Mustard", zh: "芥末", ko: "겨자" } },
  { key: "garlic", label: { ja: "にんにく", en: "Garlic", zh: "大蒜", ko: "마늘" } },
  { key: "beef", label: { ja: "牛肉", en: "Beef", zh: "牛肉", ko: "쇠고기" } },
  { key: "pork", label: { ja: "豚肉", en: "Pork", zh: "猪肉", ko: "돼지고기" } },
  { key: "chicken", label: { ja: "鶏肉", en: "Chicken", zh: "鸡肉", ko: "닭고기" } },
  { key: "gelatin", label: { ja: "ゼラチン", en: "Gelatin", zh: "明胶", ko: "젤라틴" } },
  { key: "kiwi", label: { ja: "キウイ", en: "Kiwi", zh: "猕猴桃", ko: "키위" } },
  { key: "abalone", label: { ja: "あわび", en: "Abalone", zh: "鲍鱼", ko: "전복" } },
  { key: "squid", label: { ja: "いか", en: "Squid", zh: "鱿鱼", ko: "오징어" } },
  { key: "salmon_roe", label: { ja: "いくら", en: "Salmon Roe", zh: "鲑鱼子", ko: "연어알" } },
  { key: "mackerel", label: { ja: "さば", en: "Mackerel", zh: "鲭鱼", ko: "고등어" } },
  { key: "yam", label: { ja: "やまいも", en: "Yam", zh: "山药", ko: "참마" } },
  { key: "mushroom", label: { ja: "しいたけ", en: "Mushroom", zh: "蘑菇", ko: "버섯" } },
  { key: "orange", label: { ja: "オレンジ", en: "Orange", zh: "橙子", ko: "오렌지" } },
  { key: "banana", label: { ja: "バナナ", en: "Banana", zh: "香蕉", ko: "바나나" } },
  { key: "apple", label: { ja: "りんご", en: "Apple", zh: "苹果", ko: "사과" } },
];

export function dietaryLabel(key: string, locale: Locale): string | undefined {
  const entry = DIETARY_LABELS.find((d) => d.key === key);
  return entry?.label[locale];
}

export function allergenLabel(key: string, locale: Locale): string | undefined {
  const entry = ALLERGENS.find((a) => a.key === key);
  return entry?.label[locale];
}

export const ALLERGEN_PROMPT = "アレルゲン28品目（義務表示対応）";