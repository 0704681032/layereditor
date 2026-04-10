create table app_user (
    id               bigserial primary key,
    username         varchar(64) not null unique,
    password_hash    varchar(255) not null,
    created_at       timestamptz not null default now()
);

create table editor_document (
    id               bigserial primary key,
    owner_id         bigint not null references app_user(id),
    title            varchar(200) not null,
    status           varchar(32) not null default 'draft',
    schema_version   int not null default 1,
    current_version  int not null default 1,
    content          jsonb not null,
    cover_asset_id   bigint,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    deleted_at       timestamptz
);

create index idx_editor_document_owner_updated
    on editor_document(owner_id, updated_at desc);

create table editor_asset (
    id               bigserial primary key,
    owner_id         bigint not null references app_user(id),
    document_id      bigint references editor_document(id),
    kind             varchar(32) not null,
    filename         varchar(255) not null,
    mime_type        varchar(100) not null,
    bucket           varchar(100) not null,
    storage_key      varchar(500) not null unique,
    file_size        bigint not null,
    width            int,
    height           int,
    sha256           varchar(64),
    created_at       timestamptz not null default now(),
    deleted_at       timestamptz
);

create index idx_editor_asset_document
    on editor_asset(document_id);

create table editor_document_revision (
    id               bigserial primary key,
    document_id      bigint not null references editor_document(id) on delete cascade,
    version_no       int not null,
    snapshot         jsonb not null,
    message          varchar(255),
    created_by       bigint references app_user(id),
    created_at       timestamptz not null default now(),
    unique(document_id, version_no)
);

alter table editor_document
    add constraint fk_editor_document_cover_asset
    foreign key (cover_asset_id) references editor_asset(id);
