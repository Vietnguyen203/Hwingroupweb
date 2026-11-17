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

-- UUID v7 (RFC 9562): 48 bit thời gian (ms) + ngẫu nhiên -> có thứ tự theo thời gian, index B-tree gọn.
-- Dùng làm DEFAULT cho mọi cột id. Postgres 18 có sẵn uuidv7(); Postgres 17 chưa có nên tự định nghĩa.
-- Cách làm: lấy UUID v4 ngẫu nhiên, ghi đè 6 byte đầu bằng timestamp ms, đổi version 4 -> 7 (bật bit 52, 53).
create or replace function public.uuid_generate_v7() returns uuid
    language sql volatile parallel safe
as $$
select encode(
           set_bit(set_bit(
               overlay(uuid_send(gen_random_uuid())
                       placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
                       from 1 for 6),
               52, 1), 53, 1),
           'hex')::uuid
$$;

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
create table audit.audit_logs
(
    id             uuid primary key default public.uuid_generate_v7(),
    module         varchar(32)  not null,
    aggregate_type varchar(64)  not null,
    aggregate_id   varchar(64)  not null,
    action         varchar(64)  not null,
    actor_id       uuid  ,
    amount         bigint,
    detail         jsonb        not null default '{}'::jsonb,
    created_at     timestamptz  not null default now()
);
create index idx_audit_log_aggregate on audit.audit_logs (aggregate_type, aggregate_id);

create or replace function audit.forbid_modification() returns trigger
    language plpgsql
as $$
begin
    raise exception 'audit_log là bảng chỉ ghi thêm (append-only)';
end;
$$;

create trigger trg_audit_log_append_only
    before update or delete on audit.audit_logs
    for each row execute function audit.forbid_modification();

-- Chú thích bảng / cột
comment on table audit.audit_logs is 'Nhật ký thay đổi liên quan tới tiền. Chỉ INSERT – trigger chặn UPDATE/DELETE';
comment on table public.event_publication is 'Spring Modulith: event nội bộ giữa các module; completion_date null = chưa xử lý xong (sẽ phát lại)';
