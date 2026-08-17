-- Audit on UPDATE. On INSERT the column defaults handle it:
--   created_at/updated_at default now(); created_by/updated_by default auth.uid().
-- This trigger keeps created_* immutable and bumps updated_* on every update.

create or replace function set_audit_fields_on_update()
returns trigger
language plpgsql
as $$
begin
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger trg_client_audit_update
  before update on client
  for each row execute function set_audit_fields_on_update();

create trigger trg_service_order_audit_update
  before update on service_order
  for each row execute function set_audit_fields_on_update();
