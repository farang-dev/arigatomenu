export type TranslateSource = {
  restaurant?: {
    name: string;
    tagline: string | null;
    description: string | null;
  };
  categories: { id: string; name: string }[];
  items: { id: string; name: string; description: string | null }[];
};

export type TranslateResult = {
  restaurant?: Record<"en" | "zh" | "ko", { name: string; tagline: string | null; description: string | null }>;
  categories: Record<string, Record<"en" | "zh" | "ko", string>>;
  items: Record<string, Record<"en" | "zh" | "ko", { name: string; description: string | null }>>;
};

const LOCALE_LABEL: Record<"en" | "zh" | "ko", string> = {
  en: "English",
  zh: "Simplified Chinese",
  ko: "Korean",
};

const TARGET_LOCALES = ["en", "zh", "ko"] as const;

function extractJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(body) as Record<string, unknown>;
}

/**
 * Translate a restaurant's untranslated content (name/tagline/description,
 * category names, item names + descriptions) into en/zh/ko in one request
 * to OpenRouter, using a cheap model. Server-only.
 *
 * Throws on failure so server actions can surface a friendly message.
 */
export async function translateMenuContent(source: TranslateSource): Promise<TranslateResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY が設定されていません。");
  }

  const promptSource: Record<string, unknown> = {};
  if (source.restaurant) {
    promptSource.restaurant = {
      name: source.restaurant.name,
      tagline: source.restaurant.tagline ?? "",
      description: source.restaurant.description ?? "",
    };
  }
  promptSource.categories = Object.fromEntries(
    source.categories.map((c) => [c.id, c.name]),
  );
  promptSource.items = Object.fromEntries(
    source.items.map((i) => [
      i.id,
      { name: i.name, description: i.description ?? "" },
    ]),
  );
  promptSource.targetLanguages = TARGET_LOCALES.map((l) => LOCALE_LABEL[l]);
  promptSource.restaurantAlways = true;

  const system = [
    "You are a professional translator for small Japanese restaurant menus.",
    "Translate the Japanese source text into English, Simplified Chinese, and Korean.",
    "Keep the meaning and tone of the original. For restaurant and dish names choose a natural translation or romanization — never leave them in Japanese.",
    "Return ONLY valid JSON matching this schema and nothing else:",
    '{',
    '  "restaurant": { "en": {"name":"","tagline":"","description":""}, "zh": {...}, "ko": {...} },',
    '  "categories": { "<categoryId>": { "en":"","zh":"","ko":"" } },',
    '  "items": { "<itemId>": { "en": {"name":"","description":""}, "zh": {...}, "ko": {...} } }',
    "}",
    "Use the same keys/ids you received. If a source field is empty, return an empty string in every language.",
  ].join("\n");

  const user =
    `Translate the following JSON. Return the translated JSON with this exact structure:\n` +
    `{"restaurant":{"en":{"name":"","tagline":"","description":""},"zh":{"name":"","tagline":"","description":""},"ko":{"name":"","tagline":"","description":""}},"categories":{"<categoryId>":{"en":"","zh":"","ko":""}},"items":{"<itemId>":{"en":{"name":"","description":""},"zh":{"name":"","description":""},"ko":{"name":"","description":""}}}}\n` +
    `Source JSON:\n${JSON.stringify(promptSource)}`;

  const model = process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3-0324";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://arigatomenu.jp",
      "X-Title": "ArigatoMenu",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
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
    if (
      res.status === 401 ||
      /user not found|invalid api key|no auth credentials/i.test(detail)
    ) {
      throw new Error(
        `OpenRouter の API キーが無効です。キーを確認して、必要なら発行し直してください（${detail.slice(0, 60)}）`,
      );
    }
    throw new Error(`翻訳サービスが応答できませんでした（${detail.slice(0, 80)}）`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("翻訳サービスの応答が空でした。");

  const parsed = extractJson(content) as Record<string, unknown>;
  if (!parsed.restaurant && !parsed.categories && !parsed.items) {
    throw new Error("翻訳モデルの応答を解析できませんでした。");
  }

  return parsed as unknown as TranslateResult;
}