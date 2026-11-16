create table identity.user_account
(
    id            bigint generated always as identity primary key,
    phone         varchar(16) unique,
    email         varchar(255) unique,
    password_hash varchar(100),
    full_name     varchar(100),
    status        varchar(16)  not null check (status in ('ACTIVE', 'LOCKED')),
    last_login_at timestamptz,
    version       bigint       not null default 0,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now(),
    constraint ck_user_account_identifier check (phone is not null or email is not null)
);

create table identity.user_role
(
    user_id bigint      not null references identity.user_account (id) on delete cascade,
    role    varchar(16) not null check (role in ('CUSTOMER', 'AFFILIATE', 'ADMIN')),
    primary key (user_id, role)
);

create table identity.refresh_token
(
    id             bigint generated always as identity primary key,
    user_id        bigint       not null references identity.user_account (id) on delete cascade,
    token_hash     varchar(64)  not null unique,
    family_id      uuid         not null,
    expires_at     timestamptz  not null,
    revoked_at     timestamptz,
    replaced_by_id bigint,
    user_agent     varchar(255),
    ip_hash        varchar(64),
    created_at     timestamptz  not null default now()
);
create index idx_refresh_token_user on identity.refresh_token (user_id);
create index idx_refresh_token_family on identity.refresh_token (family_id);
