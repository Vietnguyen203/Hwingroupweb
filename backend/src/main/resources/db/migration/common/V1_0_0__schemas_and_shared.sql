-- Mỗi bounded context một schema. Không có foreign key xuyên schema.
create schema if not exists identity;
create schema if not exists catalog;
create schema if not exists ordering;
create schema if not exists customer;
create schema if not exists affiliate;
create schema if not exists audit;

-- Tìm kiếm không dấu
create extension if not exists unaccent with schema public;
create extension if not exists pg_trgm with schema public;

-- unaccent() không IMMUTABLE nên không dùng được trong index/generated column -> bọc lại
create or replace function public.f_unaccent(text) returns text
    language sql immutable parallel safe strict
as $$ select public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Spring Modulith Event Publication Registry (JPA)
create table public.event_publication
(
    id                     uuid         not null primary key,
    listener_id            varchar(512) not null,
    event_type             varchar(512) not null,
    serialized_event       text         not null,
    publication_date       timestamptz  not null,
    completion_date        timestamptz,
    last_resubmission_date timestamptz,
    completion_attempts    integer      not null default 0,
    status                 varchar(32)
);
create index idx_event_publication_incomplete on public.event_publication (completion_date)
    where completion_date is null;

-- Nhật ký kiểm toán: chỉ ghi thêm
create table audit.audit_log
(
    id             uuid primary key default gen_random_uuid(),
    module         varchar(32)  not null,
    aggregate_type varchar(64)  not null,
    aggregate_id   varchar(64)  not null,
    action         varchar(64)  not null,
    actor_id       uuid  ,
    amount         bigint,
    detail         jsonb        not null default '{}'::jsonb,
    created_at     timestamptz  not null default now()
);
create index idx_audit_log_aggregate on audit.audit_log (aggregate_type, aggregate_id);

create or replace function audit.forbid_modification() returns trigger
    language plpgsql
as $$
begin
    raise exception 'audit_log là bảng chỉ ghi thêm (append-only)';
end;
$$;

create trigger trg_audit_log_append_only
    before update or delete on audit.audit_log
    for each row execute function audit.forbid_modification();
