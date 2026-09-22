-- ============================================================
-- ArigatoMenu — initial schema
--
-- Data model: User -> Restaurant -> Menu -> Category -> MenuItem
--              -> dietary labels / allergens / images / translations
--
-- Billing note (Stripe): billing is NOT implemented yet. Columns
-- prefixed for it (profiles.plan, .plan_status, .stripe_customer_id)
-- are placeholders so the schema is billing-ready later.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type public.user_plan as enum ('free', 'pro');
create type public.visibility as enum ('public', 'private');
create type public.item_status as enum ('available', 'unavailable');

-- ------------------------------------------------------------
-- Lookups
-- ------------------------------------------------------------
create table public.locales (
  code        text primary key check (code ~ '^[a-z]{2}([-_][A-Z]{2})?$'),
  native_name text not null,
  is_active   boolean not null default true
);

insert into public.locales (code, native_name) values
  ('ja',   '日本語'),
  ('en',   'English'),
  ('zh',   '中文'),
  ('ko',   '한국어'),
  ('fr',   'Français'),
  ('de',   'Deutsch'),
  ('es',   'Español'),
  ('it',   'Italiano');

-- Dietary labels are structured keys, not free text, so filters
-- ("show only Vegan") and future exclusions can be done with SQL.
create table public.dietary_labels (
  id        uuid primary key default gen_random_uuid(),
  key       text not null unique,
  label     text not null,
  is_active boolean not null default true
);

insert into public.dietary_labels (key, label) values
  ('vegan',        'Vegan'),
  ('vegetarian',   'Vegetarian'),
  ('halal',        'Halal'),
  ('gluten_free',  'Gluten Free'),
  ('dairy_free',   'Dairy Free'),
  ('nut_free',     'Nut Free'),
  ('alcohol_free', 'Alcohol Free'),
  ('spicy',        'Spicy');

-- Canonical allergen list (Japan's 28 + common international ones).
-- Structured so a future "exclude Milk" filter is a simple exclusion join.
create table public.allergens (
  id        uuid primary key default gen_random_uuid(),
  key       text not null unique,
  label     text not null,
  is_active boolean not null default true
);

insert into public.allergens (key, label) values
  ('wheat',      'Wheat'),
  ('buckwheat',  'Buckwheat'),
  ('egg',        'Egg'),
  ('milk',       'Milk'),
  ('peanut',     'Peanut'),
  ('shrimp',     'Shrimp'),
  ('crab',       'Crab'),
  ('soy',        'Soy'),
  ('sesame',     'Sesame'),
  ('fish',       'Fish'),
  ('shellfish',  'Shellfish'),
  ('tree_nut',   'Tree Nut'),
  ('mustard',    'Mustard'),
  ('garlic',     'Garlic'),
  ('beef',       'Beef'),
  ('pork',       'Pork'),
  ('chicken',    'Chicken'),
  ('gelatin',    'Gelatin'),
  ('kiwi',       'Kiwi'),
  ('abalone',    'Abalone'),
  ('squid',      'Squid'),
  ('salmon_roe', 'Salmon Roe'),
  ('mackerel',   'Mackerel'),
  ('yam',        'Yam'),
  ('mushroom',   'Mushroom'),
  ('orange',     'Orange'),
  ('banana',     'Banana'),
  ('apple',      'Apple');

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text,
  avatar_url         text,
  -- Billing (Stripe-ready placeholders, NOT wired up yet)
  plan               public.user_plan not null default 'free',
  plan_status        text,
  stripe_customer_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on column public.profiles.plan is 'free | pro — Stripe billing comes in a later phase';
comment on column public.profiles.plan_status is 'stripe subscription status placeholder (active/canceled/past_due/...)';
comment on column public.profiles.stripe_customer_id is 'stripe customer id placeholder for future billing';

-- ------------------------------------------------------------
-- Restaurants
-- ------------------------------------------------------------
create table public.restaurants (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  slug             text not null unique,
  name             text not null,
  tagline          text,
  description      text,
  -- Cloudinary metadata only — no image bytes in the DB.
  logo_public_id   text,
  logo_url         text,
  cover_public_id  text,
  cover_url        text,
  address          text,
  address_map_url  text,
  phone            text,
  email            text,
  website          text,
  instagram        text,
  x                text,
  facebook         text,
  tiktok           text,
  other_sns        jsonb not null default '[]'::jsonb,
  -- Structured opening hours, e.g. [{"days":[1,2,3,4,5],"open":"11:00","close":"22:00"}]
  opening_hours    jsonb not null default '[]'::jsonb,
  -- Languages
  default_locale   text not null default 'ja' references public.locales (code),
  languages        text[] not null default array['ja', 'en'],
  -- Publishing / SEO
  visibility       public.visibility not null default 'public',
  is_published     boolean not null default false,
  -- Theme (limited customization per PRD: accent/bg/text/font on top of a theme)
  theme            text not null default 'minimal', -- minimal | modern | japanese | elegant | casual
  accent_color     text not null default '#C73E1D',
  background_color text not null default '#FAF7F2',
  text_color       text not null default '#1B1B1B',
  font_family      text not null default 'system-ui',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index restaurants_owner_idx on public.restaurants (owner_id);
create index restaurants_slug_idx on public.restaurants (slug);
create index restaurants_visibility_idx on public.restaurants (visibility, is_published);

-- ------------------------------------------------------------
-- Menus (multiple per restaurant: main / lunch / dinner / drinks / seasonal)
-- ------------------------------------------------------------
create table public.menus (
  id               uuid primary key default gen_random_uuid(),
  restaurant_id    uuid not null references public.restaurants (id) on delete cascade,
  slug             text not null,
  name             text not null, -- canonical name (default_locale)
  description      text,
  position         int  not null default 0,
  visibility       public.visibility not null default 'public',
  is_active        boolean not null default true,
  -- Future: opening-hours based / scheduled menus (PRD phase 2)
  schedule_start   timestamptz,
  schedule_end     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create index menus_restaurant_idx on public.menus (restaurant_id);

-- ------------------------------------------------------------
-- Categories (hierarchical: FOOD group -> Appetizers -> ...)
-- ------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  menu_id     uuid not null references public.menus (id) on delete cascade,
  parent_id   uuid references public.categories (id) on delete set null,
  slug        text not null,
  name        text not null, -- canonical name (default_locale)
  description text,
  position    int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (menu_id, parent_id, slug)
);

-- NULLs are distinct in Postgres unique constraints, so root categories
-- (parent_id IS NULL) need their own uniqueness rule.
create unique index categories_root_slug_uidx
  on public.categories (menu_id, slug)
  where parent_id is null;

create index categories_menu_idx on public.categories (menu_id);
create index categories_parent_idx on public.categories (parent_id);

-- ------------------------------------------------------------
-- Menu items
-- ------------------------------------------------------------
create table public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name        text not null, -- canonical name (default_locale)
  description text,
  price       numeric(10, 0) not null default 0,
  price_note  text,  -- e.g. "＋税", "from ¥1,200", "per 100g"
  currency    text not null default 'JPY',
  status      public.item_status not null default 'available',
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index menu_items_category_idx on public.menu_items (category_id);

-- ------------------------------------------------------------
-- Recommendations (Recommended / Popular / Chef's Choice / Must Try)
-- ------------------------------------------------------------
create table public.recommendations (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.menu_items (id) on delete cascade,
  rec_type   text not null check (rec_type in ('recommended', 'popular', 'chefs_choice', 'must_try')),
  position   int  not null default 0,
  created_at timestamptz not null default now(),
  unique (item_id, rec_type)
);

create index recommendations_item_idx on public.recommendations (item_id);

-- ------------------------------------------------------------
-- Today's / Seasonal specials (date-windowed, optional title, optional featured)
-- ------------------------------------------------------------
create table public.specials (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.menu_items (id) on delete cascade,
  title      text, -- optional display title e.g. "Today's Special"
  note       text, -- e.g. "until sold out"
  starts_on  date not null default current_date,
  ends_on    date,
  is_featured boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint specials_dates check (ends_on is null or ends_on >= starts_on)
);

create index specials_item_idx on public.specials (item_id);
create index specials_dates_idx on public.specials (starts_on, ends_on);

-- ------------------------------------------------------------
-- Item <-> dietary labels
-- ------------------------------------------------------------
create table public.menu_item_dietary_labels (
  item_id  uuid not null references public.menu_items (id) on delete cascade,
  label_id uuid not null references public.dietary_labels (id) on delete cascade,
  primary key (item_id, label_id)
);

create index m_idl_labels_idx on public.menu_item_dietary_labels (label_id);

-- ------------------------------------------------------------
-- Item <-> allergens (contains flag: false could mean "traces" in future)
-- ------------------------------------------------------------
create table public.menu_item_allergens (
  item_id     uuid not null references public.menu_items (id) on delete cascade,
  allergen_id uuid not null references public.allergens (id) on delete cascade,
  contains    boolean not null default true,
  primary key (item_id, allergen_id)
);

create index m_item_allergens_idx on public.menu_item_allergens (allergen_id);

-- ------------------------------------------------------------
-- Images (Cloudinary metadata only)
-- ------------------------------------------------------------
create table public.menu_item_images (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.menu_items (id) on delete cascade,
  public_id  text not null,       -- cloudinary public id used for transformations (e.g. crop/rotate/size)
  url        text not null,
  alt_text   text,
  position   int not null default 0,
  width      int,
  height     int,
  created_at timestamptz not null default now()
);

create index menu_item_images_item_idx on public.menu_item_images (item_id);

-- ------------------------------------------------------------
-- Translations.
-- One row per (entity, locale): the SAME menu item carries ja/en/zh/ko
-- names, so a single language switcher flips the whole menu (PRD §12).
-- ------------------------------------------------------------
create table public.menu_item_translations (
  item_id     uuid not null references public.menu_items (id) on delete cascade,
  locale      text not null references public.locales (code) on delete cascade,
  name        text not null,
  description text,
  primary key (item_id, locale)
);

create table public.menu_translations (
  menu_id     uuid not null references public.menus (id) on delete cascade,
  locale      text not null references public.locales (code) on delete cascade,
  name        text not null,
  description text,
  primary key (menu_id, locale)
);

create table public.category_translations (
  category_id uuid not null references public.categories (id) on delete cascade,
  locale      text not null references public.locales (code) on delete cascade,
  name        text not null,
  description text,
  primary key (category_id, locale)
);

create table public.restaurant_translations (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  locale        text not null references public.locales (code) on delete cascade,
  name          text not null,
  tagline       text,
  description   text,
  primary key (restaurant_id, locale)
);

-- ------------------------------------------------------------
-- Analytics (append-only; counts power the future paid dashboard)
-- ------------------------------------------------------------
create table public.page_views (
  id            bigserial primary key,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  path          text,
  locale        text,
  referer       text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index page_views_restaurant_idx on public.page_views (restaurant_id, created_at desc);

create table public.qr_scans (
  id            bigserial primary key,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  menu_id       uuid references public.menus (id) on delete cascade, -- menu-specific QR (future)
  locale        text,
  created_at    timestamptz not null default now()
);

create index qr_scans_restaurant_idx on public.qr_scans (restaurant_id, created_at desc);

create table public.language_switches (
  id            bigserial primary key,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  from_locale   text,
  to_locale     text,
  created_at    timestamptz not null default now()
);

create index language_switches_restaurant_idx on public.language_switches (restaurant_id, created_at desc);

create table public.searches (
  id            bigserial primary key,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  query         text,
  created_at    timestamptz not null default now()
);

create index searches_restaurant_idx on public.searches (restaurant_id, created_at desc);

create table public.filter_events (
  id            bigserial primary key,
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  filter_key    text, -- e.g. 'vegan', 'gluten_free'
  created_at    timestamptz not null default now()
);

create index filter_events_restaurant_idx on public.filter_events (restaurant_id, created_at desc);

-- ------------------------------------------------------------
-- Triggers: profiles on signup + updated_at everywhere
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger restaurants_updated_at before update on public.restaurants for each row execute function public.set_updated_at();
create trigger menus_updated_at before update on public.menus for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
create trigger specials_updated_at before update on public.specials for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
--
-- Owner: full CRUD on their restaurant graph.
-- Anonymous: read-only on rows belonging to a published, public
-- restaurant, plus INSERT-only on analytics tables.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menus enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.recommendations enable row level security;
alter table public.specials enable row level security;
alter table public.menu_item_dietary_labels enable row level security;
alter table public.menu_item_allergens enable row level security;
alter table public.menu_item_images enable row level security;
alter table public.menu_item_translations enable row level security;
alter table public.menu_translations enable row level security;
alter table public.category_translations enable row level security;
alter table public.restaurant_translations enable row level security;
alter table public.page_views enable row level security;
alter table public.qr_scans enable row level security;
alter table public.language_switches enable row level security;
alter table public.searches enable row level security;
alter table public.filter_events enable row level security;

-- Helper: is uid the owner of restaurant?
create or replace function public.is_restaurant_owner(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = rid and r.owner_id = auth.uid()
  );
$$;

-- Helper: is the given restaurant publicly viewable?
create or replace function public.is_restaurant_public(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = rid and r.visibility = 'public' and r.is_published
  );
$$;

-- --- profiles -------------------------------------------------
create policy "owner read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "owner update own profile" on public.profiles
  for update using (auth.uid() = id);

-- --- restaurants -----------------------------------------------
create policy "owner full access" on public.restaurants
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "public can view published restaurants" on public.restaurants
  for select using (public.is_restaurant_public(id));

-- --- menus ------------------------------------------------------
create policy "owner full access" on public.menus
  for all using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));
create policy "public can view" on public.menus
  for select using (
    public.is_restaurant_public(restaurant_id)
    and visibility = 'public'
    and is_active
  );

-- --- categories ---------------------------------------------------
create policy "owner full access" on public.categories
  for all using (public.is_restaurant_owner(
    (select restaurant_id from public.menus m where m.id = menu_id)))
  with check (public.is_restaurant_owner(
    (select restaurant_id from public.menus m where m.id = menu_id)));
create policy "public can view" on public.categories
  for select using (
    is_active
    and public.is_restaurant_public(
      (select restaurant_id from public.menus m where m.id = menu_id))
  );

-- --- menu_items ----------------------------------------------------
create policy "owner full access" on public.menu_items
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.categories c
      join public.menus m on m.id = c.menu_id where c.id = category_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.categories c
      join public.menus m on m.id = c.menu_id where c.id = category_id)));
create policy "public can view" on public.menu_items
  for select using (
    status = 'available'
    and public.is_restaurant_public(
      (select m.restaurant_id from public.categories c
        join public.menus m on m.id = c.menu_id where c.id = category_id))
  );

-- --- recommendations / specials ------------------------------------
create policy "owner full access" on public.recommendations
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));
create policy "public can view" on public.recommendations
  for select using (public.is_restaurant_public(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));

create policy "owner full access" on public.specials
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));
create policy "public can view" on public.specials
  for select using (
    (ends_on is null or ends_on >= current_date)
    and starts_on <= current_date
    and public.is_restaurant_public(
      (select m.restaurant_id from public.menu_items mi
        join public.categories c on c.id = mi.category_id
        join public.menus m on m.id = c.menu_id where mi.id = item_id))
  );

-- --- label / allergen joins ----------------------------------------
create policy "owner full access" on public.menu_item_dietary_labels
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));
create policy "public can view" on public.menu_item_dietary_labels
  for select using (public.is_restaurant_public(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));

create policy "owner full access" on public.menu_item_allergens
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));
create policy "public can view" on public.menu_item_allergens
  for select using (public.is_restaurant_public(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));

-- --- images ---------------------------------------------------------
create policy "owner full access" on public.menu_item_images
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));
create policy "public can view" on public.menu_item_images
  for select using (public.is_restaurant_public(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));

-- --- translations -----------------------------------------------------
create policy "owner full access" on public.menu_item_translations
  for all using (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)))
  with check (public.is_restaurant_owner(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));
create policy "public can view" on public.menu_item_translations
  for select using (public.is_restaurant_public(
    (select m.restaurant_id from public.menu_items mi
      join public.categories c on c.id = mi.category_id
      join public.menus m on m.id = c.menu_id where mi.id = item_id)));

create policy "owner full access" on public.menu_translations
  for all using (public.is_restaurant_owner(
    (select restaurant_id from public.menus m where m.id = menu_id)))
  with check (public.is_restaurant_owner(
    (select restaurant_id from public.menus m where m.id = menu_id)));
create policy "public can view" on public.menu_translations
  for select using (public.is_restaurant_public(
    (select restaurant_id from public.menus m where m.id = menu_id)));

create policy "owner full access" on public.category_translations
  for all using (public.is_restaurant_owner(
    (select restaurant_id from public.menus m
      where m.id = (select menu_id from public.categories c where c.id = category_id))))
  with check (public.is_restaurant_owner(
    (select restaurant_id from public.menus m
      where m.id = (select menu_id from public.categories c where c.id = category_id))));
create policy "public can view" on public.category_translations
  for select using (public.is_restaurant_public(
    (select restaurant_id from public.menus m
      where m.id = (select menu_id from public.categories c where c.id = category_id))));

create policy "owner full access" on public.restaurant_translations
  for all using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));
create policy "public can view" on public.restaurant_translations
  for select using (public.is_restaurant_public(restaurant_id));

-- --- analytics: anyone may INSERT, owner may SELECT/DELETE -------------
create policy "anyone can insert" on public.page_views for insert with check (true);
create policy "owner can read" on public.page_views for select using (public.is_restaurant_owner(restaurant_id));
create policy "owner can delete" on public.page_views for delete using (public.is_restaurant_owner(restaurant_id));

create policy "anyone can insert" on public.qr_scans for insert with check (true);
create policy "owner can read" on public.qr_scans for select using (public.is_restaurant_owner(restaurant_id));
create policy "owner can delete" on public.qr_scans for delete using (public.is_restaurant_owner(restaurant_id));

create policy "anyone can insert" on public.language_switches for insert with check (true);
create policy "owner can read" on public.language_switches for select using (public.is_restaurant_owner(restaurant_id));
create policy "owner can delete" on public.language_switches for delete using (public.is_restaurant_owner(restaurant_id));

create policy "anyone can insert" on public.searches for insert with check (true);
create policy "owner can read" on public.searches for select using (public.is_restaurant_owner(restaurant_id));
create policy "owner can delete" on public.searches for delete using (public.is_restaurant_owner(restaurant_id));

create policy "anyone can insert" on public.filter_events for insert with check (true);
create policy "owner can read" on public.filter_events for select using (public.is_restaurant_owner(restaurant_id));
create policy "owner can delete" on public.filter_events for delete using (public.is_restaurant_owner(restaurant_id));