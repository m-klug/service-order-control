-- Row Level Security.
-- Single-operator internal app: authenticated users have full access;
-- anon is denied (no policy grants it anything). Ready to tighten per-user
-- if the app scales to multiple operators (created_by is already tracked).

alter table client enable row level security;
alter table service_order enable row level security;
alter table service_order_item enable row level security;
alter table trip enable row level security;

create policy client_authenticated_all on client
  for all to authenticated using (true) with check (true);

create policy service_order_authenticated_all on service_order
  for all to authenticated using (true) with check (true);

create policy service_order_item_authenticated_all on service_order_item
  for all to authenticated using (true) with check (true);

create policy trip_authenticated_all on trip
  for all to authenticated using (true) with check (true);

-- Table privileges for the authenticated role. anon is intentionally omitted,
-- so it stays fully denied. RLS policies above still gate the rows.
grant select, insert, update, delete
  on client, service_order, service_order_item, trip
  to authenticated;
