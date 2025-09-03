-- seasons
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,          -- e.g., 'S26'
  age_cutoff date not null,
  timezone text not null default 'Europe/London',
  created_at timestamptz default now()
);

-- entrants (managers)
create table if not exists entrants (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  manager text not null,
  club text not null,
  rating int,                         -- for seeding pots
  email text,                          -- optional for self-report login/magic link later
  created_at timestamptz default now()
);

-- groups (A, B, C...)
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  code text not null                   -- 'A', 'B', ...
);

-- group_members
create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  entrant_id uuid references entrants(id) on delete cascade,
  seed int                             -- seeding pot/order at draw
);

-- fixtures (groups + knockouts)
create type stage_t as enum ('groups','youth_cup','youth_shield');
create type leg_t as enum ('single','first','second');

create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  stage stage_t not null,                     -- groups / youth_cup / youth_shield
  group_id uuid references groups(id),
  round_label text not null,                  -- 'Group R1', 'Cup R32', 'Cup QF', 'Shield R1', etc.
  leg leg_t default 'single',
  home_entrant_id uuid references entrants(id) on delete set null,
  away_entrant_id uuid references entrants(id) on delete set null,
  scheduled_at timestamptz,                   -- actual date/time (Europe/London)
  home_score int,
  away_score int,
  status text not null default 'pending',     -- pending/reported/confirmed/disputed/forfeit
  notes text,
  created_at timestamptz default now()
);

-- result_reports (self-reporting by managers)
create table if not exists result_reports (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid references fixtures(id) on delete cascade,
  submitted_by_entrant uuid references entrants(id) on delete set null,
  home_score int,
  away_score int,
  flags jsonb default '{}'::jsonb,           -- { "forfeit": true, "overage": true, "comment": "..." }
  created_at timestamptz default now()
);

-- penalties (points deductions etc.)
create table if not exists penalties (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  entrant_id uuid references entrants(id) on delete cascade,
  points int not null default 0,
  reason text,
  created_at timestamptz default now()
);