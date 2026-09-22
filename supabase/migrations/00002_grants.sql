-- ============================================================
-- ArigatoMenu — explicit grants for tables created via SQL editor.
--
-- Tables created through the Supabase SQL editor are NOT
-- automatically granted to anon/authenticated, so PostgREST hides
-- them (anon sees empty rows / 401). This migration grants the
-- roles explicitly. RLS policies still enforce what each role may
-- actually read/write row-by-row.
-- ============================================================

-- Reference / lookup tables: read-only.
grant select on public.locales, public.dietary_labels, public.allergens to anon, authenticated;

-- Profiles: users manage their own profile (RLS-scoped).
grant select, update on public.profiles to authenticated;

-- Restaurant graph: authenticated owns rows (RLS checks owner_id);
-- anon gets select (RLS limits to published + public restaurants).
grant select, insert, update, delete on
  public.restaurants,
  public.menus,
  public.categories,
  public.menu_items,
  public.recommendations,
  public.specials,
  public.menu_item_dietary_labels,
  public.menu_item_allergens,
  public.menu_item_images,
  public.menu_item_translations,
  public.menu_translations,
  public.category_translations,
  public.restaurant_translations
to authenticated;

grant select on
  public.restaurants,
  public.menus,
  public.categories,
  public.menu_items,
  public.recommendations,
  public.specials,
  public.menu_item_dietary_labels,
  public.menu_item_allergens,
  public.menu_item_images,
  public.menu_item_translations,
  public.menu_translations,
  public.category_translations,
  public.restaurant_translations
to anon;

-- Analytics: insert for everyone (client-side reporting), owner
-- select/delete via RLS policies.
grant select, insert, delete on
  public.page_views,
  public.qr_scans,
  public.language_switches,
  public.searches,
  public.filter_events
to anon, authenticated;

-- Sequences backing the analytics bigserial ids.
grant usage, select on all sequences in schema public to anon, authenticated;

-- Service role: full access (already bypasses RLS).
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Future-proofing: any later migration creating tables in public
-- automatically grants these to the roles.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;