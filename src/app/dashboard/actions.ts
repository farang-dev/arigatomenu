"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import {
  deleteCloudinaryImage,
  uploadRestaurantLogoImage,
} from "@/lib/cloudinary";
import { translateMenuContent, type TranslateSource } from "@/lib/translate";
import type { AllergenKey, DietaryLabelKey } from "@/lib/taxonomy";

export type ActionState = { error?: string; message?: string } | undefined;

const localeFields = ["en", "zh", "ko"] as const;
type LocaleField = (typeof localeFields)[number];
type OwnerJoin = { menus?: { restaurants?: { owner_id: string } } };
type ItemOwnerJoin = { categories?: OwnerJoin };
type TranslationRow = Record<string, string | null>;

/**
 * Keep entity translations in sync with the submitted form: delete locales
 * that were emptied, upsert locales that have at least one non-empty value.
 */
async function syncTranslations(
  adm: ReturnType<typeof admin>,
  table: "restaurant_translations" | "category_translations" | "menu_item_translations",
  fk: "restaurant_id" | "category_id" | "item_id",
  entityId: string,
  cols: ReadonlyArray<"name" | "tagline" | "description">,
  data: Partial<Record<LocaleField, Partial<Record<string, string>>>>,
) {
  const hasValue = (l: LocaleField) => cols.some((c) => data[l]?.[c]?.trim());

  const { data: existingRows } = await adm
    .from(table)
    .select("locale")
    .eq(fk, entityId);
  for (const row of existingRows ?? []) {
    if (!hasValue(row.locale as LocaleField)) {
      await adm.from(table).delete().eq(fk, entityId).eq("locale", row.locale);
    }
  }

  for (const loc of localeFields) {
    if (!hasValue(loc)) continue;
    const row: TranslationRow = { [fk]: entityId, locale: loc };
    for (const c of cols) {
      row[c] = data[loc]?.[c]?.trim() || null;
    }
    await adm
      .from(table)
      .upsert(row, { onConflict: `${fk},locale` });
  }
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

function admin() {
  return createAdminClient();
}

// ============================================================
// Restaurants
// ============================================================

export async function createRestaurant(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const adm = admin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const tagline = String(formData.get("tagline") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name || !slug) {
    return { error: "店名とURLは必須です。" };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/.test(slug)) {
    return { error: "URLは半角英数字とハイフンのみで指定してください。" };
  }

  await adm.from("profiles").upsert(
    { id: user.id, display_name: user.user_metadata?.full_name ?? null },
    { onConflict: "id" },
  );

  const { data: restaurant, error } = await adm
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name,
      slug,
      tagline: tagline || null,
      description: description || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "そのURLはすでに使われています。別のURLを指定してください。" };
    }
    return { error: error.message };
  }

  await adm.from("menus").insert({
    restaurant_id: restaurant.id,
    slug: "main",
    name: "メニュー",
    position: 0,
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/restaurants/${restaurant.id}/menu`);
}

export async function updateRestaurant(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const adm = admin();
  const { error } = await adm
    .from("restaurants")
    .update({
      name: String(formData.get("name") || "").trim(),
      tagline: String(formData.get("tagline") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  const tData: Partial<Record<LocaleField, Partial<Record<string, string>>>> = {};
  for (const loc of localeFields) {
    tData[loc] = {
      name: String(formData.get(`name_${loc}`) || "").trim(),
      tagline: String(formData.get(`tagline_${loc}`) || "").trim(),
      description: String(formData.get(`description_${loc}`) || "").trim(),
    };
  }
  await syncTranslations(adm, "restaurant_translations", "restaurant_id", id, ["name", "tagline", "description"], tData);

  revalidatePath(`/dashboard/restaurants/${id}`);
  revalidatePath(`/r/${String(formData.get("slug") || "")}`);
  return {};
}

export async function setRestaurantPublished(
  id: string,
  published: boolean,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { data: restaurant, error } = await admin()
    .from("restaurants")
    .update({ is_published: published })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("slug")
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/restaurants/${id}`);
  revalidatePath(`/r/${restaurant.slug}`);
  revalidatePath("/dashboard");
  return {};
}

const QR_DARK_RE = /^#[0-9a-fA-F]{6}$/;
const QR_ERROR_CORRECTION = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrection = (typeof QR_ERROR_CORRECTION)[number];

export async function updateQrDesign(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const dark = String(formData.get("qr_dark") || "").trim();
  const light = String(formData.get("qr_light") || "").trim();
  const ec = String(formData.get("qr_error_correction") || "Q").toUpperCase();

  if (!QR_DARK_RE.test(dark) || !QR_DARK_RE.test(light)) {
    return { error: "QRコードの色の指定が不正です。" };
  }
  if (!(QR_ERROR_CORRECTION as readonly string[]).includes(ec)) {
    return { error: "誤り訂正レベルの指定が不正です。" };
  }

  const { error } = await admin()
    .from("restaurants")
    .update({
      qr_dark: dark,
      qr_light: light,
      qr_error_correction: ec,
    })
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/restaurants/${id}`);
  return { message: "QRコードのデザインを保存しました。" };
}

export async function deleteRestaurant(
  id: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { data: restaurant } = await admin()
    .from("restaurants")
    .select("logo_public_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  const { error } = await admin()
    .from("restaurants")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  if (restaurant?.logo_public_id) {
    await deleteCloudinaryImage(restaurant.logo_public_id).catch(() => undefined);
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function uploadRestaurantLogo(
  restaurantId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "画像ファイルを選択してください。" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイル（PNG・JPEG・WebPなど）を選択してください。" };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "画像サイズは2MB以下にしてください。" };
  }

  const { data: restaurant, error: findErr } = await admin()
    .from("restaurants")
    .select("id, slug, logo_public_id")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (findErr || !restaurant) {
    return { error: "レストランが見つかりません。" };
  }

  let uploaded;
  try {
    uploaded = await uploadRestaurantLogoImage(file, restaurantId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "画像のアップロードに失敗しました。" };
  }

  const { error } = await admin()
    .from("restaurants")
    .update({ logo_url: uploaded.url, logo_public_id: uploaded.publicId })
    .eq("id", restaurantId);
  if (error) {
    await deleteCloudinaryImage(uploaded.publicId).catch(() => undefined);
    return { error: error.message };
  }

  if (restaurant.logo_public_id) {
    await deleteCloudinaryImage(restaurant.logo_public_id).catch(() => undefined);
  }

  revalidatePath(`/dashboard/restaurants/${restaurantId}`);
  revalidatePath(`/dashboard/restaurants/${restaurantId}/print`);
  revalidatePath(`/r/${restaurant.slug}`);
  return { message: "ロゴを更新しました。公開メニュー・印刷メニューに反映されます。" };
}

export async function removeRestaurantLogo(
  restaurantId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { data: restaurant, error: findErr } = await admin()
    .from("restaurants")
    .select("id, slug, logo_public_id")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (findErr || !restaurant) {
    return { error: "レストランが見つかりません。" };
  }

  const { error } = await admin()
    .from("restaurants")
    .update({ logo_public_id: null, logo_url: null })
    .eq("id", restaurantId);
  if (error) return { error: error.message };

  if (restaurant.logo_public_id) {
    await deleteCloudinaryImage(restaurant.logo_public_id).catch(() => undefined);
  }

  revalidatePath(`/dashboard/restaurants/${restaurantId}`);
  revalidatePath(`/dashboard/restaurants/${restaurantId}/print`);
  revalidatePath(`/r/${restaurant.slug}`);
  return { message: "ロゴを削除しました。" };
}

// ============================================================
// Categories
// ============================================================

export async function createCategory(
  menuId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "カテゴリー名を入力してください。" };

  const { data: menu, error: menuError } = await admin()
    .from("menus")
    .select("restaurant_id")
    .eq("id", menuId)
    .single();
  if (menuError || menu.restaurant_id === null) {
    return { error: "メニューが見つかりません。" };
  }
  const { error: ownerError } = await admin()
    .from("restaurants")
    .select("id")
    .eq("id", menu.restaurant_id)
    .eq("owner_id", user.id)
    .single();
  if (ownerError) return { error: "権限がありません。" };

  const slug = slugify(name) || `c-${Date.now().toString(36)}`;
  const { data: created, error } = await admin()
    .from("categories")
    .insert({
      menu_id: menuId,
      parent_id: null,
      slug,
      name,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const tData = categoryTranslationsFromForm(formData);
  await syncTranslations(admin(), "category_translations", "category_id", created.id, ["name"], tData);

  revalidatePath(`/dashboard/restaurants/*/menu`);
  return {};
}

export async function updateCategory(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "カテゴリー名を入力してください。" };

  const { data: category, error: findErr } = await admin()
    .from("categories")
    .select("menu_id, menus!inner(restaurant_id, restaurants!inner(owner_id))")
    .eq("id", id)
    .maybeSingle();
  if (findErr || !category) return { error: "カテゴリーが見つかりません。" };
  if ((category as OwnerJoin).menus?.restaurants?.owner_id !== user.id) {
    return { error: "権限がありません。" };
  }

  const { error } = await admin()
    .from("categories")
    .update({ name })
    .eq("id", id);
  if (error) return { error: error.message };

  const tData = categoryTranslationsFromForm(formData);
  await syncTranslations(admin(), "category_translations", "category_id", id, ["name"], tData);

  revalidatePath(`/dashboard/restaurants/*/menu`);
  return {};
}

function categoryTranslationsFromForm(formData: FormData) {
  const tData: Partial<Record<LocaleField, Partial<Record<string, string>>>> = {};
  for (const loc of localeFields) {
    tData[loc] = { name: String(formData.get(`name_${loc}`) || "").trim() };
  }
  return tData;
}

export async function deleteCategory(
  id: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const { error } = await admin().from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/restaurants/*/menu`);
  return {};
}

// ============================================================
// Menu items
// ============================================================

function parseItemForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const priceNote = String(formData.get("priceNote") || "").trim();
  const status =
    String(formData.get("status")) === "unavailable" ? "unavailable" : "available";

  const dietaryLabels = (formData.getAll("dietary") as string[]).filter((k) =>
    k.length > 0,
  ) as DietaryLabelKey[];
  const allergens = (formData.getAll("allergens") as string[]).filter(
    (k) => k.length > 0,
  ) as AllergenKey[];

  const translations: Partial<Record<LocaleField, { name: string; description: string }>> = {};
  for (const loc of localeFields) {
    const tName = String(formData.get(`name_${loc}`) || "").trim();
    const tDesc = String(formData.get(`description_${loc}`) || "").trim();
    if (tName || tDesc) translations[loc] = { name: tName, description: tDesc };
  }

  return { name, description, price, priceNote, status, dietaryLabels, allergens, translations };
}

async function assertCategoryOwner(categoryId: string) {
  const user = await requireUser();
  const { data: category, error } = await admin()
    .from("categories")
    .select("menu_id, menus!inner(restaurant_id, restaurants!inner(owner_id))")
    .eq("id", categoryId)
    .maybeSingle();
  if (error || !category) return undefined;
  const ownerId = (category as OwnerJoin).menus?.restaurants?.owner_id;
  if (ownerId !== user.id) return undefined;
  return category;
}

async function replaceJoin(
  adm: ReturnType<typeof admin>,
  table: "menu_item_dietary_labels" | "menu_item_allergens",
  itemId: string,
  keys: string[],
) {
  const fk = table === "menu_item_dietary_labels" ? "label_id" : "allergen_id";
  const { data: existing } = await adm
    .from(table)
    .select(fk)
    .eq("item_id", itemId);
  const current = new Set(
    (existing ?? []).map((r) => String((r as Record<string, unknown>)[fk])),
  );
  const toAdd = keys.filter((k) => !current.has(k));
  const toRemove = [...current].filter((k) => !keys.includes(k));

  if (toAdd.length) {
    const { error } = await adm.from(table).upsert(
      toAdd.map((key) => ({ item_id: itemId, [fk]: key })),
      { onConflict: `item_id,${fk}` },
    );
    if (error) return error;
  }
  if (toRemove.length) {
    const { error } = await adm
      .from(table)
      .delete()
      .eq("item_id", itemId)
      .in(fk, toRemove);
    if (error) return error;
  }
  return null;
}

export async function createItem(
  categoryId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const category = await assertCategoryOwner(categoryId);
  if (!category) return { error: "カテゴリーが見つからないか、権限がありません。" };
  const item = parseItemForm(formData);
  if (!item.name) return { error: "商品名を入力してください。" };
  const adm = admin();

  const { data: created, error } = await adm
    .from("menu_items")
    .insert({
      category_id: categoryId,
      name: item.name,
      description: item.description || null,
      price: item.price || 0,
      price_note: item.priceNote || null,
      status: item.status,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const relError =
    (await replaceJoin(adm, "menu_item_dietary_labels", created.id, item.dietaryLabels)) ??
    (await replaceJoin(adm, "menu_item_allergens", created.id, item.allergens));
  if (relError) return { error: relError.message };

  await syncTranslations(
    adm,
    "menu_item_translations",
    "item_id",
    created.id,
    ["name", "description"],
    item.translations,
  );

  revalidatePath(`/dashboard/restaurants/*/menu`);
  return {};
}

export async function updateItem(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const item = parseItemForm(formData);
  if (!item.name) return { error: "商品名を入力してください。" };
  const adm = admin();

  const { data: existing, error: findErr } = await adm
    .from("menu_items")
    .select("category_id, categories!inner(menus!inner(restaurants!inner(owner_id)))")
    .eq("id", id)
    .maybeSingle();
  if (findErr || !existing) return { error: "商品が見つかりません。" };
  if ((existing as ItemOwnerJoin).categories?.menus?.restaurants?.owner_id !== user.id) {
    return { error: "権限がありません。" };
  }

  const { error } = await adm.from("menu_items").update({
    name: item.name,
    description: item.description || null,
    price: item.price || 0,
    price_note: item.priceNote || null,
    status: item.status,
  }).eq("id", id);
  if (error) return { error: error.message };

  const relError =
    (await replaceJoin(adm, "menu_item_dietary_labels", id, item.dietaryLabels)) ??
    (await replaceJoin(adm, "menu_item_allergens", id, item.allergens));
  if (relError) return { error: relError.message };

  await syncTranslations(
    adm,
    "menu_item_translations",
    "item_id",
    id,
    ["name", "description"],
    item.translations,
  );

  revalidatePath(`/dashboard/restaurants/*/menu`);
  return {};
}

export async function deleteItem(
  id: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const { error } = await admin().from("menu_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/restaurants/*/menu`);
  return {};
}

export async function toggleItemStatus(
  id: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const adm = admin();
  const { data: existing, error: findErr } = await adm
    .from("menu_items")
    .select("status, category_id, categories!inner(menus!inner(restaurants!inner(owner_id)))")
    .eq("id", id)
    .maybeSingle();
  if (findErr || !existing) return { error: "商品が見つかりません。" };
  if ((existing as ItemOwnerJoin).categories?.menus?.restaurants?.owner_id !== user.id) {
    return { error: "権限がありません。" };
  }
  const nextStatus = existing.status === "available" ? "unavailable" : "available";
  const { error } = await adm
    .from("menu_items")
    .update({ status: nextStatus })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/restaurants/*/menu`);
  revalidatePath(`/r/*`);
  return { message: nextStatus === "available" ? "提供中に変更しました" : "品切れに変更しました" };
}

export async function moveCategory(
  categoryId: string,
  direction: "up" | "down",
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const adm = admin();
  const { data: currentCat, error: findErr } = await adm
    .from("categories")
    .select("id, menu_id, position, created_at, menus!inner(restaurants!inner(owner_id))")
    .eq("id", categoryId)
    .maybeSingle();
  if (findErr || !currentCat) return { error: "カテゴリーが見つかりません。" };
  if ((currentCat as OwnerJoin).menus?.restaurants?.owner_id !== user.id) {
    return { error: "権限がありません。" };
  }

  const { data: allCats } = await adm
    .from("categories")
    .select("id, position, created_at")
    .eq("menu_id", currentCat.menu_id)
    .is("parent_id", null)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (!allCats || allCats.length <= 1) return {};

  const currentIndex = allCats.findIndex((c) => c.id === categoryId);
  if (currentIndex === -1) return {};
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= allCats.length) return {};

  const targetCat = allCats[targetIndex];

  // Assign normalized 0, 1, 2... positions to all categories with target swapped
  const reordered = [...allCats];
  reordered[currentIndex] = targetCat;
  reordered[targetIndex] = currentCat;

  await Promise.all(
    reordered.map((cat, idx) =>
      adm.from("categories").update({ position: idx }).eq("id", cat.id),
    ),
  );

  revalidatePath(`/dashboard/restaurants/*/menu`);
  revalidatePath(`/r/*`);
  return {};
}

export async function moveItem(
  itemId: string,
  direction: "up" | "down",
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const adm = admin();
  const { data: currentItem, error: findErr } = await adm
    .from("menu_items")
    .select("id, category_id, position, created_at, categories!inner(menus!inner(restaurants!inner(owner_id)))")
    .eq("id", itemId)
    .maybeSingle();
  if (findErr || !currentItem) return { error: "商品が見つかりません。" };
  if ((currentItem as ItemOwnerJoin).categories?.menus?.restaurants?.owner_id !== user.id) {
    return { error: "権限がありません。" };
  }

  const { data: allItems } = await adm
    .from("menu_items")
    .select("id, position, created_at")
    .eq("category_id", currentItem.category_id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (!allItems || allItems.length <= 1) return {};

  const currentIndex = allItems.findIndex((i) => i.id === itemId);
  if (currentIndex === -1) return {};
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= allItems.length) return {};

  const targetItem = allItems[targetIndex];

  const reordered = [...allItems];
  reordered[currentIndex] = targetItem;
  reordered[targetIndex] = currentItem;

  await Promise.all(
    reordered.map((item, idx) =>
      adm.from("menu_items").update({ position: idx }).eq("id", item.id),
    ),
  );

  revalidatePath(`/dashboard/restaurants/*/menu`);
  revalidatePath(`/r/*`);
  return {};
}

// ============================================================
// AI translation
// ============================================================

const MAIN_LOCALES = ["en", "zh", "ko"] as const;
type MainLocale = (typeof MAIN_LOCALES)[number];

export async function translateMenu(
  restaurantId: string,
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const adm = admin();

  const { data: restaurant, error: rErr } = await adm
    .from("restaurants")
    .select("id, name, tagline, description, slug")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (rErr || !restaurant) return { error: "レストランが見つかりません。" };

  const { data: menus } = await adm
    .from("menus")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .order("position")
    .limit(1);
  const menuId = menus?.[0]?.id;
  if (!menuId) return { error: "メニューが見つかりません。" };

  const { data: cats } = await adm
    .from("categories")
    .select("id, name")
    .eq("menu_id", menuId)
    .is("parent_id", null);
  const catIds = (cats ?? []).map((c) => c.id);
  const { data: items } = await adm
    .from("menu_items")
    .select("id, name, description")
    .in("category_id", catIds);

  const [rTrans, cTrans, iTrans] = await Promise.all([
    adm.from("restaurant_translations").select("locale, name, tagline, description").eq("restaurant_id", restaurantId),
    adm.from("category_translations").select("category_id, locale, name").in("category_id", catIds),
    adm.from("menu_item_translations").select("item_id, locale, name").in("item_id", (items ?? []).map((i) => i.id)),
  ]);

  const restaurantRows = new Map<string, { name: string; tagline: string | null; description: string | null }>();
  for (const row of rTrans.data ?? []) restaurantRows.set(row.locale, row);
  const catHas = new Set<string>();
  for (const row of cTrans.data ?? []) if (row.name) catHas.add(`${row.category_id}:${row.locale}`);
  const itemHas = new Set<string>();
  for (const row of iTrans.data ?? []) if (row.name) itemHas.add(`${row.item_id}:${row.locale}`);

  const restaurantNeeds = new Map<MainLocale, boolean>();
  for (const loc of MAIN_LOCALES) {
    const r = restaurantRows.get(loc);
    restaurantNeeds.set(loc, !(r?.name?.trim() || r?.tagline?.trim() || r?.description?.trim()));
  }
  const needsRestaurant = [...restaurantNeeds.values()].some(Boolean);
  const neededCategories = (cats ?? []).filter((c) => MAIN_LOCALES.some((loc) => !catHas.has(`${c.id}:${loc}`)));
  const neededItems = (items ?? []).filter((i) => MAIN_LOCALES.some((loc) => !itemHas.has(`${i.id}:${loc}`)));

  if (!needsRestaurant && neededCategories.length === 0 && neededItems.length === 0) {
    return { message: "翻訳が必要な内容はありません（すべて翻訳済みです）。" };
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return { error: "OPENROUTER_API_KEY が設定されていないため、翻訳できません。" };
  }

  const source: TranslateSource = {
    ...(needsRestaurant
      ? {
          restaurant: {
            name: restaurant.name,
            tagline: restaurant.tagline,
            description: restaurant.description,
          },
        }
      : {}),
    categories: neededCategories,
    items: neededItems,
  };

  let result;
  try {
    result = await translateMenuContent(source);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "翻訳に失敗しました。" };
  }

  let written = 0;
  for (const loc of MAIN_LOCALES) {
    if (needsRestaurant && restaurantNeeds.get(loc)) {
      const t = result.restaurant?.[loc];
      if (t) {
        await adm.from("restaurant_translations").upsert(
          {
            restaurant_id: restaurantId,
            locale: loc,
            name: t.name ?? "",
            tagline: t.tagline ?? null,
            description: t.description ?? null,
          },
          { onConflict: "restaurant_id,locale" },
        );
        written++;
      }
    }
    for (const cat of neededCategories) {
      if (catHas.has(`${cat.id}:${loc}`)) continue;
      const t = result.categories?.[cat.id]?.[loc];
      if (t) {
        await adm.from("category_translations").upsert(
          { category_id: cat.id, locale: loc, name: t },
          { onConflict: "category_id,locale" },
        );
        written++;
      }
    }
    for (const item of neededItems) {
      if (itemHas.has(`${item.id}:${loc}`)) continue;
      const t = result.items?.[item.id]?.[loc];
      if (t) {
        await adm.from("menu_item_translations").upsert(
          { item_id: item.id, locale: loc, name: t.name ?? "", description: t.description || null },
          { onConflict: "item_id,locale" },
        );
        written++;
      }
    }
  }

  revalidatePath(`/dashboard/restaurants/${restaurantId}/menu`);
  revalidatePath(`/r/${restaurant.slug}`);

  if (written === 0) {
    return { error: "翻訳内容を保存できませんでした。" };
  }
  return { message: `${written}件を英語・中文・한국어に翻訳しました。メニューで確認できます。` };
}