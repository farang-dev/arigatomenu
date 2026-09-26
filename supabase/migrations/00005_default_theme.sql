-- ============================================================
-- 00005 — Default Theme Preference for Public Menu
-- ============================================================

alter table public.restaurants
  add column if not exists default_theme text not null default 'light';
