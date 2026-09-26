import { createHash } from "node:crypto";

/**
 * Minimal Cloudinary client for authenticated uploads. Server-only.
 * The DB only ever stores metadata (public_id / url) — never image bytes.
 */

type CloudinaryResult = { publicId: string; url: string };

function cloudinaryEnv() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary の設定（CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET）が不足しています。",
    );
  }
  return { cloud, apiKey, apiSecret };
}

function sign(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(str + apiSecret).digest("hex");
}

async function request(
  endpoint: "upload" | "destroy",
  body: URLSearchParams | FormData,
) {
  const { cloud } = cloudinaryEnv();
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/${endpoint}`,
    {
      method: "POST",
      body,
    },
  );
  return res.json() as Promise<Record<string, unknown>>;
}

export async function uploadMenuItemImage(
  file: File,
  restaurantId: string,
): Promise<CloudinaryResult> {
  const { apiKey, apiSecret } = cloudinaryEnv();
  const folder = `arigatomenu/restaurants/${restaurantId}/items`;
  const timestamp = Math.floor(Date.now() / 1000);
  // Eager transform: 400×400 fill crop + WebP conversion for menu thumbnails
  const eager = "c_fill,g_center,h_400,w_400,f_webp,q_auto";
  const params = { eager, folder, timestamp };
  const signature = sign(params, apiSecret);

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  body.append("eager", eager);
  body.append("timestamp", String(timestamp));
  body.append("api_key", apiKey);
  body.append("signature", signature);

  const data = await request("upload", body);
  if (!data.public_id) {
    const message =
      typeof data.error === "object" && data.error && "message" in data.error
        ? String(data.error.message)
        : "Cloudinary がエラーを返しました";
    throw new Error(`画像のアップロードに失敗しました（${message}）。`);
  }

  // Prefer the eager (cropped/WebP) URL if available
  const eager0 = Array.isArray(data.eager) && data.eager[0];
  const url = eager0 && typeof eager0 === "object" && "secure_url" in eager0
    ? String((eager0 as Record<string, unknown>).secure_url)
    : String(data.secure_url ?? data.url ?? "");

  return {
    publicId: String(data.public_id),
    url,
  };
}

export async function uploadRestaurantLogoImage(
  file: File,
  restaurantId: string,
): Promise<CloudinaryResult> {
  const { apiKey, apiSecret } = cloudinaryEnv();
  const folder = `arigatomenu/restaurants/${restaurantId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = sign(params, apiSecret);

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  body.append("timestamp", String(timestamp));
  body.append("api_key", apiKey);
  body.append("signature", signature);

  const data = await request("upload", body);
  if (!data.public_id) {
    const message =
      typeof data.error === "object" && data.error && "message" in data.error
        ? String(data.error.message)
        : "Cloudinary がエラーを返しました";
    throw new Error(`画像のアップロードに失敗しました（${message}）。`);
  }
  return {
    publicId: String(data.public_id),
    url: String(data.secure_url ?? data.url ?? ""),
  };
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const { apiKey, apiSecret } = cloudinaryEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const signature = sign(params, apiSecret);

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });
  await request("destroy", body).catch(() => undefined);
}