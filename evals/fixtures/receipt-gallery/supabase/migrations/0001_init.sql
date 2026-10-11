create table groups (id uuid primary key default gen_random_uuid(), name text not null);
create table memberships (group_id uuid references groups on delete cascade, user_id uuid not null, primary key (group_id, user_id));
create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  title text not null,
  amount_cents integer not null,
  paid_by uuid not null
);
create table receipts (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses on delete cascade,
  path text not null,
  uploaded_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table expenses enable row level security;
alter table receipts enable row level security;

create policy "members read expenses" on expenses for select
  using (exists (select 1 from memberships m where m.group_id = expenses.group_id and m.user_id = auth.uid()));
create policy "members read receipts" on receipts for select
  using (exists (select 1 from expenses e join memberships m on m.group_id = e.group_id
                 where e.id = receipts.expense_id and m.user_id = auth.uid()));
create policy "members add receipts" on receipts for insert
  with check (exists (select 1 from expenses e join memberships m on m.group_id = e.group_id
                      where e.id = receipts.expense_id and m.user_id = auth.uid()));
