-- Audit triggers — populate created_*/updated_* from the current user.
-- created_by/created_at are immutable after insert; updated_* change on every write.
-- auth.uid() is provided by Supabase (the authenticated user's id).

-- BEFORE INSERT: stamp both created and updated audit fields.
create or replace function set_audit_fields_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  new.updated_at := now();
  new.created_by := coalesce(new.created_by, auth.uid());
  new.updated_by := coalesce(new.updated_by, auth.uid());
  return new;
end;
$$;

-- BEFORE UPDATE: bump updated_*, keep created_* immutable.
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

create trigger trg_client_audit_insert
  before insert on client
  for each row execute function set_audit_fields_on_insert();

create trigger trg_client_audit_update
  before update on client
  for each row execute function set_audit_fields_on_update();

create trigger trg_service_order_audit_insert
  before insert on service_order
  for each row execute function set_audit_fields_on_insert();

create trigger trg_service_order_audit_update
  before update on service_order
  for each row execute function set_audit_fields_on_update();
