-- Initial schema — service order control
-- Language convention: all database identifiers in English (RNF-07).
-- Audit columns are defined here; triggers that populate them come in T-06.
-- Row Level Security is enabled in T-08.
-- gen_random_uuid() is a built-in in Postgres 13+ (no extension needed).

-- Service order lifecycle (RN-02).
create type service_order_status as enum ('open', 'in_progress', 'completed');

-- Recurring customers.
create table client (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  district text,
  reference text,
  city text default 'Timbó',
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id)
);

-- Service orders. `number` follows DDMM + letter (RN-01) and is unique.
-- Deleting a client that still has orders is blocked (on delete restrict).
create table service_order (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid not null references client (id) on delete restrict,
  opened_at date not null default current_date,
  status service_order_status not null default 'open',
  request text,
  report text,
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  warranty_months integer check (warranty_months >= 0),
  paid boolean not null default false,
  amount_paid numeric(10, 2) check (amount_paid >= 0),
  settled_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id),
  updated_by uuid not null references auth.users (id)
);

-- Line items. Free text in the MVP; catalog is future scope.
-- subtotal = quantity * unit_price is derived in the application.
create table service_order_item (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references service_order (id) on delete cascade,
  position integer not null,
  description text not null,
  quantity numeric(10, 2) not null default 1 check (quantity >= 0),
  unit_price numeric(10, 2) not null default 0 check (unit_price >= 0)
);

-- Trips (deslocamento). 0..N per order; every field optional (RN-05).
create table trip (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references service_order (id) on delete cascade,
  position integer not null,
  date date,
  km_start integer check (km_start >= 0),
  km_end integer check (km_end >= 0),
  left_shop_at time,
  arrived_at time,
  left_client_at time,
  back_shop_at time,
  vehicle text,
  signed_by text
);

-- Indexes for the common list/filter queries (status, client, period, paid).
create index idx_service_order_client_id on service_order (client_id);
create index idx_service_order_status on service_order (status);
create index idx_service_order_opened_at on service_order (opened_at);
create index idx_service_order_paid on service_order (paid);
create index idx_service_order_item_order_id on service_order_item (order_id);
create index idx_trip_order_id on trip (order_id);
