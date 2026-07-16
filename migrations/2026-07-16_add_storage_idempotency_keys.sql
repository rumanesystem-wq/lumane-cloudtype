-- Apply before deploying the code that references request_id/source_ref.

alter table public.quotes
  add column if not exists request_id text;

create unique index if not exists quotes_request_id_unique
  on public.quotes (request_id)
  where request_id is not null;

alter table customer.install
  add column if not exists source_ref text;

create unique index if not exists install_source_ref_unique
  on customer.install (source_ref)
  where source_ref is not null;
