-- ============================================================
-- 00003 — lookup table ids become their stable keys
--
-- dietary_labels.id / allergens.id change from random UUIDs to
-- the stable text key ("vegan", "wheat", ...) so the rest of the
-- app never needs to JOIN these tables to resolve labels. This
-- also removes the dependency on anon SELECT grants for lookups.
--
-- Safe to run: these tables only contain seed rows and the join
-- tables are empty (mirror tables exist for future use: 00001).
-- ============================================================

alter table public.menu_item_dietary_labels
  drop constraint if exists menu_item_dietary_labels_label_id_fkey;

alter table public.dietary_labels
  alter column id type text using id::text;

update public.dietary_labels set id = key;

alter table public.menu_item_dietary_labels
  alter column label_id type text using label_id::text;

alter table public.dietary_labels
  drop constraint if exists dietary_labels_pkey,
  add primary key (id);

alter table public.menu_item_dietary_labels
  add constraint menu_item_dietary_labels_label_id_fkey
  foreign key (label_id) references public.dietary_labels (id) on delete cascade;

-- --- allergens -------------------------------------------------

alter table public.menu_item_allergens
  drop constraint if exists menu_item_allergens_allergen_id_fkey;

alter table public.allergens
  alter column id type text using id::text;

update public.allergens set id = key;

alter table public.menu_item_allergens
  alter column allergen_id type text using allergen_id::text;

alter table public.allergens
  drop constraint if exists allergens_pkey,
  add primary key (id);

alter table public.menu_item_allergens
  add constraint menu_item_allergens_allergen_id_fkey
  foreign key (allergen_id) references public.allergens (id) on delete cascade;