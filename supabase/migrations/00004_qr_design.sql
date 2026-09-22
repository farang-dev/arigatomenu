-- ============================================================
-- 00004 — QR code design options
--
-- Restaurants print QR codes onto stickers / table cards, so the
-- QR gets brand colors and an error-correction level suited to a
-- table surface (scratches, drinks). Stored per restaurant.
-- ============================================================

alter table public.restaurants
  add column qr_dark            text not null default '#1B1B1B',
  add column qr_light           text not null default '#FFFFFF',
  add column qr_error_correction text not null default 'Q';