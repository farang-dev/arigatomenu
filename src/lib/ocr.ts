import type { AllergenKey, DietaryLabelKey } from "@/lib/taxonomy";

export type OcrExtractedItem = {
  name: string;
  price: number;
  priceNote?: string;
  description?: string;
  dietary?: DietaryLabelKey[];
  allergens?: AllergenKey[];
  translations?: {
    en?: { name: string; description?: string };
    zh?: { name: string; description?: string };
    ko?: { name: string; description?: string };
  };
};

export type OcrExtractedCategory = {
  name: string;
  translations?: { en?: string; zh?: string; ko?: string };
  items: OcrExtractedItem[];
};

export type ExtractedMenuResult = {
  categories: OcrExtractedCategory[];
};

function extractJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(body) as Record<string, unknown>;
}

// Order of ultra-cheap vision models to try on OpenRouter
const DEFAULT_VISION_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-flash-1.5",
  "google/gemini-flash-latest",
  "openai/gpt-4o-mini",
  "qwen/qwen-2.5-vl-72b-instruct",
];

/**
 * Perform OCR on a restaurant paper menu photo using an inexpensive multimodal Vision model via OpenRouter.
 * Automatically tries fallback models if the primary model endpoint is unavailable.
 */
export async function extractMenuFromImage(
  base64Data: string,
  mimeType: string,
): Promise<ExtractedMenuResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY が設定されていません。");
  }

  const configuredModel = process.env.OPENROUTER_OCR_MODEL;
  const modelsToTry = [
    ...(configuredModel ? [configuredModel] : []),
    ...DEFAULT_VISION_MODELS.filter((m) => m !== configuredModel),
  ];

  const systemPrompt = [
    "You are an expert OCR and menu digitizer for restaurants in Japan.",
    "Your task is to analyze photos of restaurant paper menus, blackboards, flyers, or banners, and accurately extract all categories, dishes, prices, and descriptions.",
    "Guidelines:",
    "1. Group dishes by their visible category (e.g. 'ラーメン', 'トッピング', 'おつまみ', 'ご飯もの', 'ドリンク', 'ランチセット'). If no category is specified, use 'おすすめメニュー' or 'メインメニュー'.",
    "2. For prices: extract as integer in JPY (e.g., '1,200円' -> 1200, '¥850' -> 850, '800 (税込880)' -> 880). If price has note like '(大盛り+100円)' or '(ハーフ)', put it in priceNote.",
    "3. Infer dietary tags from dish details if clear: ['vegan', 'vegetarian', 'halal', 'gluten_free', 'dairy_free', 'nut_free', 'alcohol_free', 'spicy'].",
    "4. Infer 28 standard allergens if evident: ['wheat', 'buckwheat', 'egg', 'milk', 'peanut', 'shrimp', 'crab', 'soy', 'sesame', 'fish', 'shellfish', 'tree_nut', 'mustard', 'garlic', 'beef', 'pork', 'chicken', 'gelatin', 'kiwi', 'abalone', 'squid', 'salmon_roe', 'mackerel', 'yam', 'mushroom', 'orange', 'banana', 'apple'].",
    "5. Automatically generate natural English, Simplified Chinese, and Korean translations for each category and item.",
    "Return ONLY valid JSON matching this schema:",
    "{",
    '  "categories": [',
    "    {",
    '      "name": "カテゴリー名 (日本語)",',
    '      "translations": { "en": "Category EN", "zh": "分类 ZH", "ko": "카테고리 KO" },',
    '      "items": [',
    "        {",
    '          "name": "料理名 (日本語)",',
    '          "price": 1000,',
    '          "priceNote": "税込・任意",',
    '          "description": "説明文・こだわり",',
    '          "dietary": [],',
    '          "allergens": [],',
    '          "translations": {',
    '            "en": { "name": "Item EN", "description": "Desc EN" },',
    '            "zh": { "name": "Item ZH", "description": "Desc ZH" },',
    '            "ko": { "name": "Item KO", "description": "Desc KO" }',
    "          }",
    "        }",
    "      ]",
    "    }",
    "  ]",
    "}",
  ].join("\n");

  const imageUrl = `data:${mimeType};base64,${base64Data}`;
  let lastError = "";

  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://arigatomenu.jp",
          "X-Title": "ArigatoMenu OCR",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract all menu items from this menu photo into structured JSON as specified.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 8000,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          detail = (await res.json()).error?.message ?? String(res.status);
        } catch {
          detail = String(res.status);
        }
        lastError = `Model ${model} error: ${detail}`;
        console.warn(`[OCR] Vision model ${model} failed, trying next candidate:`, detail);
        continue;
      }

      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) {
        lastError = `Model ${model} returned empty response`;
        continue;
      }

      const parsed = extractJson(content) as { categories?: OcrExtractedCategory[] };
      if (!parsed.categories || !Array.isArray(parsed.categories)) {
        lastError = `Model ${model} returned invalid JSON format`;
        continue;
      }

      return {
        categories: parsed.categories,
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`[OCR] Vision model ${model} threw error, trying next candidate:`, lastError);
    }
  }

  throw new Error(`AI画像解析サービスが応答できませんでした（${lastError.slice(0, 100)}）`);
}
